"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

export default function TemaToggle() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const guardado = localStorage.getItem("senko-tema");
    if (guardado === "light" || guardado === "dark") {
      setTema(guardado);
      return;
    }
    setTema(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function cambiar() {
    const siguiente: Tema = tema === "dark" ? "light" : "dark";
    setTema(siguiente);
    document.documentElement.setAttribute("data-theme", siguiente);
    try {
      localStorage.setItem("senko-tema", siguiente);
    } catch {
      // modo privado: el tema vale para esta visita nada mas
    }
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      title={tema === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
      aria-label={tema === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
      className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta-1"
    >
      <span aria-hidden>{tema === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
