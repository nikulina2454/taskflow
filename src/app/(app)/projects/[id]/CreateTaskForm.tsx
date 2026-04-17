"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type Props = {
  projectId: string;
  defaultStatus?: "TODO" | "IN_PROGRESS" | "DONE";
};

export function CreateTaskForm({ projectId, defaultStatus = "TODO" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setError(null);
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Введите название задачи");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          description: description.trim() || undefined,
          status: defaultStatus,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не удалось создать задачу");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Добавить задачу
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Что нужно сделать?"
        autoFocus
        maxLength={200}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание (необязательно)"
        rows={2}
        maxLength={2000}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
      />

      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400">
          Приоритет
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
            }
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="LOW">низкий</option>
            <option value="MEDIUM">средний</option>
            <option value="HIGH">высокий</option>
          </select>
        </label>
        <label className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400">
          Дедлайн
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-0.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Сохраняю..." : "Добавить"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
