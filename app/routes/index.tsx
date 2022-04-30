// import { Tab } from "@headlessui/react";
import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import { useRef, useState, useEffect, ReactNode } from "react";
import Tasks from "~/component/Tasks";
import Timer from "~/component/Timer";
import { mergeClassNames } from "~/utils/client";
import { db } from "~/utils/prisma.server";
import { createTask, deleteTask, editTask, toggleTask } from "~/utils/task.server";

import { Tabs, TabList, Tab, TabPanels, TabPanel, useTabsContext } from "@reach/tabs";

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

export type TimerState = "idle" | "paused" | "running" | "init";
export default function Index() {
  const tasks = useLoaderData<Task[]>();

  const [isBreak, setIsBreak] = useState(false); //switch to state machine approach, maybe?
  const [timerState, setTimerState] = useState<TimerState>("init");
  const [timerCaptured, setTimerCaptured] = useState({ start: 0, stop: 0 });
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);

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
    <div className='mx-auto w-10/12 max-w-lg py-12 '>
      <h1 className='sr-only'>Welcome to Remix Timer</h1>
      <Tabs index={selectedTabIdx} onChange={handleTabsChange}>
        <TabList className='mx-auto flex w-full justify-center gap-4 rounded-md bg-[#272851] p-1 '>
          <CustomTab index={0}>Study</CustomTab>
          <CustomTab index={1}>Break</CustomTab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Timer
              key={`${selectedTabIdx}0`}
              setTimerState={setTimerState}
              timerState={timerState}
              initialTime={USER_PREF.workTime}
              setTimerCaptured={setTimerCaptured}
            />
          </TabPanel>
          <TabPanel>
            <Timer
              key={`${selectedTabIdx}1`}
              setTimerState={setTimerState}
              timerState={timerState}
              initialTime={USER_PREF.breakTime}
              setTimerCaptured={setTimerCaptured}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <div className=''>
        <Tasks tasks={tasks} timerState={timerState} timerCaptured={timerCaptured} isBreak={isBreak} />
        <TaskForm />
      </div>
    </div>
  );
}

function CustomTab({ index, children }: { index: number; children: ReactNode }) {
  const { selectedIndex } = useTabsContext();
  const isActiveTab = selectedIndex === index;
  return (
    <Tab
      className={mergeClassNames("w-full rounded-md px-3 font-semibold text-white", isActiveTab ? "bg-[#43446A]" : "")}
    >
      {children}
    </Tab>
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
              className='rounded-md px-3 py-1 font-semibold text-white  '
            >
              Cancel
            </button>
            <button
              type='submit'
              name='_action'
              value='create'
              className='rounded-md bg-[#338bd3] px-2 py-1 font-semibold text-white'
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          className='w-full rounded-md border-2 border-dashed border-white  px-1 py-2 font-semibold text-white hover:border-gray-300 '
        >
          Add task
        </button>
      )}
    </Form>
  );
}
