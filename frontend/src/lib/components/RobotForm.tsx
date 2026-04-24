"use client";

import { FormEvent, useMemo, useState } from "react";
import { RobotRecord } from "@/lib/api";
import {
  buildFieldSchemaFromRobot,
  FieldSchema,
  parseFormBySchema,
  toFormStrings,
  validateRobotFormValues,
} from "@/lib/robotFields";

type RobotFormProps = {
  initialData?: Partial<RobotRecord> | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitLabel: string;
  isEdit?: boolean;
};

export default function RobotForm({
  initialData,
  onSubmit,
  submitLabel,
  isEdit = false,
}: RobotFormProps) {
  const schema = useMemo(
    () => buildFieldSchemaFromRobot(initialData),
    [initialData],
  );
  const initialValues = useMemo(
    () => toFormStrings(schema, isEdit ? initialData : undefined),
    [schema, initialData, isEdit],
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addCustomField() {
    const key = customKey.trim();
    if (!key) return;

    if (schema.some((field) => field.key === key) || key in extraValues) {
      setError(`Field ${key} already exists`);
      return;
    }

    setExtraValues((prev) => ({ ...prev, [key]: customValue.trim() }));
    setCustomKey("");
    setCustomValue("");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const validationErrors = validateRobotFormValues(values, { isEdit });
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(". "));
      }

      const payload = parseFormBySchema(schema as FieldSchema[], values, {
        omitBlankId: !isEdit,
      });

      if (typeof payload.status === "string") {
        payload.status = payload.status.toLowerCase();
      }

      Object.entries(extraValues).forEach(([key, value]) => {
        payload[key] = value;
      });

      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit form",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {schema.map((field) => {
          const disabled = isEdit && field.key === "id";

          return (
            <label key={field.key} className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                {field.key}
              </span>
              <input
                type={field.type === "number" ? "number" : "text"}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-offset-2 transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300 disabled:bg-slate-100"
                value={values[field.key] ?? ""}
                onChange={(event) => setValue(field.key, event.target.value)}
                disabled={disabled}
                placeholder={field.key}
              />
            </label>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Add custom field
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="field_name"
            value={customKey}
            onChange={(event) => setCustomKey(event.target.value)}
          />
          <input
            type="text"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="value"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            onClick={addCustomField}
          >
            Add
          </button>
        </div>

        {Object.keys(extraValues).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(extraValues).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
