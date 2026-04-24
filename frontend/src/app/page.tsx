"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import BatteryBar from "@/components/BatteryBar";
import StatusBadge from "@/components/StatusBadge";
import {
  deleteRobot,
  getAllKeys,
  getRobots,
  RobotListResponse,
  RobotRecord,
} from "@/lib/api";

function renderValue(key: string, value: unknown) {
  if (key === "status") {
    return <StatusBadge value={value} />;
  }

  if (key === "battery") {
    return <BatteryBar value={value} />;
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  const text = String(value);
  return <span className="block max-w-[280px] truncate">{text}</span>;
}

function getRobotIdentifier(robot: RobotRecord) {
  const directId = robot.id;
  if (
    directId !== null &&
    directId !== undefined &&
    String(directId).trim() !== ""
  ) {
    return String(directId);
  }

  const fallbackId = robot.robot_id;
  if (
    fallbackId !== null &&
    fallbackId !== undefined &&
    String(fallbackId).trim() !== ""
  ) {
    return String(fallbackId);
  }

  return "";
}

export default function DashboardPage() {
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [deletingRobotId, setDeletingRobotId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  const { data, error, isLoading, mutate } = useSWR<RobotListResponse>(
    ["robots", status, location, search, page, limit],
    async () =>
      getRobots({
        status: status || undefined,
        location: location || undefined,
        search: search || undefined,
        page,
        limit,
      }),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
    },
  );

  const rows: RobotRecord[] = data?.data ?? [];
  const pagination =
    data?.pagination ||
    ({
      page: 1,
      limit,
      total: 0,
      totalPages: 1,
    } as RobotListResponse["pagination"]);
  const keys = useMemo(() => getAllKeys(data?.data ?? []), [data?.data]);

  async function handleDelete(robot: RobotRecord) {
    const robotId = getRobotIdentifier(robot);
    if (!robotId) return;

    const confirmed = window.confirm(`Delete robot ${robotId}?`);
    if (!confirmed) return;

    try {
      setDeletingRobotId(robotId);
      setActionMessage("");
      await deleteRobot(robotId);
      setActionMessage(`Robot ${robotId} deleted successfully.`);
      await mutate();
    } catch (deleteError) {
      setActionMessage(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete robot.",
      );
    } finally {
      setDeletingRobotId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="surface-glass mb-6 rounded-2xl border border-cyan-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              ROBOX Operations
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Robot Fleet Management Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor robots, inspect telemetry, and manage fleet records in
              real time.
            </p>
          </div>

          <Link
            href="/robots/new"
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-cyan-500"
          >
            Add Robot
          </Link>
        </div>
      </header>

      <section className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Search across all fields"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
        />

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="error">Error</option>
        </select>

        <input
          value={location}
          onChange={(event) => {
            setPage(1);
            setLocation(event.target.value);
          }}
          placeholder="Filter by location"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
        />

        <select
          value={String(limit)}
          onChange={(event) => {
            setPage(1);
            setLimit(Number(event.target.value));
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
        >
          <option value="10">10 per page</option>
          <option value="15">15 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>

        <button
          onClick={() => mutate()}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Refresh
        </button>
      </section>

      {actionMessage && (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          {actionMessage}
        </section>
      )}

      {isLoading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Loading robots...
        </section>
      )}

      {!isLoading && error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm font-medium text-rose-700 shadow-sm">
          {error instanceof Error ? error.message : "Failed to load robots"}
        </section>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          No robots found. Try changing filters or add a new robot.
        </section>
      )}

      {!isLoading && !error && rows.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  {keys.map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold">
                      {key}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((robot, rowIndex) => (
                  <tr
                    key={String(getRobotIdentifier(robot) || `row-${rowIndex}`)}
                    className="border-t border-slate-100 hover:bg-slate-50/80"
                  >
                    {keys.map((key) => (
                      <td key={key} className="px-4 py-3 text-slate-700">
                        {renderValue(key, robot[key])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {(() => {
                        const robotId = getRobotIdentifier(robot);

                        if (!robotId) {
                          return (
                            <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                              No ID
                            </span>
                          );
                        }

                        return (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Link
                              href={`/robots/${encodeURIComponent(robotId)}`}
                              className="inline-flex rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                            >
                              Details
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(robot)}
                              disabled={deletingRobotId === robotId}
                              className="inline-flex rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingRobotId === robotId
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-slate-600">
          Showing page {pagination.page} of {pagination.totalPages} (
          {pagination.total} records)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </footer>
    </main>
  );
}
