"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

const SCANNER_ELEMENT_ID = "barcode-scanner-region";

export function BarcodeScanner({
  onDetected,
}: {
  onDetected: (barcode: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );

      if (cancelled) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      // A fixed pixel qrbox (e.g. 250x150) can end up larger than the
      // actual video frame on a narrow phone viewport, which silently
      // breaks detection. Sizing it as a fraction of the real viewfinder
      // (per html5-qrcode's own recommended pattern) avoids that.
      const qrboxFunction = (
        viewfinderWidth: number,
        viewfinderHeight: number,
      ) => {
        const width = Math.floor(viewfinderWidth * 0.85);
        const height = Math.floor(viewfinderHeight * 0.4);
        return { width, height };
      };

      async function tryStart(constraint: MediaTrackConstraints) {
        await scanner.start(
          constraint,
          { fps: 10, qrbox: qrboxFunction, disableFlip: false },
          (decodedText) => {
            onDetected(decodedText);
          },
          undefined,
        );
      }

      try {
        try {
          await tryStart({ facingMode: { exact: "environment" } });
        } catch {
          // Some devices/browsers reject an "exact" constraint outright;
          // fall back to a plain preference instead of failing entirely.
          await tryStart({ facingMode: "environment" });
        }
        if (!cancelled) setStarting(false);
      } catch {
        if (!cancelled) {
          setError(
            "Couldn't access the camera. Grant camera permission, or type the barcode below.",
          );
          setStarting(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div
        id={SCANNER_ELEMENT_ID}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-page"
        style={{ minHeight: 280 }}
      />
      {starting && (
        <p className="text-center text-sm text-ink-muted">
          Starting camera...
        </p>
      )}
      {error && <p className="text-sm text-status-critical">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) onDetected(manualCode.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Or type barcode manually"
          className="flex-1 rounded-lg border border-border px-3 py-2 bg-page"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          Look up
        </button>
      </form>
    </div>
  );
}
