import { useFetcher } from "@remix-run/react";
import type { ChangeEvent, MouseEvent } from "react";
import React, { useRef, useEffect } from "react";
import { CheckCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/solid";
import { mergeClassNames } from "~/utils/client";
import type { setStateType } from "~/types";
import type { Task } from "@prisma/client";
import { usePreviousValue } from "~/hooks/use-previousvalue";
import { motion } from "framer-motion";

type TaskItemProps = {
  id: string;
  taskName: string;
  isCompleted: boolean;
  isBreak: boolean;
  activeTaskId: Task["id"];
  editingTaskId: string;
  setEditingTaskId: setStateType<Task["id"]>;
  setActiveTaskId: setStateType<Task["id"]>;
};
export function TaskItem({
  id: taskId,
  taskName,
  isCompleted,
  isBreak,
  activeTaskId,
  editingTaskId,
  setEditingTaskId,
  setActiveTaskId
}: TaskItemProps) {
  const itemFetcher = useFetcher();
  const editRef = useRef<HTMLInputElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const fetcherAction = itemFetcher.submission?.formData.get("_action");

  const isCurrentlyEditing = editingTaskId === taskId;
  const isActiveTask = activeTaskId === taskId;
  const wasEditing = usePreviousValue(isCurrentlyEditing);

  useEffect(() => {
    if (fetcherAction === "edit") setEditingTaskId("");
    if (fetcherAction === "delete" && isActiveTask) setActiveTaskId("");
  }, [fetcherAction, isActiveTask, setActiveTaskId, setEditingTaskId]);

  useEffect(() => {
    if (!wasEditing && isCurrentlyEditing) editRef.current?.focus();
    if (wasEditing && !isCurrentlyEditing) initialFocusRef.current?.focus();
  }, [isCurrentlyEditing, wasEditing]);

  const toggleCompleted = (e: ChangeEvent<HTMLFormElement>) => {
    if (e.target.id !== taskId || isBreak) return;

    itemFetcher.submit(
      {
        taskId,
        isCompleted: isCompleted ? "" : "on",
        _action: "toggleTask"
      },
      {
        replace: true,
        method: "post"
      }
    );
  };

  const handleSetActive = (e: MouseEvent<HTMLLIElement>) => {
    if (e.target instanceof HTMLLIElement || e.target instanceof HTMLFormElement) setActiveTaskId(taskId);
  };

  return (
    <motion.li
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ ease: "easeIn" }}
      onClick={handleSetActive}
      className={mergeClassNames(
        "rounded-md border-l-4 bg-[#43446A] p-4 text-white ",
        isActiveTask ? "border-red-400" : "border-[#43446A]"
      )}
    >
      <itemFetcher.Form method='post' className='flex justify-between gap-2' onChange={toggleCompleted}>
        <input type='text' hidden name='taskId' defaultValue={taskId} />
        {isCurrentlyEditing ? (
          <div className='flex w-full flex-col gap-4'>
            <input
              type='text'
              defaultValue={taskName}
              name='editedTask'
              ref={editRef}
              className='w-full rounded-md bg-[#272851] text-white focus:border-white'
              aria-label='Editing Task'
            />
            <div className='flex gap-2 self-end'>
              <button
                className=' rounded-md px-3 py-1 text-sm font-semibold'
                type='button'
                onClick={() => setEditingTaskId("")}
              >
                Cancel <span className='sr-only'>Edit task</span>
              </button>
              <button
                className=' rounded-md bg-[#338bd3] px-3 py-1 text-sm  font-semibold text-white '
                name='_action'
                value='edit'
                type='submit'
              >
                Save <span className='sr-only'>your edit</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className=' relative flex items-center gap-4'>
              <input
                type='checkbox'
                id={taskId}
                name='isCompleted'
                defaultChecked={isCompleted}
                className='peer absolute z-10 h-8 w-8  opacity-0 hover:cursor-pointer'
              />
              <div className='peer-focus-visible:ring-1 peer-focus-visible:ring-red-500'>
                <CheckCircleIcon
                  aria-hidden='true'
                  className={mergeClassNames("aspect-square h-8 ", isCompleted ? "text-green-500" : "text-[#D3D4FF]")}
                />
              </div>
              <label
                htmlFor={taskId}
                className={mergeClassNames("hover:cursor-pointer", isCompleted ? "line-through opacity-90" : "")}
              >
                {taskName}
              </label>
            </div>
            <div className='flex gap-3'>
              <button
                aria-label={`Delete ${taskName}`}
                className={mergeClassNames(
                  "rounded-md p-1 text-white",
                  itemFetcher.submission?.formData.get("_action") === "delete" ? "opacity-60" : ""
                )}
                name='_action'
                value='delete'
                type='submit'
              >
                <TrashIcon aria-hidden='true' className='h-5' />
              </button>
              <button
                ref={initialFocusRef}
                className='rounded-md  p-1 text-white'
                type='button'
                onClick={() => setEditingTaskId(taskId)}
                aria-label={`Edit ${taskName}`}
              >
                <PencilIcon aria-hidden='true' className='h-5' />
              </button>
            </div>
          </>
        )}
      </itemFetcher.Form>
    </motion.li>
  );
}
