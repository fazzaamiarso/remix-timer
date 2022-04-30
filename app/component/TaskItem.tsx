import { useFetcher } from "@remix-run/react";
import React, { useRef, useEffect, ChangeEvent, MouseEvent } from "react";
import { TimerState } from "~/routes";
import { CheckCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/solid";
import { mergeClassNames } from "~/utils/client";
import { setStateType } from "~/types";
import { Task } from "@prisma/client";

type TaskItemProps = {
  id: string;
  taskName: string;
  isCompleted: boolean;
  timerCaptured: { start: number; stop: number };
  completionTime: number;
  timerState: TimerState;
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
  completionTime,
  timerCaptured,
  timerState,
  isBreak,
  activeTaskId,
  editingTaskId,
  setEditingTaskId,
  setActiveTaskId
}: TaskItemProps) {
  const itemFetcher = useFetcher();
  const mountedTime = useRef<number>(0);
  const editRef = useRef<HTMLInputElement>(null);
  const toggleOnStopCount = useRef(0);

  const isCurrentlyEditing = editingTaskId === taskId;
  const isActiveTask = activeTaskId === taskId;

  useEffect(() => {
    if (timerState === "running") toggleOnStopCount.current = 0;
    if (!isCompleted) mountedTime.current = Date.now();
    if (isCompleted) mountedTime.current = 0;
  }, [isCompleted, timerState]);

  useEffect(() => {
    if (itemFetcher.submission?.formData.get("_action") === "edit") {
      setEditingTaskId("");
    }
    if (itemFetcher.submission?.formData.get("_action") === "delete" && isActiveTask) {
      setActiveTaskId("");
    }
  }, [itemFetcher.submission, isActiveTask, setActiveTaskId, setEditingTaskId]);

  useEffect(() => {
    if (isCurrentlyEditing) editRef.current?.focus();
  }, [isCurrentlyEditing]);

  const toggleCompleted = (e: ChangeEvent<HTMLFormElement>) => {
    if (e.target.id !== taskId || isBreak) return;

    const timeWhenClicked = Date.now();
    if (timerState === "running")
      return itemFetcher.submit(
        {
          taskId,
          elapsedTime: isCompleted
            ? String(completionTime)
            : String(completionTime + (timeWhenClicked - mountedTime.current)),
          isCompleted: isCompleted ? "" : "on",
          _action: "toggleTask"
        },
        {
          replace: true,
          method: "post"
        }
      );
    //TODO: Still has 1 bug
    if (timerState === "paused") {
      itemFetcher.submit(
        {
          taskId,
          elapsedTime:
            toggleOnStopCount.current > 0 || isCompleted
              ? String(completionTime)
              : String(
                  completionTime +
                    (timerCaptured.stop -
                      (timerCaptured.stop > mountedTime.current ? mountedTime.current : timerCaptured.start))
                ),
          isCompleted: isCompleted ? "" : "on",
          _action: "toggleTask"
        },
        {
          replace: true,
          method: "post"
        }
      );
      toggleOnStopCount.current = isCompleted ? toggleOnStopCount.current : toggleOnStopCount.current + 1;
      return;
    }
    itemFetcher.submit(
      {
        taskId,
        elapsedTime: String(completionTime),
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
    if (!(e.target instanceof HTMLLIElement)) return;
    setActiveTaskId(taskId);
  };

  return (
    <li
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
            />
            <div className='flex gap-2 self-end'>
              <button
                className=' rounded-md px-3 py-1 text-sm font-semibold'
                type='button'
                onClick={() => setEditingTaskId("")}
              >
                Cancel
              </button>
              <button
                className=' rounded-md bg-[#338bd3] px-3 py-1 text-sm  font-semibold text-white '
                name='_action'
                value='edit'
                type='submit'
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className='relative flex items-center gap-4'>
              <input
                type='checkbox'
                id={taskId}
                name='isCompleted'
                defaultChecked={isCompleted}
                className=' absolute z-10 h-8 w-8 opacity-0  hover:cursor-pointer'
              />
              <div className=''>
                <CheckCircleIcon
                  className={mergeClassNames("aspect-square h-8 ", isCompleted ? "text-green-500" : "text-[#D3D4FF]")}
                />
              </div>
              <label htmlFor={taskId} className={mergeClassNames(isCompleted ? "line-through opacity-90" : "")}>
                {taskName}
              </label>
            </div>
            <div className='flex gap-3'>
              <button
                aria-label='Delete Task'
                className={`rounded-md p-1 text-white ${
                  itemFetcher.submission?.formData.get("_action") === "delete" ? "opacity-60" : ""
                }`}
                name='_action'
                value='delete'
                type='submit'
              >
                <TrashIcon aria-hidden='true' className='h-5' />
              </button>
              <button
                className='rounded-md  p-1 text-white'
                type='button'
                onClick={() => setEditingTaskId(taskId)}
                aria-label='Edit Task'
              >
                <PencilIcon aria-hidden='true' className='h-5' />
              </button>
            </div>
          </>
        )}
      </itemFetcher.Form>
    </li>
  );
}
