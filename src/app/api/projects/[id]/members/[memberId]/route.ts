import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const updateSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

type Ctx = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id, memberId } = await params;
    const access = await getProjectAccess(id, user.id);
    if (!access.canDelete) {
      throw new HttpError(403, "Менять роли может только владелец");
    }

    const body = await req.json().catch(() => null);
    const data = updateSchema.parse(body);

    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { id: true, projectId: true },
    });
    if (!existingMember || existingMember.projectId !== id) {
      throw new HttpError(404, "Участник проекта не найден");
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: data.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id, memberId } = await params;
    const access = await getProjectAccess(id, user.id);
    if (!access.canDelete) {
      throw new HttpError(403, "Удалять участников может только владелец");
    }

    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { id: true, projectId: true },
    });
    if (!member || member.projectId !== id) {
      throw new HttpError(404, "Участник проекта не найден");
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
