"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setInfo(
        "If an account exists for that email, a reset link is on its way. Open it in this same browser.",
      );
      return;
    }

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      if (!data.session) {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("sign-in");
        return;
      }

      router.push("/");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-lg">
            🍽️
          </div>
          <h1 className="text-lg font-semibold text-ink-primary">
            MacroLog
          </h1>
          <p className="text-sm text-ink-muted">Track meals, stay on target</p>
        </div>

        <div className="flex rounded-lg bg-page p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg py-1.5 font-medium transition-colors ${
              mode === "sign-in"
                ? "bg-surface text-ink-primary shadow-sm"
                : "text-ink-muted"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sign-up");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg py-1.5 font-medium transition-colors ${
              mode === "sign-up"
                ? "bg-surface text-ink-primary shadow-sm"
                : "text-ink-muted"
            }`}
          >
            Create account
          </button>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-ink-primary">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>

        {mode !== "forgot" && (
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink-primary"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
            />
          </div>
        )}

        {mode === "sign-in" && (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError(null);
              setInfo(null);
            }}
            className="block text-sm text-ink-muted hover:text-ink-primary"
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-sm text-status-critical">{error}</p>}
        {info && <p className="text-sm text-status-good">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink-primary px-3 py-2.5 font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "sign-up"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
        </button>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setError(null);
              setInfo(null);
            }}
            className="block w-full text-center text-sm text-ink-muted hover:text-ink-primary"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
