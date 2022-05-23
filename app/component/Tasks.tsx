import type { Task } from "@prisma/client";
import { useState } from "react";
import { TaskItem } from "./TaskItem";
import { AnimatePresence, motion } from "framer-motion";

type TasksProps = {
  tasks: Task[];
  isBreak: boolean;
  isAnonymous: boolean;
};

export default function Tasks({ tasks, isBreak, isAnonymous }: TasksProps) {
  const [activeTaskId, setActiveTaskId] = useState<Task["id"]>("");
  const [editingTaskId, setEditingTaskId] = useState<Task["id"]>("");

  const activeTaskName = tasks.find((task) => task.id === activeTaskId)?.taskName;
  return (
    <>
      <div className='flex w-full items-center justify-center py-4'>
        <p className='text-lg font-semibold text-white'># {activeTaskName ?? "No active task"}</p>
      </div>
      {isAnonymous ? (
        <div className='ml-auto text-white'>
          <span>{tasks.length}/5</span>
        </div>
      ) : null}
      <motion.ul layout className='space-y-4 pb-4'>
        <AnimatePresence>
          {tasks.length ? (
            tasks.map((task) => {
              return (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  taskName={task.taskName}
                  isCompleted={task.isCompleted}
                  isBreak={isBreak}
                  activeTaskId={activeTaskId}
                  editingTaskId={editingTaskId}
                  setEditingTaskId={setEditingTaskId}
                  setActiveTaskId={setActiveTaskId}
                />
              );
            })
          ) : (
            <div className='flex w-full items-center justify-center py-4'>
              <p className='text-2xl font-bold text-white'> No task</p>
            </div>
          )}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
