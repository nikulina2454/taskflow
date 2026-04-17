# TaskFlow

Командный TodoList: проекты, задачи, теги, дедлайны, канбан с drag & drop и шаринг проектов между пользователями.

> Пет-проект для практики по веб-разработке (направление Open Source).

## Стек

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend:** Route Handlers внутри Next.js
- **БД:** PostgreSQL (Supabase / Neon)
- **ORM:** Prisma 6
- **Авторизация:** NextAuth v5 (credentials + Google)
- **Drag & Drop:** dnd-kit *(будет подключён на этапе канбана)*
- **Деплой:** Vercel

## Запуск локально

```bash
git clone https://github.com/ByteSpectre/taskflow.git
cd taskflow
npm install

cp .env.example .env
# заполнить DATABASE_URL и AUTH_SECRET

npx prisma migrate dev
npm run db:seed
npm run dev
```

Открыть http://localhost:3000.

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
- [x] Авторизация через NextAuth (email/пароль + Google)
- [x] Главная страница, страницы входа и регистрации
- [x] Сидер с тестовыми пользователями
- [ ] Список и страница проекта
- [ ] CRUD задач
- [ ] Канбан-доска с drag & drop
- [ ] Теги и фильтры
- [ ] Шаринг проекта по email
- [ ] Страница «Сегодня» и поиск
- [ ] Админ-панель
- [ ] Code Climate бейдж
- [ ] Деплой на Vercel
