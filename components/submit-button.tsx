"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const form = buttonRef.current?.form;
    if (!form) return;
    const sync = () =>
      setProcessing(Number(form.dataset.imageProcessing ?? 0) > 0);
    const preventEarlySubmit = (event: SubmitEvent) => {
      if (Number(form.dataset.imageProcessing ?? 0) > 0) {
        event.preventDefault();
        sync();
      }
    };
    sync();
    form.addEventListener("pescamigos:image-processing", sync);
    form.addEventListener("submit", preventEarlySubmit);
    return () => {
      form.removeEventListener("pescamigos:image-processing", sync);
      form.removeEventListener("submit", preventEarlySubmit);
    };
  }, []);

  return (
    <button ref={buttonRef} className="button" disabled={pending || processing}>
      {processing ? "Preparando fotos…" : pending ? "Guardando…" : children}
    </button>
  );
}
