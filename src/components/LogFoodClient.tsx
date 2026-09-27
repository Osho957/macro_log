"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedFood } from "@/types/food";
import { createClient } from "@/lib/supabase/client";
import { logFood } from "@/lib/nutrition";
import { todayLocalDate } from "@/lib/dates";
import { FoodSearchTab } from "@/components/FoodSearchTab";
import { BarcodeTab } from "@/components/BarcodeTab";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { LogQuantityForm } from "@/components/LogQuantityForm";

type Tab = "search" | "barcode" | "manual";

interface Meal {
  id: string;
  name: string;
}

export function LogFoodClient({
  userId,
  meals,
}: {
  userId: string;
  meals: Meal[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(
    null,
  );
  const [barcodeNotice, setBarcodeNotice] = useState<string | null>(null);

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
        meals={meals}
        defaultMealId={meals[0]?.id ?? ""}
        onCancel={() => setSelectedFood(null)}
        onConfirm={handleConfirmLog}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg bg-page p-1 text-sm">
        {(
          [
            ["search", "Search"],
            ["barcode", "Barcode"],
            ["manual", "Manual"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setTab(value);
              setBarcodeNotice(null);
            }}
            className={`flex-1 rounded-lg py-1.5 font-medium transition-colors ${
              tab === value
                ? "bg-surface text-ink-primary shadow-sm"
                : "text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "search" && <FoodSearchTab onSelect={setSelectedFood} />}

      {tab === "barcode" && (
        <BarcodeTab
          onFound={setSelectedFood}
          onNotFound={(barcode) => {
            setBarcodeNotice(
              `No match found for barcode ${barcode}. Enter it manually below.`,
            );
            setTab("manual");
          }}
        />
      )}

      {tab === "manual" && (
        <div className="space-y-3">
          {barcodeNotice && (
            <p className="rounded-lg bg-accent-soft p-3 text-sm text-ink-secondary">
              {barcodeNotice}
            </p>
          )}
          <CustomFoodForm onSubmit={setSelectedFood} />
        </div>
      )}
    </div>
  );
}
