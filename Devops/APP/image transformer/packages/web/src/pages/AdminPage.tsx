import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";

/* ── Types ──────────────────────────────────────────────── */

interface OverviewData {
  totalUsers: number;
  paidUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalConversions: number;
  conversionsThisMonth: number;
  totalDataProcessedBytes: number;
  mrr: number;
  paygRevenueThisMonth: number;
}

interface UserData {
  planDistribution: { plan: string; count: number }[];
  userGrowth: { date: string; total: number; cumulative: number }[];
  topUsers: { id: string; email: string; name: string | null; plan: string; conversions: number; lastActive: string | null }[];
  total: number;
}

interface ConversionData {
  byDay: { date: string; count: number }[];
  byFormat: { format: string; count: number }[];
  byPlan: { plan: string; count: number }[];
  avgDurationMs: number;
  avgInputBytes: number;
  avgOutputBytes: number;
  total: number;
}

interface RevenueData {
  mrr: number;
  mrrByPlan: { plan: string; users: number; pricePerUser: number; revenue: number }[];
  paygRevenueThisMonth: number;
  revenueOverTime: { date: string; mrr: number }[];
  paidUserGrowth: { date: string; count: number; cumulative: number }[];
}

/* ── Helpers ────────────────────────────────────────────── */

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── KpiCard ────────────────────────────────────────────── */

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────────────── */

type Tab = "overview" | "users" | "conversions" | "revenue";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "conversions", label: "Conversions" },
  { key: "revenue", label: "Revenue" },
];

/* ── Main component ─────────────────────────────────────── */

export function AdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [error, setError] = useState("");

  // Data per tab
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserData | null>(null);
  const [conversions, setConversions] = useState<ConversionData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch when tab or date range changes
  useEffect(() => {
    setError("");
    setLoading(true);

    const qs = `from=${from}&to=${to}`;

    const fetcher = async () => {
      switch (tab) {
        case "overview":
          setOverview(await api<OverviewData>("/admin/overview", { token }));
          break;
        case "users":
          setUsers(await api<UserData>(`/admin/users?${qs}&limit=20&offset=0`, { token }));
          break;
        case "conversions":
          setConversions(await api<ConversionData>(`/admin/conversions?${qs}`, { token }));
          break;
        case "revenue":
          setRevenue(await api<RevenueData>(`/admin/revenue?${qs}`, { token }));
          break;
      }
    };

    fetcher()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab, from, to, token]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>

      {/* Tab bar + date range */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "overview" && (
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
            <label className="text-gray-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Overview */}
      {tab === "overview" && overview && !loading && <OverviewTab data={overview} />}

      {/* Users */}
      {tab === "users" && users && !loading && <UsersTab data={users} />}

      {/* Conversions */}
      {tab === "conversions" && conversions && !loading && <ConversionsTab data={conversions} />}

      {/* Revenue */}
      {tab === "revenue" && revenue && !loading && <RevenueTab data={revenue} />}
    </div>
  );
}

/* ── Overview Tab ────────────────────────────────────────── */

function OverviewTab({ data }: { data: OverviewData }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <KpiCard label="Total Users" value={data.totalUsers.toLocaleString()} />
      <KpiCard label="Paid Users" value={data.paidUsers.toLocaleString()} />
      <KpiCard label="MRR" value={formatCurrency(data.mrr)} />
      <KpiCard label="Active Users (7d)" value={data.activeUsers7d.toLocaleString()} />
      <KpiCard label="Active Users (30d)" value={data.activeUsers30d.toLocaleString()} />
      <KpiCard label="Conversions This Month" value={data.conversionsThisMonth.toLocaleString()} />
      <KpiCard label="Total Conversions" value={data.totalConversions.toLocaleString()} />
      <KpiCard label="Data Processed" value={formatBytes(data.totalDataProcessedBytes)} />
      <KpiCard label="PAYG Revenue (Month)" value={formatCurrency(data.paygRevenueThisMonth)} />
    </div>
  );
}

/* ── Users Tab ──────────────────────────────────────────── */

function UsersTab({ data }: { data: UserData }) {
  const pieData = data.planDistribution.map((p) => ({ name: p.plan, value: p.count }));

  const growthChart = data.userGrowth.map((g) => ({
    date: g.date.slice(5),
    daily: g.total,
    cumulative: g.cumulative,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan distribution */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User growth */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={growthChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="daily" stroke="#3b82f6" strokeWidth={2} dot={false} name="Daily Signups" />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={false} name="Cumulative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top users table */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Top Users by Conversions
          <span className="ml-2 text-xs font-normal text-gray-400">({data.total} total users)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium text-right">Conversions</th>
                <th className="pb-2 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2 text-gray-600">{u.name || "—"}</td>
                  <td className="py-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{u.conversions.toLocaleString()}</td>
                  <td className="py-2 text-gray-500">
                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Conversions Tab ────────────────────────────────────── */

function ConversionsTab({ data }: { data: ConversionData }) {
  const dailyChart = data.byDay.map((d) => ({ date: d.date.slice(5), count: d.count }));

  const formatBarData = data.byFormat.slice(0, 10).map((f) => ({
    format: f.format,
    count: f.count,
  }));

  const planPieData = data.byPlan.map((p) => ({ name: p.plan, value: p.count }));

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Conversions" value={data.total.toLocaleString()} />
        <KpiCard label="Avg Duration" value={formatDuration(data.avgDurationMs)} />
        <KpiCard label="Avg Input Size" value={formatBytes(data.avgInputBytes)} />
        <KpiCard label="Avg Output Size" value={formatBytes(data.avgOutputBytes)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily volume */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Daily Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By plan */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Conversions by Plan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={planPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {planPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Format breakdown */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Format Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={formatBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="format" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Revenue Tab ────────────────────────────────────────── */

function RevenueTab({ data }: { data: RevenueData }) {
  const mrrBarData = data.mrrByPlan
    .filter((p) => p.revenue > 0)
    .map((p) => ({
      plan: p.plan,
      revenue: p.revenue,
      users: p.users,
    }));

  const revenueChart = data.revenueOverTime.map((r) => ({
    date: r.date.slice(5),
    mrr: r.mrr,
  }));

  const paidGrowthChart = data.paidUserGrowth.map((g) => ({
    date: g.date.slice(5),
    daily: g.count,
    cumulative: g.cumulative,
  }));

  return (
    <div className="space-y-6">
      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Monthly Recurring Revenue" value={formatCurrency(data.mrr)} />
        <KpiCard label="PAYG Revenue (Month)" value={formatCurrency(data.paygRevenueThisMonth)} />
        <KpiCard
          label="Paid Plans"
          value={data.mrrByPlan.filter((p) => p.pricePerUser > 0).reduce((sum, p) => sum + p.users, 0).toLocaleString()}
          sub="Subscribers"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* MRR by plan */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">MRR by Plan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mrrBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue over time */}
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} dot={false} name="MRR" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Paid user growth */}
      {paidGrowthChart.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Paid User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paidGrowthChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="daily" stroke="#f59e0b" strokeWidth={2} dot={false} name="Daily" />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} name="Cumulative" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MRR plan breakdown table */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Plan Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium text-right">Users</th>
                <th className="pb-2 font-medium text-right">Price/User</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.mrrByPlan.map((p) => (
                <tr key={p.plan} className="border-b last:border-0">
                  <td className="py-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {p.plan}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{p.users.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(p.pricePerUser)}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
