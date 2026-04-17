import type { ProjectRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/auth-helpers";

export type ProjectAccess = {
  projectId: string;
  ownerId: string;
  role: ProjectRole;
  canEdit: boolean;
  canDelete: boolean;
};

/**
 * Возвращает права пользователя на проект или кидает 404/403.
 * `userId` берём из сессии — наружу не пробрасываем.
 */
export async function getProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!project) throw new HttpError(404, "Проект не найден");

  const isOwner = project.ownerId === userId;
  const memberRole = project.members[0]?.role;
  const role: ProjectRole | undefined = isOwner ? "OWNER" : memberRole;

  if (!role) throw new HttpError(403, "Нет доступа к проекту");

  return {
    projectId: project.id,
    ownerId: project.ownerId,
    role,
    canEdit: role === "OWNER" || role === "EDITOR",
    canDelete: role === "OWNER",
  };
}
