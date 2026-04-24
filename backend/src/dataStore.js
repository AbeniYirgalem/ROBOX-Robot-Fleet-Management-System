const fs = require("fs/promises");
const path = require("path");
const { DATA_FILE } = require("./config");

async function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function parseRobotsFile(rawContent) {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const normalized = rawContent.replace(/^\uFEFF/, "");
  const parsed = JSON.parse(normalized);
  return Array.isArray(parsed) ? parsed : [];
}

async function readRobots() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return parseRobotsFile(raw);
}

async function writeRobots(robots) {
  if (!Array.isArray(robots)) {
    throw new Error("Robots payload must be an array");
  }

  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(robots, null, 2), "utf-8");
}

function findRobotIndexById(robots, id) {
  return robots.findIndex((robot) => String(robot.id) === String(id));
}

module.exports = {
  readRobots,
  writeRobots,
  findRobotIndexById,
};
