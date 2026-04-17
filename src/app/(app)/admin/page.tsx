import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  await requireAdmin();

  const [users, projectCount, projects, tasks] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            memberships: true,
          },
        },
      },
    }),
    prisma.project.count(),
    prisma.project.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        color: true,
        createdAt: true,
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    }),
    prisma.task.count(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">Админка</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Быстрый обзор по системе и базовое управление пользователями.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Пользователи" value={String(users.length)} />
        <StatCard label="Проекты" value={String(projectCount)} />
        <StatCard label="Задачи" value={String(tasks)} />
      </div>

      <AdminPanel
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isBlocked: user.isBlocked,
          projectsCount: user._count.ownedProjects + user._count.memberships,
          createdAt: user.createdAt.toISOString(),
        }))}
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
          color: project.color,
          owner: project.owner.name ?? project.owner.email,
          tasksCount: project._count.tasks,
          membersCount: project._count.members,
          createdAt: project.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </section>
  );
}
