import { useState } from "react";
import { useInterval } from "~/hooks/use-interval";
import { TimerState } from "~/routes";
import { mergeClassNames } from "~/utils/client";

type setStateType<Type> = React.Dispatch<React.SetStateAction<Type>>;
type TimerProps = {
  initialTime: number;
  timerState: TimerState;
  setTimerState: setStateType<TimerState>;
  setTimerCaptured: setStateType<{ start: number; stop: number }>;
};

export default function Timer({ timerState, initialTime, setTimerState, setTimerCaptured }: TimerProps) {
  const [timer, setTimer] = useState({ minutes: initialTime, seconds: 0 });

  useInterval(
    () => {
      if (timer.seconds === 0 && timer.minutes === 0) return clearTimer();
      if (timer.seconds === 0) return setTimer((prev) => ({ minutes: prev.minutes - 1, seconds: 59 }));
      else
        setTimer((prev) => ({
          minutes: prev.minutes,
          seconds: prev.seconds - 1
        }));
    },
    timerState === "running" ? 1000 : null
  );

  const clearTimer = () => {
    setTimerState("idle");
    setTimer({ minutes: initialTime, seconds: 0 });
    setTimerCaptured({ start: 0, stop: 0 });
  };

  const toggleTimer = () => {
    if (timerState === "running") {
      setTimerState("paused");
      setTimerCaptured((prev) => ({ ...prev, stop: Date.now() }));
      return;
    }
    setTimerState("running");
    setTimerCaptured({ start: Date.now(), stop: 0 });
  };

  return (
    <div className='mx-auto my-8 flex flex-col items-center space-y-8'>
      <div className='text-7xl font-bold'>{`${String(timer.minutes).padStart(2, "0")}:${String(timer.seconds).padStart(
        2,
        "0"
      )}`}</div>
      <div className='flex gap-3 '>
        <button
          type='button'
          onClick={toggleTimer}
          className={mergeClassNames(
            " group relative rounded-md bg-red-400 px-6 py-3 font-semibold text-white active:translate-y-1"
          )}
        >
          {timerState === "running" ? "Pause" : "Play"}
          <span className='absolute inset-0 -z-10 translate-y-1 rounded-md bg-gray-300 group-active:hidden' />
        </button>
        <button type='button' onClick={clearTimer} className={mergeClassNames("py-3 px-1 font-semibold")}>
          {timerState === "running" ? "End" : timerState === "paused" ? "Reset" : ""}
        </button>
      </div>
    </div>
  );
}
