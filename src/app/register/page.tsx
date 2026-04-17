import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Создайте аккаунт, чтобы вести проекты и задачи.
        </p>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
