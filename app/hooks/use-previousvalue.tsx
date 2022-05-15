import { useRef, useEffect } from "react";

export function usePreviousValue<Type>(value: Type) {
  const savedValue = useRef(value);

  useEffect(() => {
    savedValue.current = value;
  }, [value]);

  return savedValue.current;
}
