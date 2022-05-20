import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData, useTransition } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";
import Tasks from "~/component/Tasks";
import { mergeClassNames } from "~/utils/client";
import { db } from "~/utils/prisma.server";
import { createTask, deleteTask, editTask, toggleTask } from "~/utils/task.server";

import TimerTabs from "~/component/Tabs";
import { usePreviousValue } from "~/hooks/use-previousvalue";
import { getUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userData = await getUserId(request);
  if (!userData) throw Error("User Data should exist!");

  const data = await db.task.findMany({ where: { userId: userData.userId }, orderBy: { createdAt: "asc" } });
  return json({ data, userId: userData.userId, isAnonymous: userData.isAnonymous });
};
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const newTask = formData.get("task");
  const editedTask = formData.get("editedTask");
  const taskId = formData.get("taskId");
  const actionType = formData.get("_action");
  const isCompleted = Boolean(formData.get("isCompleted"));

  const userData = await getUserId(request);
  if (!userData) throw Error("Anonymous Session should been set!");

  if (typeof actionType !== "string") return json({ message: "Action is not a string" }, 400);
  if (taskId && typeof taskId !== "string") return json({ message: "TaskId is not a string" }, 400);
  if (editedTask && typeof editedTask !== "string") return json({ message: "EditedTask is not a string" }, 400);

  switch (actionType) {
    case "create":
      if (typeof newTask !== "string") return json({ message: "Please insert a task!" }, 400);
      return await createTask(userData.userId, newTask);
    case "delete":
      if (taskId) return await deleteTask(taskId);
    case "toggleTask":
      if (taskId) return await toggleTask(taskId, isCompleted);
    case "edit":
      if (taskId && editedTask) return await editTask(taskId, editedTask);
    default:
      throw new Error(`Unhandled action: ${actionType}`);
  }
};

export type TimerState = "idle" | "paused" | "running" | "init";
export default function App() {
  const { data: tasks, isAnonymous } = useLoaderData<{ data: Task[]; isAnonymous: boolean; userId: string }>();

  const [isBreak, setIsBreak] = useState(false); //switch to state machine approach, maybe?
  const [timerState, setTimerState] = useState<TimerState>("init");
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);

  const isLimitReached = isAnonymous && tasks.length === 5;

  const handleTabsChange = (index: number) => {
    if (
      (timerState === "running" || timerState === "paused") &&
      !confirm("Are you sure want to end the session? Timer will be reset.")
    )
      return;
    setIsBreak(index === 1 ? true : false);
    setSelectedTabIdx(index);
    setTimerState("idle");
  };

  return (
    <main className='mx-auto w-10/12 max-w-lg pb-16'>
      <TimerTabs
        selectedTabIdx={selectedTabIdx}
        handleTabsChange={handleTabsChange}
        setTimerState={setTimerState}
        timerState={timerState}
      />
      <div className=''>
        <Tasks tasks={tasks} isBreak={isBreak} isAnonymous={isAnonymous} />
        <TaskForm isLimitReached={isLimitReached} />
      </div>
      <Outlet />
    </main>
  );
}

function TaskForm({ isLimitReached }: { isLimitReached: boolean }) {
  const transition = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const wasOpened = usePreviousValue(isOpen);

  useEffect(() => {
    if (isLimitReached && isOpen) return setIsOpen(false);
  }, [isOpen, isLimitReached]);
  useEffect(() => {
    if (!wasOpened && isOpen) inputRef.current?.focus();
    if (wasOpened && !isOpen) initialFocusRef.current?.focus();
  }, [isOpen, wasOpened]);

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, [transition.type]);

  return (
    <Form method='post' className={mergeClassNames("rounded-md ", isOpen ? "bg-[#43446A] p-4" : "")}>
      {isOpen ? (
        <div className='flex flex-col gap-4'>
          <input
            ref={inputRef}
            type='text'
            id='task'
            name='task'
            aria-label='task'
            required
            className='w-full rounded-md bg-[#272851] text-white focus:border-white'
          />
          <div className='flex gap-2 self-end'>
            <button
              type='button'
              onClick={() => setIsOpen(false)}
              className='rounded-md px-3 py-1 text-sm  font-semibold text-white  '
            >
              Cancel
            </button>
            <button
              type='submit'
              name='_action'
              value='create'
              className='rounded-md bg-[#338bd3] px-3 py-1 text-sm  font-semibold text-white'
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <button
          disabled={isLimitReached}
          ref={initialFocusRef}
          type='button'
          onClick={() => setIsOpen(true)}
          className='w-full rounded-md border-2 border-dashed border-white px-1  py-2 font-semibold text-white hover:border-gray-300 disabled:border-gray-100 disabled:text-gray-100 '
        >
          Add task
        </button>
      )}
    </Form>
  );
}
