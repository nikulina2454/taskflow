import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const reorderSchema = z.object({
  columns: z.object({
    TODO: z.array(z.string()),
    IN_PROGRESS: z.array(z.string()),
    DONE: z.array(z.string()),
  }),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await getProjectAccess(id, user.id);
    if (!access.canEdit) throw new HttpError(403, "Недостаточно прав");

    const body = await req.json().catch(() => null);
    const data = reorderSchema.parse(body);
    const allIds = [
      ...data.columns.TODO,
      ...data.columns.IN_PROGRESS,
      ...data.columns.DONE,
    ];

    const uniqueIds = new Set(allIds);
    if (uniqueIds.size !== allIds.length) {
      throw new HttpError(422, "Одна и та же задача передана несколько раз");
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true },
    });
    const projectIds = new Set(tasks.map((task) => task.id));
    if (projectIds.size !== uniqueIds.size) {
      throw new HttpError(422, "Нужно передать все задачи проекта");
    }
    for (const taskId of uniqueIds) {
      if (!projectIds.has(taskId)) {
        throw new HttpError(422, "Переданы чужие задачи");
      }
    }

    await prisma.$transaction(
      (Object.entries(data.columns) as Array<
        ["TODO" | "IN_PROGRESS" | "DONE", string[]]
      >).flatMap(([status, ids]) =>
        ids.map((taskId, position) =>
          prisma.task.update({
            where: { id: taskId },
            data: {
              status,
              position,
              completedAt: status === "DONE" ? new Date() : null,
            },
          }),
        ),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
