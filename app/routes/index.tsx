import { Tab } from "@headlessui/react";
import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useTransition } from "@remix-run/react";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import Timer from "~/component/Timer";
import { db } from "~/utils/prisma.server";
import { createTask, deleteTask, editTask, toggleTask } from "~/utils/task.server";

export const loader: LoaderFunction = async () => {
  const data = await db.task.findMany({ orderBy: { createdAt: "asc" } });
  return data;
};
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const newTask = formData.get("task");
  const editedTask = formData.get("editedTask");
  const taskId = formData.get("taskId");
  const actionType = formData.get("_action");
  const isCompleted = Boolean(formData.get("isCompleted"));
  const elapsedTime = Number(formData.get("elapsedTime"));

  if (typeof actionType !== "string") return json({ message: "Action is not a string" }, 400);
  if (taskId && typeof taskId !== "string") return json({ message: "TaskId is not a string" }, 400);
  if (editedTask && typeof editedTask !== "string") return json({ message: "EditedTask is not a string" }, 400);

  switch (actionType) {
    case "create":
      if (typeof newTask !== "string") return json({ message: "Please insert a task!" }, 400);
      return await createTask(newTask);
    case "delete":
      if (taskId) return await deleteTask(taskId);
    case "toggleTask":
      if (taskId) return await toggleTask(taskId, elapsedTime, isCompleted);
    case "edit":
      if (taskId && editedTask) return await editTask(taskId, editedTask);
    default:
      throw new Error(`Unhandled action: ${actionType}`);
  }
};

//TODO: move to persisted storage
const USER_PREF = {
  workTime: 25,
  breakTime: 10
};

const mergeClassNames = (...classNames: string[]) => {
  return classNames.filter(Boolean).join(" ");
};

export type TimerState = "idle" | "paused" | "running" | "init";

export default function Index() {
  const [isBreak, setIsBreak] = useState(false); //switch to state machine approach, maybe?
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const tasks = useLoaderData<Task[]>();

  const [timerState, setTimerState] = useState<TimerState>("init");
  const [timerCaptured, setTimerCaptured] = useState({ start: 0, stop: 0 });

  const changeTab = (currentTabIdx: number) => {
    //TODO: Need confirmation if timer running
    setIsBreak(currentTabIdx === 1);
  };

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, [transition.type]);

  return (
    <div className='mx-auto w-10/12 max-w-lg py-4 '>
      <h1 className='mb-6 text-2xl font-bold text-red-700'>Welcome to Remix Timer</h1>
      <Tab.Group onChange={changeTab}>
        <Tab.List className='mx-auto flex w-full max-w-sm justify-center gap-4 rounded-md bg-gray-200 px-1  py-1'>
          <Tab
            className={({ selected }) =>
              mergeClassNames("w-full rounded-md px-3 font-semibold", selected ? "bg-white" : "")
            }
          >
            Study
          </Tab>
          <Tab
            className={({ selected }) =>
              mergeClassNames("w-full rounded-md px-3 font-semibold", selected ? "bg-white" : "")
            }
          >
            Break
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <Timer
              setTimerState={setTimerState}
              timerState={timerState}
              initialTime={USER_PREF.workTime}
              setTimerCaptured={setTimerCaptured}
            />
          </Tab.Panel>
          <Tab.Panel>
            <Timer
              setTimerState={setTimerState}
              timerState={timerState}
              initialTime={USER_PREF.breakTime}
              setTimerCaptured={setTimerCaptured}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className='mt-20 space-y-6'>
        <ul className='space-y-8 pb-4'>
          {tasks.length ? (
            tasks.map((task) => {
              return (
                <ListItem
                  key={task.id}
                  id={task.id}
                  taskName={task.taskName}
                  isCompleted={task.isCompleted}
                  completionTime={task.completionTime}
                  timerState={timerState}
                  timerCaptured={timerCaptured}
                  isBreak={isBreak}
                />
              );
            })
          ) : (
            <p className='text-lg'>No task yet!</p>
          )}
        </ul>
        <Form method='post' className='flex gap-2'>
          <input ref={inputRef} type='text' id='task' name='task' aria-label='task' required />
          <button type='submit' name='_action' value='create' className='bg-pink-600 px-2 font-semibold text-white'>
            Add task
          </button>
        </Form>
      </div>
    </div>
  );
}

type ListItemProps = {
  id: string;
  taskName: string;
  isCompleted: boolean;
  timerCaptured: { start: number; stop: number };
  completionTime: number;
  timerState: TimerState;
  isBreak: boolean;
};
function ListItem({
  id: taskId,
  taskName,
  isCompleted,
  completionTime,
  timerCaptured,
  timerState,
  isBreak
}: ListItemProps) {
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
    }
  };
  return (
    <li>
      <itemFetcher.Form method='post' className='flex gap-2' onChange={toggleCompleted}>
        <input type='text' hidden name='taskId' defaultValue={taskId} />
        {isEditing ? (
          <>
            <input type='text' defaultValue={taskName} name='editedTask' ref={editRef} />
            <button className=' rounded-sm px-2 ring-1 ring-blue-600' type='button' onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className=' rounded-sm bg-blue-600 px-2 text-white ' name='_action' value='edit' type='submit'>
              Save
            </button>
          </>
        ) : (
          <>
            <input type='checkbox' id={taskId} name='isCompleted' defaultChecked={isCompleted} />
            <label htmlFor={taskId}>{taskName}</label>
            <button
              className={`rounded-sm bg-red-600 px-2 text-white ${
                itemFetcher.submission?.formData.get("_action") === "delete" ? "opacity-60" : ""
              }`}
              name='_action'
              value='delete'
              type='submit'
            >
              Delete
            </button>
            <button className='rounded-sm bg-blue-600 px-2 text-white' type='button' onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </>
        )}
        {/* <div>{completionTime}</div>
        <div>
          {new Date(completionTime).getMinutes()}:{new Date(completionTime).getSeconds()}
        </div> */}
      </itemFetcher.Form>
    </li>
  );
}
