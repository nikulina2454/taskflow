import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireAdmin } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";

const updateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  isBlocked: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const data = updateSchema.parse(body);

    if (admin.id === id && (data.role === "USER" || data.isBlocked === true)) {
      throw new HttpError(409, "Нельзя снять у себя админку или заблокировать себя");
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new HttpError(404, "Пользователь не найден");
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: data.role,
        isBlocked: data.isBlocked,
      },
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
    });

    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
