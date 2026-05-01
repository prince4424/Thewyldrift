import { useCallback, useMemo, useRef, useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const add = useCallback(
    (title, message = "", variant = "info", timeoutMs = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, title, message, variant, timeoutMs }]);
      const timer = window.setTimeout(() => remove(id), timeoutMs + 150);
      timers.current.set(id, timer);
    },
    [remove]
  );

  return useMemo(() => ({ toasts, addToast: add, removeToast: remove }), [toasts, add, remove]);
}

