import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getProjectAccess(id, user.id);

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await getProjectAccess(id, user.id);
    if (!access.canEdit) throw new HttpError(403, "Недостаточно прав");

    const body = await req.json().catch(() => null);
    const data = createSchema.parse(body);

    const status = data.status ?? "TODO";
    const last = await prisma.task.findFirst({
      where: { projectId: id, status },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        projectId: id,
        title: data.title,
        description: data.description,
        status,
        priority: data.priority ?? "MEDIUM",
        position: (last?.position ?? -1) + 1,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
