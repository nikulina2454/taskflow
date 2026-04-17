import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #RRGGBB")
    .optional(),
});

export async function GET() {
  try {
    const user = await requireUser();

    const projects = await prisma.project.findMany({
      where: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const data = createSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        color: data.color ?? "#6366f1",
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
