"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDE_LINKS = [
  { href: "/", label: "Today", icon: "🏠" },
  { href: "/diary", label: "Diary", icon: "📖" },
  { href: "/library", label: "Library", icon: "🍎" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-border bg-surface/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-md items-center justify-around px-2 py-2 text-xs">
        {SIDE_LINKS.slice(0, 2).map((link) => (
          <NavLink key={link.href} {...link} pathname={pathname} />
        ))}

        <Link
          href="/log"
          aria-label="Log food"
          className="-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-accent-2 text-lg font-bold text-page shadow-lg shadow-accent/30 transition-transform active:scale-90"
        >
          +
        </Link>

        {SIDE_LINKS.slice(2).map((link) => (
          <NavLink key={link.href} {...link} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: string;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex w-14 flex-col items-center gap-0.5 rounded-lg py-1 font-medium transition-colors ${
        active ? "text-accent" : "text-ink-muted hover:text-ink-primary"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}
