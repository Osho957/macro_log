"use client";

import { useEffect, useState } from "react";
import { Search, ScanLine } from "lucide-react";
import type { NormalizedFood } from "@/types/food";

export function FoodSearchTab({
  onSelect,
  onScanClick,
  onQueryChange,
}: {
  onSelect: (food: NormalizedFood) => void;
  onScanClick: () => void;
  onQueryChange?: (hasQuery: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    onQueryChange?.(trimmed.length > 0);
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
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-muted" />
        <input
          type="search"
          placeholder="Search oats, paneer, eggs, protein..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-border bg-page py-2.5 pr-20 pl-10 text-xs text-ink-primary shadow-inner outline-none focus:border-accent"
        />
        <button
          onClick={onScanClick}
          className="absolute right-2 flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-secondary transition-colors hover:border-accent/40"
        >
          <ScanLine className="h-3 w-3 text-accent" />
          <span>Scan</span>
        </button>
      </div>

      {loading && <p className="text-sm text-ink-muted">Searching...</p>}
      {error && <p className="text-sm text-status-critical">{error}</p>}

      <div className="space-y-2">
        {results.map((food) => (
          <button
            key={`${food.source}-${food.externalId}`}
            onClick={() => onSelect(food)}
            className="flex w-full items-start justify-between rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:border-accent/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-primary">
                {food.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {food.brand ? `${food.brand} · ` : ""}
                {food.servingSize}
                {food.servingUnit} serving
              </p>
              <p className="mt-1 text-[11px]">
                <span className="text-carbs">C: {food.carbsG ?? 0}g</span>
                {" · "}
                <span className="text-protein">P: {food.proteinG ?? 0}g</span>
                {" · "}
                <span className="text-fat">F: {food.fatG ?? 0}g</span>
              </p>
            </div>
            <div className="ml-3 shrink-0 text-right">
              <p className="text-lg font-extrabold text-ink-primary">
                {Math.round(food.calories)}
              </p>
              <p className="text-[9px] uppercase text-ink-muted">
                kcal/{food.servingSize}
                {food.servingUnit}
              </p>
              <span className="mt-1 inline-block rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
                + Select
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
