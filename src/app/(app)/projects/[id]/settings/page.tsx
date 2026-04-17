import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { getProjectAccess } from "@/lib/project-access";

import { ProjectSettingsClient } from "./ProjectSettingsClient";

type Props = { params: Promise<{ id: string }> };

export default async function ProjectSettingsPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const access = await getProjectAccess(id, user.id);

  if (!access.canEdit) {
    redirect(`/projects/${id}`);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      color: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        where: {
          role: {
            not: "OWNER",
          },
        },
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Назад к проекту
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold">Настройки проекта</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Здесь можно обновить данные проекта и управлять доступом команды.
        </p>
      </div>

      <ProjectSettingsClient
        project={{
          id: project.id,
          title: project.title,
          description: project.description,
          color: project.color,
        }}
        owner={project.owner}
        members={project.members.map((member) => ({
          ...member,
          role: member.role as "EDITOR" | "VIEWER",
        }))}
        canDelete={access.canDelete}
      />
    </main>
  );
}
