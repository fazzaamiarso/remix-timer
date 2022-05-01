import { useState } from "react";
import { useInterval } from "~/hooks/use-interval";
import { TimerState } from "~/routes";
import { setStateType } from "~/types";
import { mergeClassNames } from "~/utils/client";

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
      if (timer.seconds === 0 && timer.minutes === 0) return resetTimer(); // TODO: create end logic
      if (timer.seconds === 0) return setTimer((prev) => ({ minutes: prev.minutes - 1, seconds: 59 }));
      else
        setTimer((prev) => ({
          minutes: prev.minutes,
          seconds: prev.seconds - 1
        }));
    },
    timerState === "running" ? 1000 : null
  );

  const resetTimer = () => {
    if (!confirm("Are you sure want to end the session?")) return;
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
    <div className='mx-auto my-8 flex flex-col items-center space-y-8 rounded-md bg-[#43446A] py-8'>
      <div className='text-7xl font-bold text-white'>{`${String(timer.minutes).padStart(2, "0")}:${String(
        timer.seconds
      ).padStart(2, "0")}`}</div>
      <div className='flex gap-3 '>
        <button //TODO: fix the button lift effect
          type='button'
          onClick={toggleTimer}
          className='relative w-max bg-transparent  font-semibold text-white'
        >
          <span className='absolute top-0 left-0 h-full w-full translate-y-px rounded-md bg-[#1a65a1]' />
          <span className='relative block  -translate-y-1 rounded-md bg-[#3C7AAE] px-6 py-3  active:translate-y-0'>
            {timerState === "running" ? "Pause" : "Start"}{" "}
            <span className='sr-only'>
              timer at {timer.minutes} minutes and {timer.seconds}
            </span>
          </span>
        </button>
        <button
          type='button'
          onClick={resetTimer}
          className={mergeClassNames("py-3 px-1 font-semibold text-white")}
          hidden={timerState === "init" || timerState === "idle"}
        >
          {timerState === "running" ? "End" : timerState === "paused" ? "Reset" : ""}{" "}
          <span className='sr-only'>timer</span>
        </button>
      </div>
    </div>
  );
}
