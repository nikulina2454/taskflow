// хелперы для дедлайнов задач

export type DueStatus = "none" | "overdue" | "today" | "soon" | "later";

export function getDueStatus(
  dueDate: Date | null | undefined,
  now: Date = new Date(),
): DueStatus {
  if (!dueDate) return "none";

  const due = startOfDay(dueDate);
  const today = startOfDay(now);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "later";
}

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
