"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

const LINKS = [
  { href: "/dashboard/malica", label: "Dnevna malica" },
  { href: "/dashboard", label: "Jedilni list" },
  { href: "/dashboard/billing", label: "Naročnina" },
];

export function DashboardNav() {
  const path = usePathname();
  return (
    <nav className="no-print border-b border-line bg-card">
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        <span className="mr-3 py-3 font-serif text-lg">Menuva</span>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${
              path === l.href ? "border-foreground font-medium" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <form action={signOut} className="ml-auto">
          <button className="py-3 text-sm whitespace-nowrap text-muted hover:text-foreground">Odjava</button>
        </form>
      </div>
    </nav>
  );
}
