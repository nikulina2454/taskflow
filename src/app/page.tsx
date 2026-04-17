import Link from "next/link";
import { CheckCircle2, KanbanSquare, Tag, Users } from "lucide-react";

import { auth } from "@/auth";

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Канбан с drag & drop",
    text: "Переносите задачи между «To do», «In progress» и «Done» одним движением мыши.",
  },
  {
    icon: Tag,
    title: "Теги и приоритеты",
    text: "Категоризируйте задачи и фильтруйте список по тегу, приоритету или дедлайну.",
  },
  {
    icon: Users,
    title: "Шаринг проектов",
    text: "Приглашайте коллег по email с ролями Owner / Editor / Viewer.",
  },
  {
    icon: CheckCircle2,
    title: "Страница «Сегодня»",
    text: "Все задачи с дедлайном на сегодня — на одной странице, по всем проектам сразу.",
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16">
      <section className="max-w-3xl text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          TaskFlow
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Командный TodoList с проектами, тегами и канбаном
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
          Простой менеджер задач для учёбы и небольших команд: создавайте
          проекты, разбивайте их на задачи, двигайте по канбану и шарьте
          доступом с коллегами.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {session?.user ? (
            <Link
              href="/projects"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              К моим проектам
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Создать аккаунт
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Войти
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <Icon className="h-6 w-6 text-indigo-500" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {text}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
