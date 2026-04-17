import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

import { TagsManager } from "./TagsManager";

export default async function TagsPage() {
  const user = await requireUser();

  const tags = await prisma.tag.findMany({
    where: { ownerId: user.id },
    orderBy: [{ name: "asc" }],
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">Теги</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Создавай свои метки, чтобы быстрее фильтровать задачи в проектах.
      </p>

      <TagsManager
        initialTags={tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          tasksCount: tag._count.tasks,
        }))}
      />
    </main>
  );
}
