import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  await Promise.all(getTasksName().map((task) => prisma.task.create({ data: { taskName: task } })));
};

seed().finally(async () => await prisma.$disconnect());

function getTasksName() {
  return ["Learn LRU cache", "Apply for internship", "Review PostgreSQL transactions"];
}
