import { PrismaClient, Priority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: "demo@taskflow.app",
    name: "Demo User",
    password: "Demo12345!",
    role: "USER" as const,
  },
  {
    email: "alex@taskflow.app",
    name: "Алекс",
    password: "Alex12345!",
    role: "USER" as const,
  },
  {
    email: "admin@taskflow.app",
    name: "Admin",
    password: "Admin12345!",
    role: "ADMIN" as const,
  },
];

async function main() {
  console.log("Чищу старые данные...");
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Создаю тестовых пользователей...");
  const users = await Promise.all(
    TEST_USERS.map(async (u) =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash: await bcrypt.hash(u.password, 10),
        },
      }),
    ),
  );

  const [demo, alex] = users;

  console.log("Создаю теги...");
  const [workTag, studyTag, urgentTag] = await Promise.all([
    prisma.tag.create({
      data: { name: "Работа", color: "#6366f1", ownerId: demo.id },
    }),
    prisma.tag.create({
      data: { name: "Учёба", color: "#22c55e", ownerId: demo.id },
    }),
    prisma.tag.create({
      data: { name: "Срочно", color: "#ef4444", ownerId: demo.id },
    }),
  ]);

  console.log("Создаю проекты и задачи...");
  const project = await prisma.project.create({
    data: {
      title: "Курсовая по веб-разработке",
      description: "TaskFlow на Next.js + Prisma + Postgres",
      color: "#6366f1",
      ownerId: demo.id,
      members: {
        create: [
          { userId: demo.id, role: "OWNER" },
          { userId: alex.id, role: "EDITOR" },
        ],
      },
      tasks: {
        create: [
          {
            title: "Сверстать главную страницу",
            description: "Hero, фичи, CTA",
            status: TaskStatus.DONE,
            priority: Priority.MEDIUM,
            position: 0,
            completedAt: new Date(),
            tags: { create: [{ tagId: workTag.id }] },
          },
          {
            title: "Подключить Prisma и описать схему",
            status: TaskStatus.DONE,
            priority: Priority.HIGH,
            position: 1,
            completedAt: new Date(),
            tags: { create: [{ tagId: workTag.id }] },
          },
          {
            title: "Канбан с drag & drop",
            description: "dnd-kit, перетаскивание между колонками",
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.HIGH,
            position: 0,
            dueDate: addDays(new Date(), 2),
            tags: { create: [{ tagId: urgentTag.id }] },
          },
          {
            title: "Написать README и отчёт",
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            position: 0,
            dueDate: addDays(new Date(), 5),
            tags: { create: [{ tagId: studyTag.id }] },
          },
          {
            title: "Подключить Code Climate",
            status: TaskStatus.TODO,
            priority: Priority.LOW,
            position: 1,
            dueDate: addDays(new Date(), 7),
          },
        ],
      },
    },
  });

  console.log(`Готово. Проект: ${project.title}`);
  console.log("");
  console.log("Тестовые доступы:");
  TEST_USERS.forEach((u) =>
    console.log(`  ${u.email} / ${u.password}  (${u.role})`),
  );
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
