import { useSyncExternalStore } from "react";

/**
 * Estado de la entrada animada. Los titulares que animan al cargar esperan a que termine,
 * así se ven cuando la cortina se levanta y no por debajo.
 */
let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
}

export function useIntroDone() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => done,
    () => true,
  );
}
