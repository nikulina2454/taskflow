import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  position: z.number().int().min(0).optional(),
  tagIds: z.array(z.string()).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function loadTaskWithAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, status: true },
  });
  if (!task) throw new HttpError(404, "Задача не найдена");
  const access = await getProjectAccess(task.projectId, userId);
  return { task, access };
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { task, access } = await loadTaskWithAccess(id, user.id);
    if (!access.canEdit) throw new HttpError(403, "Недостаточно прав");

    const body = await req.json().catch(() => null);
    const data = updateSchema.parse(body);

    if (data.tagIds) {
      const allowedTags = await prisma.tag.findMany({
        where: {
          ownerId: user.id,
          id: { in: data.tagIds },
        },
        select: { id: true },
      });
      if (allowedTags.length !== data.tagIds.length) {
        throw new HttpError(422, "Можно прикреплять только свои теги");
      }
    }

    const movingToDone = data.status === "DONE" && task.status !== "DONE";
    const leavingDone = data.status && data.status !== "DONE" && task.status === "DONE";

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? undefined,
        status: data.status,
        priority: data.priority,
        dueDate:
          data.dueDate === undefined
            ? undefined
            : data.dueDate === null
              ? null
              : new Date(data.dueDate),
        position: data.position,
        completedAt: movingToDone ? new Date() : leavingDone ? null : undefined,
        tags: data.tagIds
          ? {
              deleteMany: {},
              create: data.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ task: updated });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { access } = await loadTaskWithAccess(id, user.id);
    if (!access.canEdit) throw new HttpError(403, "Недостаточно прав");

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
