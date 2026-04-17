# TaskFlow

Командный TodoList: проекты, задачи, теги, дедлайны, канбан с drag & drop и шаринг проектов между пользователями.

> Пет-проект для практики по веб-разработке (направление Open Source).

## Стек

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend:** Route Handlers внутри Next.js
- **БД:** PostgreSQL на Supabase
- **ORM:** Prisma 6
- **Авторизация:** NextAuth v5 (email + пароль)
- **Drag & Drop:** dnd-kit
- **Деплой:** Vercel

## Запуск локально

```bash
git clone https://github.com/ByteSpectre/taskflow.git
cd taskflow
npm install

cp .env.example .env
# вставить пароль от Supabase в DATABASE_URL и DIRECT_URL
# при необходимости обновить AUTH_SECRET

npx prisma migrate dev
npm run db:seed
npm run dev
```

Открыть http://localhost:3000.

## Supabase

- Проект БД: `todolist`
- Ref: `opgqnvtonmahcdwqtfpf`
- API URL: `https://opgqnvtonmahcdwqtfpf.supabase.co`
- Схема `public` уже создана в Supabase под текущую Prisma-модель
- На таблицах `public` включён RLS, чтобы они не торчали наружу через Data API
- Для Prisma используются две строки подключения:
  - `DATABASE_URL` — transaction pooler `:6543` с `pgbouncer=true&connection_limit=1`
  - `DIRECT_URL` — session pooler `:5432` для миграций
- Осталось подставить реальный пароль БД в `.env` и выполнить `npm run db:seed`

## Тестовые доступы

После `npm run db:seed`:

| Роль        | Email                  | Пароль        |
|-------------|------------------------|---------------|
| Пользователь| `demo@taskflow.app`    | `Demo12345!`  |
| Пользователь| `alex@taskflow.app`    | `Alex12345!`  |
| Админ       | `admin@taskflow.app`   | `Admin12345!` |

## Скрипты

| Команда             | Что делает                                       |
|---------------------|--------------------------------------------------|
| `npm run dev`       | Дев-сервер на http://localhost:3000              |
| `npm run build`     | Прод-сборка                                      |
| `npm run lint`      | ESLint                                           |
| `npm run db:migrate`| Применить миграции в dev                         |
| `npm run db:push`   | Накатить схему без миграции (для прототипа)      |
| `npm run db:seed`   | Засеять тестовых пользователей и пример проекта  |
| `npm run db:studio` | Prisma Studio (веб-консоль БД)                   |

## Деплой

*Появится здесь после первого деплоя на Vercel.*

## Что уже сделано

- [x] Структура проекта на Next.js + Tailwind
- [x] Схема БД в Prisma (User, Project, ProjectMember, Task, Tag, TaskTag)
- [x] Авторизация через NextAuth (email/пароль)
- [x] Главная страница, страницы входа и регистрации
- [x] Сидер с тестовыми пользователями
- [x] Список и страница проекта (CRUD проектов, роли)
- [x] CRUD задач (статус, приоритет, дедлайн, теги)
- [x] Канбан с тремя колонками
- [x] Страница «Сегодня» — просрочки и дедлайны на сегодня
- [x] Drag & drop между колонками
- [x] Теги: страница и фильтры
- [x] Шаринг проекта по email
- [x] Поиск по задачам
- [x] Админ-панель
- [ ] Code Climate бейдж
- [ ] Деплой на Vercel
