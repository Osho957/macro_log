"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/log", label: "Log" },
  { href: "/diary", label: "Diary" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-md justify-between px-2 py-2 text-xs">
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 rounded-lg py-1.5 text-center font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
