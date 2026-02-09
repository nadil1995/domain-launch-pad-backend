import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Copy, Trash2, Plus, Check } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function ApiKeysPage() {
  const { token } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await api<{ keys: ApiKey[] }>("/keys", { token });
      setKeys(res.keys);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function createKey() {
    try {
      const res = await api<{ key: string; id: string; name: string; prefix: string; createdAt: string }>(
        "/keys",
        { method: "POST", token, body: { name: newKeyName || "Default" } }
      );
      setNewKeyRaw(res.key);
      setNewKeyName("");
      fetchKeys();
    } catch {
      // ignore
    }
  }

  async function revokeKey(id: string) {
    try {
      await api(`/keys/${id}`, { method: "DELETE", token });
      fetchKeys();
    } catch {
      // ignore
    }
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">API Keys</h2>

      {/* Create key */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Key name (optional)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={createKey}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create key
        </button>
      </div>

      {/* New key reveal */}
      {newKeyRaw && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="mb-2 text-sm font-medium text-green-800">
            Your new API key (copy it now — it won't be shown again):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-sm text-gray-800">
              {newKeyRaw}
            </code>
            <button
              onClick={() => copyKey(newKeyRaw)}
              className="rounded-lg border bg-white p-2 hover:bg-gray-50"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
            </button>
          </div>
          <button
            onClick={() => setNewKeyRaw(null)}
            className="mt-2 text-xs text-green-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-500">No API keys yet. Create one to get started.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Key</th>
                <th className="px-4 py-3 font-medium text-gray-600">Last used</th>
                <th className="px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{k.prefix}...</td>
                  <td className="px-4 py-3 text-gray-500">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
