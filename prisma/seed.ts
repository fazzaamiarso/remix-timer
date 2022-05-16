import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  const devUser = await prisma.user.create({
    data: {
      username: "dev",
      passwordHash: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u"
    }
  });
  await Promise.all(getTasksName().map((task) => prisma.task.create({ data: { userId: devUser.id, taskName: task } })));
};

seed().finally(async () => await prisma.$disconnect());

function getTasksName() {
  return ["Learn LRU cache", "Apply for internship", "Review PostgreSQL transactions"];
}
