import { Tab } from "@headlessui/react";
import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";
import { TaskItem } from "~/component/TaskItem";
import Timer from "~/component/Timer";
import { mergeClassNames } from "~/utils/client";
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

  console.log(actionType);
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

export type TimerState = "idle" | "paused" | "running" | "init";
export default function Index() {
  const tasks = useLoaderData<Task[]>();

  const [isBreak, setIsBreak] = useState(false); //switch to state machine approach, maybe?
  const [timerState, setTimerState] = useState<TimerState>("init");
  const [timerCaptured, setTimerCaptured] = useState({ start: 0, stop: 0 });
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);

  let hadBeenCalled = false;
  const changeTab = (currentTabIdx: number) => {
    if (
      timerState === "running" &&
      !hadBeenCalled &&
      !confirm("Are you sure want to end the session? Timer will be reset.")
    ) {
      hadBeenCalled = true; // Have to keep track of the function call because there is a bug where this handler will be called multiple time after cancelling. Maybe because of the timer immediately change the state?
      return;
    }
    setIsBreak(currentTabIdx === 1);
    setSelectedTabIdx(currentTabIdx);
    setTimerState("idle");
  };

  return (
    <div className='mx-auto w-10/12 max-w-lg py-4 '>
      <h1 className='mb-6 text-2xl font-bold text-red-700'>Welcome to Remix Timer</h1>
      <Tab.Group selectedIndex={selectedTabIdx} onChange={changeTab}>
        <Tab.List className='mx-auto flex w-full max-w-sm justify-center gap-4 rounded-md bg-gray-200 px-1  py-1'>
          <Tab
            type='button'
            className={({ selected }) =>
              mergeClassNames("w-full rounded-md px-3 font-semibold", selected ? "bg-white" : "")
            }
          >
            Study
          </Tab>
          <Tab
            type='button'
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
                />
              );
            })
          ) : (
            <p className='text-lg'>No task yet!</p>
          )}
        </ul>
        <TaskForm />
      </div>
    </div>
  );
}

function TaskForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, [transition.type]);

  return (
    <Form method='post' className=''>
      {isOpen ? (
        <div className='flex flex-col gap-4'>
          <input ref={inputRef} type='text' id='task' name='task' aria-label='task' required className='w-full' />
          <div className='flex gap-2 self-end'>
            <button type='button' onClick={() => setIsOpen(false)} className='rounded-md px-2 py-1 ring-1  ring-black'>
              Cancel
            </button>
            <button
              type='submit'
              name='_action'
              value='create'
              className='rounded-md bg-black px-2 py-1 font-semibold text-white'
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          className='w-full rounded-md border-2 border-dashed border-slate-500 px-1 py-2 font-semibold hover:opacity-90'
        >
          Add task
        </button>
      )}
    </Form>
  );
}
