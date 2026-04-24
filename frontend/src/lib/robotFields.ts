import { RobotRecord } from "./api";

export type FieldSchema = {
  key: string;
  type: "text" | "number" | "boolean";
};

const REQUIRED_CREATE_FIELDS = [
  "name",
  "status",
  "battery",
  "location",
  "model",
];
const VALID_STATUSES = ["active", "idle", "error"];

const FALLBACK_FIELDS: FieldSchema[] = [
  { key: "id", type: "text" },
  { key: "name", type: "text" },
  { key: "status", type: "text" },
  { key: "battery", type: "number" },
  { key: "location", type: "text" },
  { key: "model", type: "text" },
  { key: "lastMaintenance", type: "text" },
];

export function detectFieldType(value: unknown): FieldSchema["type"] {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "text";
}

export function buildFieldSchemaFromRobot(robot?: Partial<RobotRecord> | null) {
  if (!robot || Object.keys(robot).length === 0) {
    return FALLBACK_FIELDS;
  }

  return Object.keys(robot).map((key) => ({
    key,
    type: detectFieldType(robot[key]),
  }));
}

export function toFormStrings(
  schema: FieldSchema[],
  source?: Partial<RobotRecord> | null,
): Record<string, string> {
  const map: Record<string, string> = {};

  schema.forEach((field) => {
    const value = source?.[field.key];
    if (value === undefined || value === null) {
      map[field.key] = "";
      return;
    }

    map[field.key] = String(value);
  });

  return map;
}

export function parseFormBySchema(
  schema: FieldSchema[],
  values: Record<string, string>,
  options?: { omitBlankId?: boolean },
) {
  const payload: Record<string, unknown> = {};

  schema.forEach((field) => {
    const raw = values[field.key] ?? "";
    const trimmed = raw.trim();

    if (field.key === "id" && options?.omitBlankId && trimmed === "") {
      return;
    }

    if (field.type === "number") {
      if (trimmed === "") {
        payload[field.key] = null;
      } else {
        const parsed = Number(trimmed);
        payload[field.key] = Number.isNaN(parsed) ? trimmed : parsed;
      }
      return;
    }

    if (field.type === "boolean") {
      payload[field.key] = trimmed.toLowerCase() === "true";
      return;
    }

    payload[field.key] = trimmed;
  });

  return payload;
}

export function validateRobotFormValues(
  values: Record<string, string>,
  options?: { isEdit?: boolean },
) {
  const errors: string[] = [];
  const isEdit = options?.isEdit === true;

  if (!isEdit) {
    REQUIRED_CREATE_FIELDS.forEach((field) => {
      const value = (values[field] ?? "").trim();
      if (!value) {
        errors.push(`${field} is required`);
      }
    });
  }

  const idValue = (values.id ?? "").trim();
  if (idValue === "") {
    // id is optional on create; backend can generate it.
  }

  const statusValue = (values.status ?? "").trim().toLowerCase();
  if (statusValue && !VALID_STATUSES.includes(statusValue)) {
    errors.push("status must be one of: active, idle, error");
  }

  const batteryValue = (values.battery ?? "").trim();
  if (batteryValue) {
    const parsedBattery = Number(batteryValue);
    if (Number.isNaN(parsedBattery)) {
      errors.push("battery must be a number");
    } else if (parsedBattery < 0 || parsedBattery > 100) {
      errors.push("battery must be between 0 and 100");
    }
  }

  return errors;
}
