"use client";

import { useEffect, useState } from "react";
import type { NormalizedFood } from "@/types/food";

export function FoodSearchTab({
  onSelect,
}: {
  onSelect: (food: NormalizedFood) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/usda/search?q=${encodeURIComponent(trimmed)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed");
        setResults(data.results ?? []);
      } catch {
        setError("Search failed. Try again.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search foods (e.g. chicken breast)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
      />

      {loading && <p className="text-sm text-ink-muted">Searching...</p>}
      {error && <p className="text-sm text-status-critical">{error}</p>}

      <ul
        className={
          results.length > 0
            ? "divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface"
            : ""
        }
      >
        {results.map((food) => (
          <li key={`${food.source}-${food.externalId}`}>
            <button
              onClick={() => onSelect(food)}
              className="flex w-full items-center justify-between px-3 py-3 text-left transition-colors hover:bg-page"
            >
              <span>
                <span className="block text-sm font-medium text-ink-primary">
                  {food.name}
                </span>
                {food.brand && (
                  <span className="block text-xs text-ink-muted">
                    {food.brand}
                  </span>
                )}
              </span>
              <span className="text-sm font-medium text-ink-secondary">
                {Math.round(food.calories)} kcal
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
