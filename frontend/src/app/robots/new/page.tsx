"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RobotForm from "@/components/RobotForm";
import Toast from "@/components/Toast";
import { createRobot, getRobots, RobotRecord } from "@/lib/api";

export default function AddRobotPage() {
  const router = useRouter();
  const [sampleRobot, setSampleRobot] = useState<Partial<RobotRecord> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function loadSchema() {
      try {
        setIsLoading(true);
        const response = await getRobots({ page: 1, limit: 1 });
        setSampleRobot(response.data[0] || null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load robot schema",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSchema();
  }, []);

  async function handleCreate(payload: Record<string, unknown>) {
    const created = await createRobot(payload);
    setToast("Robot created successfully");

    setTimeout(() => {
      router.push(`/robots/${created.id}`);
    }, 700);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {toast && <Toast message={toast} />}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Add Robot</h1>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading && (
          <p className="text-sm text-slate-600">Loading form fields...</p>
        )}
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {!isLoading && !error && (
          <RobotForm
            initialData={sampleRobot}
            onSubmit={handleCreate}
            submitLabel="Create Robot"
          />
        )}
      </section>
    </main>
  );
}
