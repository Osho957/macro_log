"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, BarChart3, Target } from "lucide-react";

const LINKS = [
  { href: "/", label: "Diary", Icon: LayoutDashboard },
  { href: "/log", label: "Log Food", Icon: Utensils },
  { href: "/trends", label: "Trends", Icon: BarChart3 },
  { href: "/settings", label: "Goals", Icon: Target },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-page/95 px-3 backdrop-blur-lg">
      {LINKS.map((link) => (
        <NavLink key={link.href} {...link} pathname={pathname} />
      ))}
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
