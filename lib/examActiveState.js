import { useState, useEffect } from "react";

let _isExamActive = false;
const _listeners = new Set();

/**
 * Set global exam active state (used to hide bottom navigation during exams).
 */
export function setExamActive(active) {
  _isExamActive = !!active;
  _listeners.forEach((listener) => {
    try {
      listener(_isExamActive);
    } catch {}
  });
}

export function getExamActive() {
  return _isExamActive;
}

/**
 * React hook to subscribe to global exam active state.
 */
export function useIsExamActive() {
  const [active, setActive] = useState(_isExamActive);

  useEffect(() => {
    const listener = (val) => setActive(val);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  return active;
}
