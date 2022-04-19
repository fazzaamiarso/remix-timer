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

export default function Index() {
  const [isBreak, setIsBreak] = useState(false); //switch to state machine approach, maybe?
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const tasks = useLoaderData<Task[]>();

  const [isOngoingSession, setIsOngoingSession] = useState(false);
  const [timer, setTimer] = useState({ minutes: USER_PREF.workTime, seconds: 0 });
  const [initialTime, setInitialTime] = useState(USER_PREF.workTime);
  const [timeLapsed, setTimeLapsed] = useState(0);

  const toggleBreak = () => {
    if (isOngoingSession && !confirm("Are you sure want to switch? Session will be reset")) return;
    setInitialTime(isBreak ? USER_PREF.breakTime : USER_PREF.workTime);
    setTimer({ minutes: isBreak ? USER_PREF.breakTime : USER_PREF.workTime, seconds: 0 });
    setIsBreak((prev) => !prev);
    setIsOngoingSession(false);
  };

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, [transition.type]);

  return (
    <div className='mx-auto w-10/12 max-w-lg py-4'>
      <h1 className='text-2xl font-bold text-red-700'>Welcome to Remix Timer</h1>
      <button onClick={toggleBreak} className='rounded-md bg-blue-500 py-2 font-bold'>
        {isBreak ? "Study" : "Break"}
      </button>
      <Timer
        setIsOngoingSession={setIsOngoingSession}
        isOngoingSession={isOngoingSession}
        initialTime={initialTime}
        timer={timer}
        setTimer={setTimer}
        setTimeLapsed={setTimeLapsed}
        setInitialTime={setInitialTime}
      />
      <div className='mt-8'>
        <ul className='pb-4` space-y-4'>
          {tasks.length ? (
            tasks.map((task) => {
              return (
                <ListItem
                  key={task.id}
                  id={task.id}
                  taskName={task.taskName}
                  isCompleted={task.isCompleted}
                  completionTime={task.completionTime}
                  timeLapsed={timeLapsed}
                  isWorkSession={isOngoingSession && !isBreak}
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
  timeLapsed: number;
  completionTime: number;
  isWorkSession: boolean;
};
function ListItem({
  id: taskId,
  taskName,
  isCompleted,
  completionTime,
  timeLapsed: timerTimeLapsed,
  isWorkSession
}: ListItemProps) {
  const itemFetcher = useFetcher();
  const mountedTime = useRef<number | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const hadToggleOnTimerStop = useRef(false);

  useEffect(() => {
    if (isWorkSession) hadToggleOnTimerStop.current = false;

    if (!isWorkSession && isCompleted) mountedTime.current = null;
    if (isWorkSession && isCompleted) mountedTime.current = null;
    if (!isWorkSession && !isCompleted) mountedTime.current = hadToggleOnTimerStop ? null : Date.now();
    if (isWorkSession && !isCompleted) mountedTime.current = Date.now();
  }, [isWorkSession, isCompleted]);

  //use Count rather than boolean
  useEffect(() => {
    if (itemFetcher.submission?.formData.get("_action") === "edit") {
      setIsEditing(false);
    }
  }, [itemFetcher.submission]);

  useEffect(() => {
    if (isEditing) editRef.current?.focus();
  }, [isEditing]);

  const toggleCompleted = (e: ChangeEvent<HTMLFormElement>) => {
    if (e.target.id !== taskId) return;

    const internalElapsedTime = mountedTime.current ? Date.now() - mountedTime.current : 0;
    const elapsedTime = hadToggleOnTimerStop.current
      ? String(completionTime)
      : isWorkSession
      ? String(completionTime + internalElapsedTime)
      : String(completionTime + timerTimeLapsed);

    itemFetcher.submit(
      {
        taskId,
        elapsedTime,
        isCompleted: isCompleted ? "" : "on",
        _action: "toggleTask"
      },
      {
        replace: true,
        method: "post"
      }
    );
    if (!isWorkSession && !isCompleted) hadToggleOnTimerStop.current = true;
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
        <div>{completionTime}</div>
        <div>{new Date(completionTime).getSeconds()}</div>
      </itemFetcher.Form>
    </li>
  );
}
