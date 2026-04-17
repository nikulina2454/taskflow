import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { HttpError, requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";
import { getProjectAccess } from "@/lib/project-access";

const createSchema = z.object({
  email: z.email("Введите корректный email"),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await getProjectAccess(id, user.id);

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        members: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
    if (!project) throw new HttpError(404, "Проект не найден");

    return NextResponse.json({
      owner: project.owner,
      members: project.members,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await getProjectAccess(id, user.id);
    if (!access.canDelete) {
      throw new HttpError(403, "Приглашать участников может только владелец");
    }

    const body = await req.json().catch(() => null);
    const data = createSchema.parse(body);

    const invitedUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });
    if (!invitedUser) {
      throw new HttpError(404, "Пользователь с таким email не найден");
    }
    if (invitedUser.id === access.ownerId) {
      throw new HttpError(409, "Владелец уже есть в проекте");
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: id,
          userId: invitedUser.id,
        },
      },
      update: { role: data.role },
      create: {
        projectId: id,
        userId: invitedUser.id,
        role: data.role,
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
