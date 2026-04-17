import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";
import { formatDueDate, getDueStatus } from "@/lib/due-date";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      project: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      OR: [{ dueDate: { lte: endOfToday } }, { dueDate: null }],
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    include: {
      project: { select: { id: true, title: true, color: true } },
    },
  });

  const overdue = tasks.filter(
    (t) => t.dueDate && getDueStatus(t.dueDate, now) === "overdue",
  );
  const today = tasks.filter(
    (t) => t.dueDate && getDueStatus(t.dueDate, now) === "today",
  );
  const noDate = tasks.filter((t) => !t.dueDate);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Сегодня</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Что точно стоит закрыть до конца дня — и что уже горит.
        </p>
      </header>

      <Section
        title="Просрочено"
        empty="Ничего не просрочено — приятно видеть."
        accent="text-red-600 dark:text-red-400"
        items={overdue}
        now={now}
      />
      <Section
        title="Сегодня"
        empty="На сегодня дедлайнов нет."
        accent="text-amber-600 dark:text-amber-400"
        items={today}
        now={now}
      />
      <Section
        title="Без даты"
        empty="Все задачи с датами — порядок!"
        accent="text-slate-500 dark:text-slate-400"
        items={noDate}
        now={now}
      />
    </main>
  );
}

type TaskRow = {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  project: { id: string; title: string; color: string };
};

function Section({
  title,
  empty,
  accent,
  items,
  now,
}: {
  title: string;
  empty: string;
  accent: string;
  items: TaskRow[];
  now: Date;
}) {
  return (
    <section className="mt-8">
      <h2 className={cn("text-sm font-semibold uppercase tracking-wide", accent)}>
        {title}{" "}
        <span className="ml-1 text-slate-400 dark:text-slate-500">
          ({items.length})
        </span>
      </h2>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {empty}
          </li>
        ) : (
          items.map((task) => {
            const status = getDueStatus(task.dueDate, now);
            return (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {task.project.title}
                  </span>
                  {task.dueDate && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800",
                        status === "overdue"
                          ? "text-red-600 dark:text-red-400"
                          : status === "today"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      <CalendarClock className="h-3 w-3" aria-hidden />
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
