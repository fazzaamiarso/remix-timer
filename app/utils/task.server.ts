import type { Task } from "@prisma/client";
import { db } from "./prisma.server";

export const createTask = (taskName: Task["taskName"]) => {
  return db.task.create({
    data: {
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
export const toggleTask = (
  taskId: Task["id"],
  completionTime: Task["completionTime"],
  isCompleted: Task["isCompleted"]
) => {
  return db.task.update({
    where: {
      id: taskId
    },
    data: { completionTime, isCompleted }
  });
};
