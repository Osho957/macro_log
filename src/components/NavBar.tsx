import Link from "next/link";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/log", label: "Log" },
  { href: "/diary", label: "Diary" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  return (
    <nav className="sticky bottom-0 border-t border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/90">
      <div className="mx-auto flex max-w-md justify-between px-4 py-2 text-xs">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex-1 rounded-md py-1.5 text-center text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
