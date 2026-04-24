"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RobotForm from "@/components/RobotForm";
import Toast from "@/components/Toast";
import { deleteRobot, getRobotById, RobotRecord, updateRobot } from "@/lib/api";

export default function RobotDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const robotId = params.id;

  const [robot, setRobot] = useState<RobotRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  useEffect(() => {
    async function loadRobot() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getRobotById(robotId);
        setRobot(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load robot",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRobot();
  }, [robotId]);

  async function handleUpdate(payload: Record<string, unknown>) {
    const updated = await updateRobot(robotId, payload);
    setRobot(updated);
    setToast({ message: "Robot updated", tone: "success" });
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this robot permanently?");
    if (!confirmed) return;

    try {
      await deleteRobot(robotId);
      setToast({ message: "Robot deleted", tone: "success" });
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (deleteError) {
      setToast({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete robot",
        tone: "error",
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} tone={toast.tone} />}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Robot Details</h1>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            Delete Robot
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading && (
          <p className="text-sm text-slate-600">Loading robot data...</p>
        )}
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {!isLoading && !error && robot && (
          <RobotForm
            initialData={robot}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isEdit
          />
        )}
      </section>
    </main>
  );
}
