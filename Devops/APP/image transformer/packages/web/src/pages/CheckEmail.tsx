import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";

export function CheckEmail() {
  const { user, token } = useAuth();
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleResend() {
    setResendStatus("sending");
    setError("");
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        token,
      });
      setResendStatus("sent");
    } catch (err) {
      setResendStatus("error");
      setError(err instanceof ApiError ? err.message : "Failed to resend");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-600">
          We've sent a verification link to{" "}
          <strong>{user?.email || "your email"}</strong>. Click the link to verify your account.
        </p>

        <div className="space-y-3">
          {resendStatus === "sent" ? (
            <p className="text-sm text-green-600">Verification email resent!</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <button
            onClick={handleResend}
            disabled={resendStatus === "sending" || resendStatus === "sent"}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendStatus === "sending" ? "Sending..." : "Resend verification email"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          <Link to="/dashboard" className="hover:underline">Continue to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
