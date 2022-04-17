import { useRef, useEffect, useState, ChangeEvent } from "react";

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

type TimerProps = {
  initialTime: number;
  setIsOngoingSession: (value: boolean) => void;
  isOngoingSession: boolean;
};

export default function Timer({
  initialTime,
  setIsOngoingSession,
  isOngoingSession
}: TimerProps) {
  const [time, setTime] = useState({ minutes: initialTime, seconds: 0 });

  useEffect(() => {
    setTime({ minutes: initialTime, seconds: 0 });
  }, [initialTime]);

  useInterval(
    () => {
      if (time.seconds === 0 && time.minutes === 0) return clearTimer();
      if (time.seconds === 0)
        return setTime((prev) => ({ minutes: prev.minutes - 1, seconds: 59 }));
      else
        setTime((prev) => ({
          minutes: prev.minutes,
          seconds: prev.seconds - 1
        }));
    },
    isOngoingSession ? 1000 : null
  );
  const changeTime = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target || isOngoingSession) return;

    if (Number(e.target.value) > 60) return;
    setTime({ minutes: Number(e.target.value), seconds: 0 });
  };

  const startTimer = () => {
    setIsOngoingSession(true);
  };
  const pauseTimer = () => {
    setIsOngoingSession(false);
  };
  const clearTimer = () => {
    setIsOngoingSession(false);
    setTime({ minutes: initialTime, seconds: 0 });
  };

  return (
    <div className='mx-auto space-y-4'>
      <div className='text-xl'>{`${String(time.minutes).padStart(
        2,
        "0"
      )}:${String(time.seconds).padStart(2, "0")}`}</div>
      <input
        type='text'
        value={initialTime}
        onChange={changeTime}
        pattern='[0-9]{2}'
        maxLength={2}
      />
      <div className='flex gap-3 '>
        <button
          type='button'
          onClick={startTimer}
          className='bg-pink-500 py-3 px-1'
        >
          Start
        </button>
        <button
          type='button'
          onClick={pauseTimer}
          className='py-3 px-1 ring-1 ring-pink-500'
        >
          Pause
        </button>
        <button
          type='button'
          onClick={clearTimer}
          className='py-3 px-1 text-pink-500'
        >
          Stop
        </button>
      </div>
    </div>
  );
}
