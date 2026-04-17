import Link from "next/link";
import { Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function ProjectsPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true, members: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Мои проекты</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Здесь видно проекты, которые ты создала, и те, к которым тебе дали
            доступ.
          </p>
        </div>
        <CreateProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Пока нет ни одного проекта. Нажми «Новый проект», чтобы создать первый.
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group block h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  <h2 className="truncate font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {p.title}
                  </h2>
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{p._count.tasks} задач</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {p._count.members}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
