import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #RRGGBB")
    .optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await getProjectAccess(id, user.id);

    if (!access.canEdit) throw new HttpError(403, "Недостаточно прав");

    const body = await req.json().catch(() => null);
    const data = updateSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? undefined,
        color: data.color,
      },
    });
    return NextResponse.json({ project });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await getProjectAccess(id, user.id);

    if (!access.canDelete) throw new HttpError(403, "Удалять может только владелец");

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
