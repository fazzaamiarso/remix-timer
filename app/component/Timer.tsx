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

export default function Timer({ initialTime }: { initialTime: number }) {
  const [chosenTime, setChosenTime] = useState(initialTime);
  const [time, setTime] = useState({ minutes: chosenTime, seconds: 0 });
  const [start, setStart] = useState(false);

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
  );
}
