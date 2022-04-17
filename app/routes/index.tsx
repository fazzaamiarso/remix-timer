import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useTransition
} from "@remix-run/react";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import Timer from "~/component/Timer";
import { db } from "~/utils/prisma.server";

export const loader: LoaderFunction = async () => {
  const data = await db.task.findMany({ orderBy: { createdAt: "asc" } });
  return data;
};
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const newTask = formData.get("task");
  const taskId = formData.get("taskId");
  const actionType = formData.get("action");
  const isCompleted = Boolean(formData.get("isCompleted"));

  if (actionType && typeof actionType !== "string")
    return json({ message: "Action not allowed!" }, 405);
  if (taskId && typeof taskId !== "string")
    return json({ message: "Task Id not a string" }, 400);
  if (actionType === "delete" && taskId)
    return await db.task.delete({
      where: {
        id: taskId
      }
    });
  if (taskId) {
    return await db.task.update({
      where: { id: taskId },
      data: { isCompleted }
    });
  }

  if (!newTask || typeof newTask !== "string")
    return json({ message: "Please insert a task!" }, 400);

  return await db.task.create({
    data: {
      taskName: newTask
    }
  });
};

export default function Index() {
  const [isBreak, setIsBreak] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const tasks = useLoaderData<Task[]>();

  const [isOngoingSession, setIsOngoingSession] = useState(false);
  const [timer, setTimer] = useState({ minutes: 25, seconds: 0 });
  const [initialTime, setInitialTime] = useState(25);

  const toggleBreak = () => {
    if (
      isOngoingSession &&
      !confirm("Are you sure want to switch? Session will be reset")
    )
      return;
    setInitialTime(isBreak ? 10 : 25);
    setTimer({ minutes: isBreak ? 10 : 25, seconds: 0 });
    setIsBreak(!isBreak);
    setIsOngoingSession(false);
  };

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, [transition]);

  return (
    <div className='mx-auto w-10/12 max-w-lg py-4'>
      <h1 className='text-2xl font-bold text-red-700'>
        Welcome to Remix Timer
      </h1>
      <button
        onClick={toggleBreak}
        className='rounded-md bg-blue-500 py-2 font-bold'
      >
        {isBreak ? "Study" : "Break"}
      </button>
      <Timer
        setIsOngoingSession={setIsOngoingSession}
        isOngoingSession={isOngoingSession}
        initialTime={initialTime}
        timer={timer}
        setTimer={setTimer}
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
                  isOngoingSession={isOngoingSession}
                />
              );
            })
          ) : (
            <p className='text-lg'>No task yet!</p>
          )}
        </ul>
        <Form method='post' className='flex gap-2'>
          <input
            ref={inputRef}
            type='text'
            id='task'
            name='task'
            aria-label='task'
            required
          />
          <button
            type='submit'
            className='bg-pink-600 px-2 font-semibold text-white'
          >
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
  isOngoingSession: boolean;
  completionTime: number;
};
function ListItem({
  id,
  taskName,
  isCompleted,
  completionTime,
  isOngoingSession
}: ListItemProps) {
  const itemFetcher = useFetcher();

  const toggleCompleted = (e: ChangeEvent<HTMLFormElement>) => {
    itemFetcher.submit(e.currentTarget, {
      replace: true
    });
  };

  return (
    <li>
      <itemFetcher.Form
        method='post'
        className='flex gap-2'
        onChange={toggleCompleted}
      >
        <input
          type='checkbox'
          id={id}
          name='isCompleted'
          defaultChecked={isCompleted}
        />
        <label htmlFor={id}>{taskName}</label>
        <input type='text' hidden name='taskId' defaultValue={id} />
        <button
          className={`rounded-sm bg-red-600 px-2 text-white ${
            itemFetcher.submission?.formData.get("action") === "delete"
              ? "opacity-60"
              : ""
          }`}
          name='action'
          value='delete'
          type='submit'
        >
          Delete
        </button>
      </itemFetcher.Form>
    </li>
  );
}
