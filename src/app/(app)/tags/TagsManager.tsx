"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

type TagItem = {
  id: string;
  name: string;
  color: string;
  tasksCount: number;
};

type Props = {
  initialTags: TagItem[];
};

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#a855f7",
  "#14b8a6",
  "#f43f5e",
];

export function TagsManager({ initialTags }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () => [...initialTags].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    [initialTags],
  );

  function createTag() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не удалось создать тег");
        return;
      }

      setName("");
      setColor(COLORS[0]);
      router.refresh();
    });
  }

  function startEdit(tag: TagItem) {
    setEditingId(tag.id);
    setDraftName(tag.name);
    setDraftColor(tag.color);
    setError(null);
  }

  function saveEdit() {
    if (!editingId) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tags/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          color: draftColor,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не удалось обновить тег");
        return;
      }

      setEditingId(null);
      router.refresh();
    });
  }

  function removeTag(tag: TagItem) {
    if (!confirm(`Удалить тег «${tag.name}»? Он исчезнет из всех задач.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не удалось удалить тег");
        return;
      }

      if (editingId === tag.id) {
        setEditingId(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Новый тег</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="tag-name" className="text-sm font-medium">
              Название
            </label>
            <input
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="например, bug или дизайн"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <span className="text-sm font-medium">Цвет</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  aria-label={`Выбрать цвет ${value}`}
                  aria-pressed={color === value}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    color === value
                      ? "border-slate-900 dark:border-white"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={createTag}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Создать тег
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Мои теги</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {tags.length} шт.
          </span>
        </div>

        {tags.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Пока тегов нет. Создай первый слева.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {tags.map((tag) => {
              const isEditing = editingId === tag.id;

              return (
                <li
                  key={tag.id}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        maxLength={40}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                      />

                      <div className="flex flex-wrap gap-2">
                        {COLORS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDraftColor(value)}
                            className={`h-6 w-6 rounded-full border-2 ${
                              draftColor === value
                                ? "border-slate-900 dark:border-white"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: value }}
                            aria-label={`Цвет ${value}`}
                          />
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                        >
                          <Save className="h-4 w-4" aria-hidden />
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <X className="h-4 w-4" aria-hidden />
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-sm font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {tag.tasksCount} задач
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(tag)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Удалить
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
