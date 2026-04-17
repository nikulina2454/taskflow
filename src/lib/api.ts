import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "./auth-helpers";

export function apiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Проверьте поля формы", issues: error.flatten() },
      { status: 422 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "Внутренняя ошибка сервера" },
    { status: 500 },
  );
}
