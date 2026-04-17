"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Loader2,
  Tag,
  Trash2,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDueDate, getDueStatus } from "@/lib/due-date";

export type TaskTag = {
  tag: { id: string; name: string; color: string };
};

export type AvailableTag = {
  id: string;
  name: string;
  color: string;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  tags: TaskTag[];
};

const PRIORITY_LABEL: Record<TaskItem["priority"], string> = {
  LOW: "низкий",
  MEDIUM: "средний",
  HIGH: "высокий",
};

const PRIORITY_COLOR: Record<TaskItem["priority"], string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

const DUE_COLOR: Record<ReturnType<typeof getDueStatus>, string> = {
  none: "text-slate-500 dark:text-slate-400",
  overdue: "text-red-600 dark:text-red-400",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-amber-600 dark:text-amber-400",
  later: "text-slate-500 dark:text-slate-400",
};

type Props = {
  task: TaskItem;
  canEdit: boolean;
  availableTags?: AvailableTag[];
};

type TaskPatch = Partial<TaskItem> & {
  tagIds?: string[];
};

export function TaskCard({ task, canEdit, availableTags = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);

  const isDone = task.status === "DONE";
  const dueStatus = getDueStatus(task.dueDate ? new Date(task.dueDate) : null);
  const selectedTagIds = useMemo(
    () => task.tags.map(({ tag }) => tag.id),
    [task.tags],
  );

  function patch(body: TaskPatch) {
    if (!canEdit) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не получилось сохранить");
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!canEdit) return;
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не получилось удалить");
        return;
      }
      router.refresh();
    });
  }

  function toggleTag(tagId: string) {
    if (!canEdit) return;

    const nextIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    patch({ tagIds: nextIds });
  }

  return (
    <article
      className={cn(
        "group rounded-lg border bg-white p-3 shadow-sm transition dark:bg-slate-900",
        isDone
          ? "border-emerald-200 dark:border-emerald-900/40"
          : "border-slate-200 dark:border-slate-800",
      )}
    >
      <div className="flex items-start gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={() =>
              patch({ status: isDone ? "TODO" : "DONE" })
            }
            disabled={pending}
            aria-label={isDone ? "Вернуть в работу" : "Отметить выполненной"}
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
              isDone
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-slate-300 hover:border-emerald-500 dark:border-slate-700",
            )}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : isDone ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : null}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-sm font-medium leading-snug",
              isDone && "text-slate-400 line-through dark:text-slate-500",
            )}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-3 text-xs text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium",
                PRIORITY_COLOR[task.priority],
              )}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>

            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800",
                  DUE_COLOR[dueStatus],
                )}
              >
                <CalendarClock className="h-3 w-3" aria-hidden />
                {formatDueDate(new Date(task.dueDate))}
              </span>
            )}

            {task.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {canEdit && availableTags.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setTagsOpen((value) => !value)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <Tag className="h-3 w-3" aria-hidden />
                {tagsOpen ? "Скрыть метки" : "Изменить метки"}
              </button>

              {tagsOpen && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-md bg-slate-50 p-2 dark:bg-slate-950">
                  {availableTags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        disabled={pending}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "rounded-full border px-2 py-1 text-[11px] transition",
                          active
                            ? "border-transparent text-white"
                            : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
                        )}
                        style={active ? { backgroundColor: tag.color } : undefined}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="ml-1 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
            {task.status !== "IN_PROGRESS" && !isDone && (
              <button
                type="button"
                onClick={() => patch({ status: "IN_PROGRESS" })}
                disabled={pending}
                aria-label="В работу"
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Undo2 className="h-3.5 w-3.5 rotate-180" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="Удалить задачу"
              className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
