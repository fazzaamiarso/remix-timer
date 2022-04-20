import { useState } from "react";
import { useInterval } from "~/hooks/use-interval";
import { TimerState } from "~/routes";

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

  const startTimer = () => {
    if (timerState === "running") return;
    setTimerState("running");
    setTimerCaptured({ start: Date.now(), stop: 0 });
  };
  const pauseTimer = () => {
    if (timerState === "paused" || timerState === "idle") return;
    setTimerState("paused");
    setTimerCaptured((prev) => ({ ...prev, stop: Date.now() }));
  };
  const clearTimer = () => {
    setTimerState("idle");
    setTimer({ minutes: initialTime, seconds: 0 });
    setTimerCaptured({ start: 0, stop: 0 });
  };

  return (
    <div className='mx-auto my-8 flex flex-col items-center space-y-8'>
      <div className='text-7xl font-bold'>{`${String(timer.minutes).padStart(2, "0")}:${String(timer.seconds).padStart(
        2,
        "0"
      )}`}</div>
      <div className='flex gap-3 '>
        <button type='button' onClick={startTimer} className='bg-pink-500 py-3 px-1'>
          Start
        </button>
        <button type='button' onClick={pauseTimer} className='py-3 px-1 ring-1 ring-pink-500'>
          Pause
        </button>
        <button type='button' onClick={clearTimer} className='py-3 px-1 text-pink-500'>
          Stop
        </button>
      </div>
    </div>
  );
}
