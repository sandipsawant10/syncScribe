import { useCallback, useRef } from "react";

export const useDebounce = (fn, delay = 1000) => {
  const timer = useRef(null);

  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
};
