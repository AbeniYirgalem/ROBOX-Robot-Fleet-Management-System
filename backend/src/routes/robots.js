const express = require("express");
const { readRobots, writeRobots, findRobotIndexById } = require("../dataStore");

const router = express.Router();
const REQUIRED_FIELDS = ["name", "status", "battery", "location", "model"];
const ALLOWED_STATUSES = ["active", "idle", "error"];

function generateRobotId(robots) {
  const ids = robots
    .map((robot) => String(robot.id ?? robot.robot_id ?? "").trim())
    .filter(Boolean);

  let maxNumeric = 0;
  let padLength = 3;

  ids.forEach((id) => {
    const match = id.match(/^(?:[A-Za-z]*)(\d+)$/);
    if (!match) return;

    const numericPart = Number(match[1]);
    if (!Number.isFinite(numericPart)) return;

    maxNumeric = Math.max(maxNumeric, numericPart);
    padLength = Math.max(padLength, match[1].length);
  });

  const nextNumeric = maxNumeric + 1;
  return `R${String(nextNumeric).padStart(padLength, "0")}`;
}

function normalize(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).toLowerCase().trim();
}

function getComparableId(robot) {
  const rawId = String(robot.id ?? robot.robot_id ?? "").trim();
  const match = rawId.match(/^([A-Za-z]*)(\d+)$/);

  if (!match) {
    return {
      prefix: "",
      number: Number.MAX_SAFE_INTEGER,
      raw: rawId,
      hasNumericPattern: false,
    };
  }

  return {
    prefix: match[1].toUpperCase(),
    number: Number(match[2]),
    raw: rawId,
    hasNumericPattern: true,
  };
}

function sortByRobotId(robots) {
  return [...robots].sort((a, b) => {
    const aId = getComparableId(a);
    const bId = getComparableId(b);

    if (aId.hasNumericPattern && bId.hasNumericPattern) {
      if (aId.prefix !== bId.prefix) {
        return aId.prefix.localeCompare(bId.prefix);
      }

      if (aId.number !== bId.number) {
        return aId.number - bId.number;
      }

      return aId.raw.localeCompare(bId.raw);
    }

    if (aId.hasNumericPattern && !bId.hasNumericPattern) return -1;
    if (!aId.hasNumericPattern && bId.hasNumericPattern) return 1;

    return aId.raw.localeCompare(bId.raw);
  });
}

function validateRobotPayload(robot, options = {}) {
  const { requireAllCoreFields = false } = options;

  if (!robot || typeof robot !== "object" || Array.isArray(robot)) {
    return "Request body must be a JSON object";
  }

  if (requireAllCoreFields) {
    for (const field of REQUIRED_FIELDS) {
      const value = robot[field];
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return `${field} is required`;
      }
    }
  }

  if (robot.id !== undefined && String(robot.id).trim() === "") {
    return "id cannot be empty";
  }

  if (
    robot.status !== undefined &&
    robot.status !== null &&
    String(robot.status).trim() !== ""
  ) {
    const status = normalize(robot.status);
    if (!ALLOWED_STATUSES.includes(status)) {
      return "status must be one of: active, idle, error";
    }
  }

  if (
    robot.battery !== undefined &&
    robot.battery !== null &&
    String(robot.battery).trim() !== ""
  ) {
    const battery = Number(robot.battery);
    if (!Number.isFinite(battery)) {
      return "battery must be a number";
    }
    if (battery < 0 || battery > 100) {
      return "battery must be between 0 and 100";
    }
  }

  return null;
}

router.get("/", async (req, res) => {
  try {
    const robots = await readRobots();
    const { status, location, page, limit, search } = req.query;

    let filtered = sortByRobotId(robots);

    if (status) {
      const statusValue = normalize(status);
      filtered = filtered.filter(
        (robot) => normalize(robot.status) === statusValue,
      );
    }

    if (location) {
      const locationValue = normalize(location);
      filtered = filtered.filter((robot) =>
        normalize(robot.location).includes(locationValue),
      );
    }

    if (search) {
      const searchValue = normalize(search);
      filtered = filtered.filter((robot) =>
        Object.values(robot || {}).some((value) =>
          normalize(value).includes(searchValue),
        ),
      );
    }

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || filtered.length || 10;

    if (parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({
        error: "Invalid pagination",
        message: "page and limit must be positive numbers",
      });
    }

    const start = (parsedPage - 1) * parsedLimit;
    const paged = filtered.slice(start, start + parsedLimit);

    return res.status(200).json({
      data: paged,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / parsedLimit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load robots",
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const robots = await readRobots();
    const robot = robots.find(
      (item) => String(item.id) === String(req.params.id),
    );

    if (!robot) {
      return res.status(404).json({
        error: "Robot not found",
        message: `No robot found with id ${req.params.id}`,
      });
    }

    return res.status(200).json(robot);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load robot",
      message: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const robots = await readRobots();
    const payload = req.body;

    const payloadValidationError = validateRobotPayload(payload, {
      requireAllCoreFields: true,
    });

    if (payloadValidationError) {
      return res.status(400).json({
        error: "Invalid payload",
        message: payloadValidationError,
      });
    }

    const keys = Object.keys(payload);
    if (keys.length === 0) {
      return res.status(400).json({
        error: "Empty payload",
        message: "Request body must include at least one robot field",
      });
    }

    const id = payload.id ?? generateRobotId(robots);
    const exists = robots.some((robot) => String(robot.id) === String(id));

    if (exists) {
      return res.status(400).json({
        error: "Duplicate id",
        message: `A robot with id ${id} already exists`,
      });
    }

    const newRobot = {
      ...payload,
      id,
      status:
        payload.status !== undefined
          ? normalize(payload.status)
          : payload.status,
    };
    robots.push(newRobot);
    await writeRobots(robots);

    return res.status(201).json(newRobot);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create robot",
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const robots = await readRobots();
    const payload = req.body;

    const payloadValidationError = validateRobotPayload(payload);
    if (payloadValidationError) {
      return res.status(400).json({
        error: "Invalid payload",
        message: payloadValidationError,
      });
    }

    const index = findRobotIndexById(robots, req.params.id);
    if (index === -1) {
      return res.status(404).json({
        error: "Robot not found",
        message: `No robot found with id ${req.params.id}`,
      });
    }

    const existing = robots[index];
    const merged = {
      ...existing,
      ...payload,
      id: existing.id,
      status:
        payload.status !== undefined
          ? normalize(payload.status)
          : existing.status,
    };

    const mergedValidationError = validateRobotPayload(merged, {
      requireAllCoreFields: true,
    });

    if (mergedValidationError) {
      return res.status(400).json({
        error: "Invalid update",
        message: mergedValidationError,
      });
    }

    robots[index] = merged;
    await writeRobots(robots);

    return res.status(200).json(merged);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update robot",
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const robots = await readRobots();
    const index = findRobotIndexById(robots, req.params.id);

    if (index === -1) {
      return res.status(404).json({
        error: "Robot not found",
        message: `No robot found with id ${req.params.id}`,
      });
    }

    const [removed] = robots.splice(index, 1);
    await writeRobots(robots);

    return res.status(200).json({
      message: "Robot deleted",
      data: removed,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete robot",
      message: error.message,
    });
  }
});

module.exports = router;
