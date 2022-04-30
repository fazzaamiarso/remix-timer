import { Task } from "@prisma/client";
import { useState } from "react";
import { TimerState } from "~/routes";
import { TaskItem } from "./TaskItem";

type TasksProps = {
  tasks: Task[];
  timerState: TimerState;
  timerCaptured: {
    start: number;
    stop: number;
  };
  isBreak: boolean;
};

export default function Tasks({ tasks, timerCaptured, timerState, isBreak }: TasksProps) {
  const [activeTaskId, setActiveTaskId] = useState<Task["id"]>("");
  const [editingTaskId, setEditingTaskId] = useState<Task["id"]>("");

  const activeTaskName = tasks.find((task) => task.id === activeTaskId)?.taskName;
  return (
    <>
      <div className='flex w-full items-center justify-center py-4'>
        <p className='text-lg font-semibold text-white'># {activeTaskName ?? "No active task"}</p>
      </div>
      <ul className='space-y-4 pb-4'>
        {tasks.length ? (
          tasks.map((task) => {
            return (
              <TaskItem
                key={task.id}
                id={task.id}
                taskName={task.taskName}
                isCompleted={task.isCompleted}
                completionTime={task.completionTime}
                timerState={timerState}
                timerCaptured={timerCaptured}
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
      </ul>
    </>
  );
}
