"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/projects", label: "Проекты" },
  { href: "/today", label: "Сегодня" },
  { href: "/tags", label: "Теги" },
];

type Props = {
  user: { name: string | null; email: string; role: "USER" | "ADMIN" };
};

export function Topbar({ user }: Props) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <Link href="/projects" className="font-semibold text-indigo-600 dark:text-indigo-400">
          TaskFlow
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition",
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "rounded-md px-3 py-1.5 transition",
                pathname.startsWith("/admin")
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Админка
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
            {user.name ?? user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
