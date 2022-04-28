import { useFetcher } from "@remix-run/react";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import { TimerState } from "~/routes";
import { CheckCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/solid";
import { mergeClassNames } from "~/utils/client";

type TaskItemProps = {
  id: string;
  taskName: string;
  isCompleted: boolean;
  timerCaptured: { start: number; stop: number };
  completionTime: number;
  timerState: TimerState;
  isBreak: boolean;
};
export function TaskItem({
  id: taskId,
  taskName,
  isCompleted,
  completionTime,
  timerCaptured,
  timerState,
  isBreak
}: TaskItemProps) {
  const itemFetcher = useFetcher();
  const mountedTime = useRef<number>(0);
  const editRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const toggleOnStopCount = useRef(0);

  useEffect(() => {
    if (timerState === "running") toggleOnStopCount.current = 0;
    if (!isCompleted) mountedTime.current = Date.now();
    if (isCompleted) mountedTime.current = 0;
  }, [isCompleted, timerState]);

  useEffect(() => {
    if (itemFetcher.submission?.formData.get("_action") === "edit") {
      setIsEditing(false);
    }
  }, [itemFetcher.submission]);

  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

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
  return (
    <li>
      <itemFetcher.Form
        method='post'
        className='flex justify-between gap-2 rounded-md bg-[#43446A] p-4 text-white'
        onChange={toggleCompleted}
      >
        <input type='text' hidden name='taskId' defaultValue={taskId} />
        {isEditing ? (
          <div className='flex w-full flex-col gap-4'>
            <input
              type='text'
              defaultValue={taskName}
              name='editedTask'
              ref={editRef}
              className='w-full rounded-md bg-[#272851] text-white focus:border-white'
            />
            <div className='flex gap-2 self-end'>
              <button className=' rounded-md px-2 font-semibold' type='button' onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button
                className=' rounded-md bg-[#338bd3] px-2  font-semibold text-white '
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
                onClick={() => setIsEditing(true)}
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
