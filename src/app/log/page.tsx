import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { LogFoodClient } from "@/components/LogFoodClient";

export default async function LogFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from("meals")
    .select("id, name")
    .order("sort_order");

  const { meal } = await searchParams;

  return (
    <>
      <AppHeader title="Search & Log Food" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
        <LogFoodClient
          userId={user!.id}
          meals={meals ?? []}
          defaultMealId={meal}
        />
      </main>
    </>
  );
}
