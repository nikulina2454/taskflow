import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { apiError } from "@/lib/api";

const createSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #RRGGBB")
    .optional(),
});

export async function GET() {
  try {
    const user = await requireUser();

    const tags = await prisma.tag.findMany({
      where: { ownerId: user.id },
      orderBy: [{ name: "asc" }],
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const data = createSchema.parse(body);

    const tag = await prisma.tag.create({
      data: {
        ownerId: user.id,
        name: data.name,
        color: data.color ?? "#6366f1",
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
