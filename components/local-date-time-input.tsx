"use client";

import { useEffect, useRef } from "react";

function toLocalInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function offsetFor(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTimezoneOffset();
}

export function LocalDateTimeInput({ initialIso }: { initialIso?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const offsetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initial = initialIso ? new Date(initialIso) : new Date();
    const localValue = toLocalInputValue(initial);
    if (inputRef.current) inputRef.current.value = localValue;
    if (offsetRef.current)
      offsetRef.current.value = String(offsetFor(localValue));
  }, [initialIso]);

  return (
    <>
      <input
        type="datetime-local"
        name="caughtAt"
        ref={inputRef}
        defaultValue=""
        onChange={(event) => {
          if (offsetRef.current)
            offsetRef.current.value = String(offsetFor(event.target.value));
        }}
        required
      />
      <input
        type="hidden"
        name="caughtAtTimezoneOffset"
        ref={offsetRef}
        defaultValue="0"
      />
    </>
  );
}
