import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
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
    const body = await req.json().catch(() => null);
    const data = updateSchema.parse(body);

    const existing = await prisma.tag.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing || existing.ownerId !== user.id) {
      throw new HttpError(404, "Тег не найден");
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const existing = await prisma.tag.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing || existing.ownerId !== user.id) {
      throw new HttpError(404, "Тег не найден");
    }

    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
