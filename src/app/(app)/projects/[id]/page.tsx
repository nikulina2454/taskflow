import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { getProjectAccess } from "@/lib/project-access";

import { TaskCard, type TaskItem } from "./TaskCard";
import { CreateTaskForm } from "./CreateTaskForm";

type Props = { params: Promise<{ id: string }> };

const COLUMNS: Array<{
  status: TaskItem["status"];
  title: string;
  hint: string;
}> = [
  { status: "TODO", title: "К выполнению", hint: "В очереди" },
  { status: "IN_PROGRESS", title: "В работе", hint: "Кто-то уже взял" },
  { status: "DONE", title: "Готово", hint: "Можно выдохнуть" },
];

export default async function ProjectPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { tasks: true, members: true } },
      owner: { select: { name: true, email: true } },
    },
  });
  if (!project) notFound();

  const access = await getProjectAccess(id, user.id);

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      tags: { include: { tag: true } },
    },
  });

  const tasksByStatus: Record<TaskItem["status"], TaskItem[]> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const t of tasks) {
    tasksByStatus[t.status].push({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      tags: t.tags.map((tt) => ({
        tag: { id: tt.tag.id, name: tt.tag.name, color: tt.tag.color },
      })),
    });
  }

  const doneCount = tasksByStatus.DONE.length;
  const totalCount = tasks.length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Все проекты
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.color }}
              aria-hidden
            />
            <h1 className="text-2xl font-bold">{project.title}</h1>
          </div>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Владелец: {project.owner.name ?? project.owner.email}</span>
            <span>
              {doneCount} из {totalCount} задач готово
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {project._count.members}
            </span>
            <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] uppercase tracking-wide dark:border-slate-700">
              {access.role}
            </span>
          </div>
        </div>

        {access.canEdit && (
          <Link
            href={`/projects/${project.id}/settings`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4" aria-hidden />
            Настройки
          </Link>
        )}
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasksByStatus[col.status];
          return (
            <div
              key={col.status}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="px-1 text-xs text-slate-400 dark:text-slate-500">
                    {col.hint}
                  </p>
                ) : (
                  items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canEdit={access.canEdit}
                    />
                  ))
                )}
              </div>

              {access.canEdit && col.status !== "DONE" && (
                <CreateTaskForm projectId={project.id} defaultStatus={col.status} />
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
