"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  projectsCount: number;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  title: string;
  color: string;
  owner: string;
  tasksCount: number;
  membersCount: number;
  createdAt: string;
};

type Props = {
  users: UserRow[];
  projects: ProjectRow[];
};

export function AdminPanel({ users, projects }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patchUser(
    userId: string,
    patch: Partial<Pick<UserRow, "role" | "isBlocked">>,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Не удалось обновить пользователя");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Пользователи</h2>
          {pending && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Сохраняю...
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.name ?? user.email}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Проектов: {user.projectsCount}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      patchUser(user.id, {
                        role: event.target.value as "USER" | "ADMIN",
                      })
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="USER">user</option>
                    <option value="ADMIN">admin</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      patchUser(user.id, { isBlocked: !user.isBlocked })
                    }
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      user.isBlocked
                        ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                        : "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    }`}
                  >
                    {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Свежие проекты</h2>
        <ul className="mt-4 space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                  aria-hidden
                />
                <p className="font-medium">{project.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Владелец: {project.owner}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {project.tasksCount} задач, {project.membersCount} участников
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
