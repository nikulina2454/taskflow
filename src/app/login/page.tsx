import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user) redirect("/projects");

  const { callbackUrl, error } = await searchParams;
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Войдите, чтобы продолжить работу с проектами.
        </p>

        <LoginForm
          callbackUrl={callbackUrl ?? "/projects"}
          showGoogle={hasGoogle}
          initialError={error}
        />

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
