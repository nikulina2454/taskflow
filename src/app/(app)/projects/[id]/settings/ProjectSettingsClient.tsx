"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#a855f7",
];

type Project = {
  id: string;
  title: string;
  description: string | null;
  color: string;
};

type Person = {
  id: string;
  name: string | null;
  email: string;
};

type Member = {
  id: string;
  role: "EDITOR" | "VIEWER";
  createdAt: Date;
  user: Person;
};

type Props = {
  project: Project;
  owner: Person;
  members: Member[];
  canDelete: boolean;
};

export function ProjectSettingsClient({
  project,
  owner,
  members,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  const allMembers = useMemo(
    () => [{ id: "owner", role: "OWNER" as const, user: owner }, ...members],
    [members, owner],
  );

  function saveProject() {
    setProjectError(null);
    startTransition(async () => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          color,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setProjectError(data?.error ?? "Не удалось сохранить проект");
        return;
      }

      router.refresh();
    });
  }

  function inviteMember() {
    setMemberError(null);
    startTransition(async () => {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMemberError(data?.error ?? "Не удалось добавить участника");
        return;
      }

      setInviteEmail("");
      setInviteRole("EDITOR");
      router.refresh();
    });
  }

  function changeRole(memberId: string, role: "EDITOR" | "VIEWER") {
    setMemberError(null);
    startTransition(async () => {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMemberError(data?.error ?? "Не удалось поменять роль");
        return;
      }

      router.refresh();
    });
  }

  function removeMember(memberId: string, name: string) {
    if (!confirm(`Удалить ${name} из проекта?`)) return;

    setMemberError(null);
    startTransition(async () => {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMemberError(data?.error ?? "Не удалось удалить участника");
        return;
      }

      router.refresh();
    });
  }

  function deleteProject() {
    if (
      !confirm(
        `Удалить проект «${project.title}»? Вместе с ним исчезнут задачи и участники.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setProjectError(data?.error ?? "Не удалось удалить проект");
        return;
      }

      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Основное</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Название
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <span className="text-sm font-medium">Цвет проекта</span>
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

          {projectError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {projectError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={saveProject}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {pending ? "Сохраняю..." : "Сохранить"}
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={pending}
                onClick={deleteProject}
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Удалить проект
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Команда</h2>

        <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Владелец
          </p>
          <p className="mt-1 text-sm font-medium">{owner.name ?? owner.email}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{owner.email}</p>
        </div>

        {canDelete ? (
          <div className="mt-4 space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-sm font-medium">Пригласить участника</p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="email пользователя"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as "EDITOR" | "VIEWER")
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="EDITOR">Редактор</option>
              <option value="VIEWER">Только просмотр</option>
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={inviteMember}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              Добавить в проект
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Приглашать людей и менять роли может только владелец проекта.
          </p>
        )}

        {memberError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {memberError}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {allMembers.map((member) => {
            const label = member.user.name ?? member.user.email;
            return (
              <li
                key={member.id}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {member.user.email}
                    </p>
                  </div>

                  {"role" in member && member.role === "OWNER" ? (
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] uppercase tracking-wide dark:border-slate-700">
                      owner
                    </span>
                  ) : canDelete ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(event) =>
                          changeRole(
                            member.id,
                            event.target.value as "EDITOR" | "VIEWER",
                          )
                        }
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="EDITOR">editor</option>
                        <option value="VIEWER">viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id, label)}
                        className="text-xs text-red-600 transition hover:text-red-700 dark:text-red-400"
                      >
                        Убрать
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] uppercase tracking-wide dark:border-slate-700">
                      {member.role.toLowerCase()}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
