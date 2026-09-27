"use client";

import { useState } from "react";
import type { NormalizedFood } from "@/types/food";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export function BarcodeTab({
  onFound,
  onNotFound,
}: {
  onFound: (food: NormalizedFood) => void;
  onNotFound: (barcode: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);

  async function handleDetected(barcode: string) {
    if (loading || barcode === lastCode) return;
    setLastCode(barcode);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/off/product/${encodeURIComponent(barcode)}`,
      );

      if (res.status === 404) {
        onNotFound(barcode);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      onFound(data.food);
    } catch {
      setError("Couldn't look up that barcode. Try again or enter manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <BarcodeScanner onDetected={handleDetected} />
      {loading && (
        <p className="text-sm text-ink-muted">
          Looking up product...
        </p>
      )}
      {error && <p className="text-sm text-status-critical">{error}</p>}
    </div>
  );
}
