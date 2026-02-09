import { useState, useRef, type FormEvent } from "react";
import { Upload, Download, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const OUTPUT_FORMATS = ["webp", "png", "jpg", "svg"] as const;

export function Playground() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("webp");
  const [quality, setQuality] = useState(80);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // We need an API key for conversion, fetch from dashboard keys
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("imageforge_playground_key") || "");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResultBlob(null);
      setError("");
      setInfo("");
    }
  }

  function saveApiKey(key: string) {
    setApiKey(key);
    localStorage.setItem("imageforge_playground_key", key);
  }

  async function handleConvert(e: FormEvent) {
    e.preventDefault();
    if (!file || !apiKey) return;

    setLoading(true);
    setError("");
    setInfo("");
    setResultBlob(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("outputFormat", outputFormat);
      form.append("quality", String(quality));

      const res = await fetch(`${API_BASE}/convert`, {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Conversion failed");
      }

      const width = res.headers.get("X-Image-Width");
      const height = res.headers.get("X-Image-Height");
      const blob = await res.blob();

      setResultBlob(blob);
      setInfo(
        `${(blob.size / 1024).toFixed(1)} KB` +
        (width && height ? ` | ${width}x${height}` : "")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${outputFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Playground</h2>

      {/* API Key input */}
      <div className="rounded-xl border bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => saveApiKey(e.target.value)}
          placeholder="imgf_..."
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Paste an API key from the Keys page to test conversions.
        </p>
      </div>

      <form onSubmit={handleConvert} className="space-y-4">
        {/* File upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 hover:border-blue-400"
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {file ? file.name : "Click to upload an image"}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.heic,.heif,.svg,.cr2,.nef,.arw,.dng"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Options row */}
        <div className="flex flex-wrap gap-4 rounded-xl border bg-white p-4">
          <div>
            <label className="block text-xs font-medium text-gray-600">Output format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            >
              {OUTPUT_FORMATS.map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Quality ({quality})</label>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-2 w-32"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!file || !apiKey || loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Converting..." : "Convert"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Result */}
      {resultBlob && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Result {info && `(${info})`}</p>
            <button
              onClick={downloadResult}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
          {outputFormat !== "svg" && (
            <img
              src={URL.createObjectURL(resultBlob)}
              alt="Converted"
              className="max-h-96 rounded-lg border object-contain"
            />
          )}
        </div>
      )}

      {/* Side-by-side preview */}
      {preview && !resultBlob && !loading && (
        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Original preview</p>
          <img src={preview} alt="Original" className="max-h-64 rounded-lg border object-contain" />
        </div>
      )}
    </div>
  );
}
