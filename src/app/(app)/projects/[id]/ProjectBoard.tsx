"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  TaskCard,
  type AvailableTag,
  type TaskItem,
} from "./TaskCard";
import { CreateTaskForm } from "./CreateTaskForm";

type Status = TaskItem["status"];

type Props = {
  projectId: string;
  canEdit: boolean;
  initialTasks: TaskItem[];
  availableTags: AvailableTag[];
};

const COLUMNS: Array<{ status: Status; title: string; hint: string }> = [
  { status: "TODO", title: "К выполнению", hint: "В очереди" },
  { status: "IN_PROGRESS", title: "В работе", hint: "Кто-то уже взял" },
  { status: "DONE", title: "Готово", hint: "Можно выдохнуть" },
];

export function ProjectBoard({
  projectId,
  canEdit,
  initialTasks,
  availableTags,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeTagId, setActiveTagId] = useState<string>("all");
  const [tasks, setTasks] = useState(initialTasks);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);
      const matchesTag =
        activeTagId === "all" ||
        task.tags.some(({ tag }) => tag.id === activeTagId);
      return matchesQuery && matchesTag;
    });
  }, [activeTagId, search, tasks]);

  const tasksByStatus = useMemo(() => {
    const result: Record<Status, TaskItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const task of filteredTasks) {
      result[task.status].push(task);
    }
    return result;
  }, [filteredTasks]);

  const fullColumns = useMemo(() => {
    const result: Record<Status, string[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const task of tasks) {
      result[task.status].push(task.id);
    }
    return result;
  }, [tasks]);

  const dragEnabled = canEdit && !search.trim() && activeTagId === "all";

  function persistReorder(nextTasks: TaskItem[]) {
    setTasks(nextTasks);
    const columns = nextTasks.reduce<Record<Status, string[]>>(
      (acc, task) => {
        acc[task.status].push(task.id);
        return acc;
      },
      { TODO: [], IN_PROGRESS: [], DONE: [] },
    );

    startTransition(async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns }),
      });

      if (!res.ok) {
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    const overTask = tasks.find((task) => task.id === overId);
    const targetStatus = overTask?.status ?? (overId as Status);

    const withoutActive = tasks.filter((task) => task.id !== activeId);
    const targetTasks = withoutActive.filter((task) => task.status === targetStatus);
    const insertIndex = overTask
      ? targetTasks.findIndex((task) => task.id === overId)
      : targetTasks.length;

    const nextTask: TaskItem = {
      ...activeTask,
      status: targetStatus,
    };

    const rebuilt: TaskItem[] = [];
    let inserted = false;

    for (const status of ["TODO", "IN_PROGRESS", "DONE"] as const) {
      const columnTasks = withoutActive.filter((task) => task.status === status);
      if (status === targetStatus) {
        const before = columnTasks.slice(0, insertIndex);
        const after = columnTasks.slice(insertIndex);
        rebuilt.push(...before, nextTask, ...after);
        inserted = true;
      } else {
        rebuilt.push(...columnTasks);
      }
    }

    if (!inserted) {
      rebuilt.push(nextTask);
    }

    persistReorder(rebuilt);
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по задачам"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTagId("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                activeTagId === "all"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              Все теги
            </button>
            {availableTags.map((tag) => {
              const active = activeTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setActiveTagId(tag.id)}
                  className="rounded-full border px-3 py-1.5 text-xs transition"
                  style={
                    active
                      ? {
                          backgroundColor: tag.color,
                          borderColor: tag.color,
                          color: "#fff",
                        }
                      : undefined
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {!dragEnabled && canEdit && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag & drop работает, когда не включены поиск и фильтр по тегам.
          </p>
        )}
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={dragEnabled ? handleDragEnd : undefined}
        sensors={dragEnabled ? sensors : undefined}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = tasksByStatus[col.status];
            const sortableIds = dragEnabled
              ? fullColumns[col.status]
              : items.map((task) => task.id);

            return (
              <div
                key={col.status}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">{col.title}</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {items.length}
                  </span>
                </div>

                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <ColumnDropZone status={col.status}>
                    <div className="flex min-h-24 flex-col gap-2">
                      {items.length === 0 ? (
                        <p className="px-1 text-xs text-slate-400 dark:text-slate-500">
                          {col.hint}
                        </p>
                      ) : (
                        items.map((task) => (
                          <SortableTask
                            key={task.id}
                            task={task}
                            disabled={!dragEnabled}
                          >
                            <TaskCard
                              task={task}
                              canEdit={canEdit}
                              availableTags={availableTags}
                            />
                          </SortableTask>
                        ))
                      )}
                    </div>
                  </ColumnDropZone>
                </SortableContext>

                {canEdit && col.status !== "DONE" && (
                  <CreateTaskForm
                    projectId={projectId}
                    defaultStatus={col.status}
                    availableTags={availableTags}
                  />
                )}
              </div>
            );
          })}
        </div>
      </DndContext>

      {pending && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Сохраняю порядок задач...
        </p>
      )}
    </section>
  );
}

function ColumnDropZone({
  status,
  children,
}: {
  status: Status;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition",
        isOver && "bg-indigo-50/70 dark:bg-indigo-500/5",
      )}
    >
      {children}
    </div>
  );
}

function SortableTask({
  task,
  disabled,
  children,
}: {
  task: TaskItem;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      disabled,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
