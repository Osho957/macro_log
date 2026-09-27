"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, Plus, BarChart3, Target } from "lucide-react";

const SIDE_LINKS = [
  { href: "/", label: "Diary", Icon: LayoutDashboard },
  { href: "/log", label: "Log Food", Icon: Utensils },
  { href: "/trends", label: "Trends", Icon: BarChart3 },
  { href: "/settings", label: "Goals", Icon: Target },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-page/95 px-3 backdrop-blur-lg">
      <NavLink {...SIDE_LINKS[0]} pathname={pathname} />
      <NavLink {...SIDE_LINKS[1]} pathname={pathname} />

      <Link
        href="/log"
        aria-label="Log food"
        className="-mt-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-accent-2 text-page shadow-lg shadow-accent/30 transition-transform hover:-translate-y-0.5 active:scale-90"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </Link>

      <NavLink {...SIDE_LINKS[2]} pathname={pathname} />
      <NavLink {...SIDE_LINKS[3]} pathname={pathname} />
    </nav>
  );
}

function NavLink({
  href,
  label,
  Icon,
  pathname,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex w-16 flex-col items-center justify-center gap-1 py-1 font-semibold transition active:scale-95 ${
        active ? "text-accent" : "text-ink-muted hover:text-ink-secondary"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
