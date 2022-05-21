import type { Task } from "@prisma/client";
import { db } from "./prisma.server";

export const createTask = (userId: Task["userId"], taskName: Task["taskName"]) => {
  return db.task.create({
    data: {
      userId,
      taskName
    }
  });
};

export const editTask = (taskId: Task["id"], editedTask: Task["taskName"]) => {
  return db.task.update({
    where: {
      id: taskId
    },
    data: { taskName: editedTask }
  });
};

export const deleteTask = (taskId: Task["id"]) => {
  return db.task.delete({
    where: {
      id: taskId
    }
  });
};
export const toggleTask = (taskId: Task["id"], isCompleted: Task["isCompleted"]) => {
  return db.task.update({
    where: {
      id: taskId
    },
    data: { isCompleted }
  });
};
