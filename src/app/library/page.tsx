import { createClient } from "@/lib/supabase/server";
import { FoodLibraryList } from "@/components/FoodLibraryList";

export default async function LibraryPage() {
  const supabase = await createClient();

  const { data: foods } = await supabase
    .from("foods")
    .select(
      "id, source, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g",
    )
    .order("name");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Food Library</h1>
      <FoodLibraryList foods={foods ?? []} />
    </main>
  );
}
