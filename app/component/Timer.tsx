import { useRef, useEffect, ChangeEvent } from "react";

function useInterval(callback: () => void, delay: null | number) {
  const savedCallback = useRef<typeof callback>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
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

type setStateType<Type> = React.Dispatch<React.SetStateAction<Type>>;
type TimerProps = {
  isOngoingSession: boolean;
  timer: { minutes: number; seconds: number };
  initialTime: number;
  setIsOngoingSession: setStateType<boolean>;
  setTimer: setStateType<{
    minutes: number;
    seconds: number;
  }>;
  setTimeLapsed: setStateType<number>;
};

export default function Timer({
  isOngoingSession,
  timer,
  initialTime,
  setTimer,
  setIsOngoingSession,
  setTimeLapsed
}: TimerProps) {
  useInterval(
    () => {
      if (timer.seconds === 0 && timer.minutes === 0) return clearTimer();
      if (timer.seconds === 0)
        return setTimer((prev) => ({ minutes: prev.minutes - 1, seconds: 59 }));
      else
        setTimer((prev) => ({
          minutes: prev.minutes,
          seconds: prev.seconds - 1
        }));
    },
    isOngoingSession ? 1000 : null
  );

  const changeTime = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target || isOngoingSession) return;

    if (Number(e.target.value) > 60) return;
    setTimer({ minutes: Number(e.target.value), seconds: 0 });
  };

  const startTimer = () => {
    if (isOngoingSession) return;
    setIsOngoingSession(true);
    setTimeLapsed(Date.now());
  };
  const pauseTimer = () => {
    if (!isOngoingSession) return;
    setIsOngoingSession(false);
    setTimeLapsed((prevTime) => Date.now() - prevTime);
  };
  const clearTimer = () => {
    setIsOngoingSession(false);
    setTimer({ minutes: initialTime, seconds: 0 });
    setTimeLapsed((prevTime) => Date.now() - prevTime);
  };

  return (
    <div className='mx-auto space-y-4'>
      <div className='text-xl'>{`${String(timer.minutes).padStart(2, "0")}:${String(
        timer.seconds
      ).padStart(2, "0")}`}</div>
      <input
        type='text'
        value={initialTime}
        onChange={changeTime}
        pattern='[0-9]{2}'
        maxLength={2}
      />
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
