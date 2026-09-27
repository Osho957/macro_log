"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-xl font-semibold">Calorie Tracker</h1>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setError(null);
              setInfo(null);
            }}
            className={mode === "sign-in" ? "font-semibold underline" : "text-black/50 dark:text-white/50"}
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
            className={mode === "sign-up" ? "font-semibold underline" : "text-black/50 dark:text-white/50"}
          >
            Create account
          </button>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700 dark:text-green-500">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-3 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading
            ? "Please wait..."
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
