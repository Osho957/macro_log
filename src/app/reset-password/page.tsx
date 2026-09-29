"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-7 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-ink-primary">
            Set a new password
          </h1>
          <p className="text-sm text-ink-muted">
            Choose a new password for your account
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-ink-primary"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirm"
            className="text-sm font-medium text-ink-primary"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-status-critical">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink-primary px-3 py-2.5 font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
