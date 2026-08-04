"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
export function PasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ display: "flex", position: "relative" }}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        style={{ width: "100%", paddingRight: 48 }}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
          position: "absolute",
          right: 5,
          top: 5,
          bottom: 5,
          width: 40,
          border: 0,
          borderRadius: 10,
          background: "transparent",
          color: "#315e4d",
          cursor: "pointer",
        }}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </span>
  );
}
