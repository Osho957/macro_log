import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today</h1>
        <SignOutButton />
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">
        Signed in as {user?.email}
      </p>
      <p className="text-sm text-black/60 dark:text-white/60">
        Dashboard, food logging, diary, and goals are coming next.
      </p>
    </main>
  );
}
