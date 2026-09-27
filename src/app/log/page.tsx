import { createClient } from "@/lib/supabase/server";
import { LogFoodClient } from "@/components/LogFoodClient";

export default async function LogFoodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from("meals")
    .select("id, name")
    .order("sort_order");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold text-ink-primary">Log Food</h1>
      <LogFoodClient userId={user!.id} meals={meals ?? []} />
    </main>
  );
}
