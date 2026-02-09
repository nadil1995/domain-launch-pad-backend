import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface UsageData {
  period: { from: string; to: string };
  summary: {
    totalConversions: number;
    totalInputBytes: number;
    totalOutputBytes: number;
    avgDurationMs: number;
    currentMonthCount: number;
  };
  byFormat: Record<string, number>;
  byDay: Record<string, number>;
}

export function UsagePage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<UsageData>("/usage", { token })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-sm text-gray-500">Loading usage...</p>;

  const quota = 100;
  const used = data?.summary.currentMonthCount ?? 0;
  const isPaid = user?.plan === "PAY_AS_YOU_GO";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Usage</h2>

      {/* Quota card */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">This month</p>
            <p className="text-3xl font-bold text-gray-900">{used}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${isPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {user?.plan === "PAY_AS_YOU_GO" ? "Pay-as-you-go" : "Free"}
            </span>
            {!isPaid && (
              <p className="mt-1 text-xs text-gray-400">{used}/{quota} conversions</p>
            )}
          </div>
        </div>
        {!isPaid && (
          <div className="mt-3 h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min((used / quota) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Conversions", value: data.summary.totalConversions },
            { label: "Input", value: formatBytes(data.summary.totalInputBytes) },
            { label: "Output", value: formatBytes(data.summary.totalOutputBytes) },
            { label: "Avg time", value: `${data.summary.avgDurationMs}ms` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border bg-white p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* By format */}
      {data && Object.keys(data.byFormat).length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">By format</h3>
          <div className="space-y-2">
            {Object.entries(data.byFormat)
              .sort((a, b) => b[1] - a[1])
              .map(([fmt, count]) => (
                <div key={fmt} className="flex items-center justify-between text-sm">
                  <span className="font-mono uppercase text-gray-600">{fmt}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* By day */}
      {data && Object.keys(data.byDay).length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Daily activity</h3>
          <div className="space-y-1">
            {Object.entries(data.byDay)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 14)
              .map(([day, count]) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{day}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
