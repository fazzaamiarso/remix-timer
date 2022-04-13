import type { Task } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import { useRef, useState, useEffect, ChangeEvent } from "react";
import { db } from "~/utils/prisma.server";

function useInterval(callback: () => void, delay: null | number) {
  const savedCallback = useRef<typeof callback>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
    console.log("callbackRef changed");
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (!savedCallback.current) return;
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const loader: LoaderFunction = async () => {
  const data = await db.task.findMany();
  return data;
};
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const newTask = formData.get("task");
  const taskId = formData.get("taskId");
  const actionType = formData.get("action");

  if (actionType && typeof actionType !== "string")
    return json({ message: "Action not allowed!" }, 405);
  if (taskId && typeof taskId !== "string")
    return json({ message: "Task Id not a string" }, 400);
  if (actionType === "delete" && taskId)
    return await db.task.delete({
      where: {
        id: taskId,
      },
    });

  if (!newTask || typeof newTask !== "string")
    return json({ message: "Please insert a task!" }, 400);

  return await db.task.create({
    data: {
      taskName: newTask,
    },
  });
};

export default function Index() {
  const [chosenTime, setChosenTime] = useState(25);
  const [time, setTime] = useState({ minutes: chosenTime, seconds: 0 });
  const [start, setStart] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const tasks = useLoaderData<Task[]>();

  useInterval(
    () => {
      if (time.seconds === 0 && time.minutes === 0) return clearTimer();
      if (time.seconds === 0)
        return setTime((prev) => ({ minutes: prev.minutes - 1, seconds: 59 }));
      else
        setTime((prev) => ({
          minutes: prev.minutes,
          seconds: prev.seconds - 1,
        }));
    },
    start ? 1000 : null
  );

  useEffect(() => {
    if (!inputRef.current) return;
    if (transition.type === "actionSubmission") inputRef.current.value = "";
  }, [transition]);

  const changeTime = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target || start) return;

    if (Number(e.target.value) > 60) return;
    setChosenTime(Number(e.target.value));
    setTime({ minutes: Number(e.target.value), seconds: 0 });
  };

  const startTimer = () => {
    setStart(true);
  };
  const pauseTimer = () => {
    setStart(false);
  };
  const clearTimer = () => {
    setStart(false);
    setTime({ minutes: chosenTime, seconds: 0 });
  };

  return (
    <div className="w-10/12 max-w-lg mx-auto py-4">
      <h1 className="text-2xl font-bold text-red-700">
        Welcome to Remix Timer
      </h1>
      <div className="mx-auto space-y-4">
        <div className="text-xl">{`${String(time.minutes).padStart(
          2,
          "0"
        )}:${String(time.seconds).padStart(2, "0")}`}</div>
        <input
          type="text"
          value={chosenTime}
          onChange={changeTime}
          pattern="[0-9]{2}"
          maxLength={2}
        />
        <div className="flex gap-3 ">
          <button
            type="button"
            onClick={startTimer}
            className="py-3 px-1 bg-pink-500"
          >
            Start
          </button>
          <button
            type="button"
            onClick={pauseTimer}
            className="py-3 px-1 ring-pink-500 ring-1"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={clearTimer}
            className="py-3 px-1 text-pink-500"
          >
            Stop
          </button>
        </div>
      </div>
      <div className="mt-8">
        <ul className="space-y-4 pb-4`">
          {tasks.length ? (
            tasks.map((task) => {
              return (
                <li key={task.id} className="flex gap-2">
                  {task.taskName}
                  <Form method="post">
                    <input
                      type="text"
                      hidden
                      name="taskId"
                      defaultValue={task.id}
                    />
                    <button
                      className="bg-red-600 px-2 text-white rounded-sm"
                      name="action"
                      value="delete"
                      type="submit"
                    >
                      Delete
                    </button>
                  </Form>
                </li>
              );
            })
          ) : (
            <p className="text-lg">No task yet!</p>
          )}
        </ul>
        <Form method="post" className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            id="task"
            name="task"
            aria-label="task"
            required
          />
          <button
            type="submit"
            className="bg-pink-600 text-white font-semibold px-2"
          >
            Add task
          </button>
        </Form>
      </div>
    </div>
  );
}
