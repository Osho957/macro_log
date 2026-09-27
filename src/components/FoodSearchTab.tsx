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
        className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
      />

      {loading && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Searching...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {results.map((food) => (
          <li key={`${food.source}-${food.externalId}`}>
            <button
              onClick={() => onSelect(food)}
              className="flex w-full items-center justify-between py-2.5 text-left"
            >
              <span>
                <span className="block text-sm font-medium">
                  {food.name}
                </span>
                {food.brand && (
                  <span className="block text-xs text-black/60 dark:text-white/60">
                    {food.brand}
                  </span>
                )}
              </span>
              <span className="text-sm text-black/60 dark:text-white/60">
                {Math.round(food.calories)} kcal
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
