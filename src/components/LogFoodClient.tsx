"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, X } from "lucide-react";
import type { NormalizedFood } from "@/types/food";
import { createClient } from "@/lib/supabase/client";
import { logFood } from "@/lib/nutrition";
import { todayLocalDate } from "@/lib/dates";
import { FoodSearchTab } from "@/components/FoodSearchTab";
import { BarcodeTab } from "@/components/BarcodeTab";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { LogQuantityForm } from "@/components/LogQuantityForm";

interface Meal {
  id: string;
  name: string;
}

export function LogFoodClient({
  userId,
  meals,
  defaultMealId,
}: {
  userId: string;
  meals: Meal[];
  defaultMealId?: string;
}) {
  const router = useRouter();
  const [activeMealId, setActiveMealId] = useState(
    defaultMealId ?? meals[0]?.id ?? "",
  );
  const [scanning, setScanning] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(
    null,
  );
  const [barcodeNotice, setBarcodeNotice] = useState<string | null>(null);

  const activeMealName =
    meals.find((m) => m.id === activeMealId)?.name ?? "Meal";

  async function handleConfirmLog(args: { mealId: string; quantity: number }) {
    if (!selectedFood) return;
    const supabase = createClient();
    await logFood(supabase, {
      userId,
      food: selectedFood,
      mealId: args.mealId,
      loggedDate: todayLocalDate(),
      amount: args.quantity,
    });
    setSelectedFood(null);
    router.push("/");
    router.refresh();
  }

  if (selectedFood) {
    return (
      <LogQuantityForm
        food={selectedFood}
        mealId={activeMealId}
        mealName={activeMealName}
        onCancel={() => setSelectedFood(null)}
        onConfirm={handleConfirmLog}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-2">
        <span className="pl-1 text-xs font-medium text-ink-muted">
          Log into:
        </span>
        <div className="flex gap-1 overflow-x-auto">
          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setActiveMealId(meal.id)}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                activeMealId === meal.id
                  ? "border border-accent/30 bg-accent-soft text-accent"
                  : "bg-page text-ink-muted hover:text-ink-primary"
              }`}
            >
              {meal.name}
            </button>
          ))}
        </div>
      </div>

      {scanning ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Barcode Scanner
            </h3>
            <button
              onClick={() => setScanning(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-page text-ink-muted hover:text-ink-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <BarcodeTab
            onFound={setSelectedFood}
            onNotFound={(barcode) => {
              setBarcodeNotice(
                `No match found for barcode ${barcode}. Add it manually below.`,
              );
              setScanning(false);
              setShowManualForm(true);
            }}
          />
        </div>
      ) : (
        <>
          <FoodSearchTab
            onSelect={setSelectedFood}
            onScanClick={() => setScanning(true)}
          />

          <div className="space-y-3">
            {barcodeNotice && (
              <p className="rounded-lg bg-accent-soft p-3 text-sm text-ink-secondary">
                {barcodeNotice}
              </p>
            )}
            {showManualForm ? (
              <div className="space-y-2 rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Add a custom food
                  </h3>
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="text-ink-muted hover:text-ink-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CustomFoodForm onSubmit={setSelectedFood} />
              </div>
            ) : (
              <button
                onClick={() => setShowManualForm(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-xs font-semibold text-ink-muted hover:text-ink-primary"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Can&apos;t find it? Add a custom food
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
