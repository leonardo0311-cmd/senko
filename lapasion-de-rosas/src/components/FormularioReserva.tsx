"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motivosReserva } from "@content/experiencias";
import { reservas, siVerificado, textos } from "@content/site";
import { Revelar } from "./ui/Revelar";
import { Boton } from "./ui/Boton";
import { EncabezadoSeccion } from "./ui/EncabezadoSeccion";
import { enlaceEmail, enlaceWhatsapp, mensajeReserva, type DatosConsulta } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

type Errores = Partial<Record<keyof DatosConsulta, string>>;

const HOY = () => new Date().toISOString().slice(0, 10);

/**
 * Solicitud de reserva.
 *
 * El restaurante trabaja con reserva previa y confirmación manual, así que el
 * formulario NO confirma nada: arma la consulta y la abre en el canal
 * configurado (WhatsApp por defecto). Los datos nunca se envían a un servidor
 * propio ni se guardan en el navegador, y eso se le dice al visitante.
 */
export function FormularioReserva() {
  const t = textos.reservas;
  const id = useId();
  const [datos, setDatos] = useState<DatosConsulta>({
    nombre: "",
    telefono: "",
    email: "",
    fecha: "",
    horario: "",
    personas: "",
    motivo: motivosReserva[0].etiqueta,
    comentarios: "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<"inactivo" | "enviando" | "listo">("inactivo");
  const [sinCanal, setSinCanal] = useState(false);
  const inicioMedido = useRef(false);
  const resumen = useRef<HTMLDivElement>(null);

  /* --- Precarga del motivo desde las tarjetas de ocasión ---------------- */
  useEffect(() => {
    const alElegirMotivo = (e: Event) => {
      const motivoId = (e as CustomEvent<string>).detail;
      const motivo = motivosReserva.find((m) => m.id === motivoId);
      if (!motivo) return;
      setDatos((d) => ({ ...d, motivo: motivo.etiqueta }));
      document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("lpdr:motivo", alElegirMotivo);
    return () => window.removeEventListener("lpdr:motivo", alElegirMotivo);
  }, []);

  /* --- Validación -------------------------------------------------------- */
  const validar = (d: DatosConsulta): Errores => {
    const e: Errores = {};

    if (d.nombre.trim().length < 2) {
      e.nombre = "Escribí tu nombre para que sepamos a quién responder.";
    }

    const digitos = d.telefono.replace(/\D/g, "");
    if (digitos.length < 8) {
      e.telefono = "Necesitamos un teléfono válido para confirmarte la reserva.";
    }

    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      e.email = "Revisá el correo: parece que falta algo.";
    }

    if (d.fecha && d.fecha < HOY()) {
      e.fecha = "Elegí una fecha de hoy en adelante.";
    }

    if (d.personas) {
      const n = Number(d.personas);
      if (!Number.isInteger(n) || n < 1 || n > 60) {
        e.personas = "Indicá cuántas personas son (entre 1 y 60).";
      }
    }

    return e;
  };

  const actualizar = (campo: keyof DatosConsulta, valor: string) => {
    if (!inicioMedido.current) {
      inicioMedido.current = true;
      medir("reserva_inicio_formulario");
    }
    setDatos((d) => ({ ...d, [campo]: valor }));
    // Limpiar el error de ese campo apenas el visitante lo corrige.
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  };

  /* --- Envío ------------------------------------------------------------- */
  const enviar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (estado === "enviando") return;

    const nuevos = validar(datos);
    setErrores(nuevos);

    if (Object.keys(nuevos).length > 0) {
      // Llevar el foco al primer campo con problema.
      const primero = Object.keys(nuevos)[0];
      document.getElementById(`${id}-${primero}`)?.focus();
      return;
    }

    setEstado("enviando");
    const mensaje = mensajeReserva(datos);

    const destino =
      reservas.canal === "plataforma"
        ? siVerificado(reservas.plataformaUrl)
        : reservas.canal === "email"
          ? enlaceEmail(`Reserva — ${datos.motivo}`, mensaje)
          : enlaceWhatsapp(mensaje);

    if (!destino) {
      // Ningún canal confirmado todavía: se lo decimos en lugar de simular.
      setSinCanal(true);
      setEstado("inactivo");
      return;
    }

    medir("reserva_envio", { motivo: datos.motivo });
    window.open(destino, "_blank", "noopener,noreferrer");
    setEstado("listo");
  };

  useEffect(() => {
    if (estado === "listo" || sinCanal) resumen.current?.focus();
  }, [estado, sinCanal]);

  const campo =
    "w-full border border-[var(--borde-sutil)] bg-carbon-alto px-4 py-3.5 font-sans text-[0.95rem] " +
    "text-marfil placeholder:text-marfil/55 transition-colors duration-300 " +
    "hover:border-marfil/25 focus:border-oro focus:outline-none " +
    "aria-[invalid=true]:border-brasa";

  return (
    <section id="reservas" className="seccion relative bg-carbon-bajo" aria-labelledby="reservas-titulo">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(80% 60% at 85% 0%, rgba(80,29,44,0.4) 0%, transparent 60%)",
        }}
      />

      <div className="marco relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <EncabezadoSeccion
              tituloId="reservas-titulo"
              indice={t.indice}
              etiqueta={t.etiqueta}
              titulo={t.titulo}
              enfasis={t.tituloEnfasis}
              bajada={t.bajada}
            />

            <Revelar retraso={240} className="mt-10 border-l border-oro/30 pl-5">
              <p className="text-sm leading-relaxed text-marfil-tenue">
                {reservas.avisoConfirmacion}
              </p>
            </Revelar>
          </div>

          {/* --- Formulario ------------------------------------------------ */}
          <Revelar retraso={120} className="lg:col-span-6 lg:col-start-7">
            <form onSubmit={enviar} noValidate className="space-y-5">
              {/* Trampa anti-spam: invisible para personas, tentadora para bots */}
              <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
                <label htmlFor={`${id}-sitio`}>No completar</label>
                <input id={`${id}-sitio`} name="sitio" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Campo
                  id={`${id}-nombre`}
                  etiqueta="Nombre"
                  requerido
                  error={errores.nombre}
                  className={campo}
                  inputProps={{
                    value: datos.nombre,
                    onChange: (e) => actualizar("nombre", e.target.value),
                    autoComplete: "name",
                    placeholder: "Tu nombre",
                  }}
                />
                <Campo
                  id={`${id}-telefono`}
                  etiqueta="Teléfono"
                  requerido
                  error={errores.telefono}
                  className={campo}
                  inputProps={{
                    value: datos.telefono,
                    onChange: (e) => actualizar("telefono", e.target.value),
                    type: "tel",
                    inputMode: "tel",
                    autoComplete: "tel",
                    placeholder: "11 5555 5555",
                  }}
                />
              </div>

              <Campo
                id={`${id}-email`}
                etiqueta="Correo electrónico"
                opcional
                error={errores.email}
                className={campo}
                inputProps={{
                  value: datos.email,
                  onChange: (e) => actualizar("email", e.target.value),
                  type: "email",
                  inputMode: "email",
                  autoComplete: "email",
                  placeholder: "tunombre@correo.com",
                }}
              />

              <div className="grid gap-5 sm:grid-cols-3">
                <Campo
                  id={`${id}-fecha`}
                  etiqueta="Fecha"
                  opcional
                  error={errores.fecha}
                  className={campo}
                  inputProps={{
                    value: datos.fecha,
                    onChange: (e) => actualizar("fecha", e.target.value),
                    type: "date",
                    min: HOY(),
                  }}
                />
                <Campo
                  id={`${id}-horario`}
                  etiqueta="Horario"
                  opcional
                  className={campo}
                  inputProps={{
                    value: datos.horario,
                    onChange: (e) => actualizar("horario", e.target.value),
                    type: "time",
                  }}
                />
                <Campo
                  id={`${id}-personas`}
                  etiqueta="Personas"
                  opcional
                  error={errores.personas}
                  className={campo}
                  inputProps={{
                    value: datos.personas,
                    onChange: (e) => actualizar("personas", e.target.value),
                    type: "number",
                    inputMode: "numeric",
                    min: 1,
                    max: 60,
                    placeholder: "2",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${id}-motivo`}
                  className="mb-2 block font-sans text-[0.7rem] uppercase tracking-[0.16em] text-marfil/60"
                >
                  Motivo de la visita
                </label>
                <select
                  id={`${id}-motivo`}
                  value={datos.motivo}
                  onChange={(e) => actualizar("motivo", e.target.value)}
                  className={`${campo} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23c4a477' stroke-width='1.4'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
                  }}
                >
                  {motivosReserva.map((m) => (
                    <option key={m.id} value={m.etiqueta} className="bg-carbon-alto">
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${id}-comentarios`}
                  className="mb-2 block font-sans text-[0.7rem] uppercase tracking-[0.16em] text-marfil/60"
                >
                  Comentarios <span className="text-marfil/60">(opcional)</span>
                </label>
                <textarea
                  id={`${id}-comentarios`}
                  value={datos.comentarios}
                  onChange={(e) => actualizar("comentarios", e.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Contanos si hay algo que debamos tener en cuenta."
                  className={`${campo} resize-y`}
                />
              </div>

              <div className="pt-2">
                <Boton type="submit" disabled={estado === "enviando"} className="w-full sm:w-auto">
                  {estado === "enviando" ? "Abriendo…" : "Enviar solicitud"}
                </Boton>
              </div>

              {/* --- Respuesta ------------------------------------------- */}
              <div
                ref={resumen}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className="scroll-mt-32"
              >
                {estado === "listo" && (
                  <p className="border border-oro/35 bg-oro/5 p-4 text-sm leading-relaxed text-marfil">
                    Abrimos tu consulta con todos los datos cargados. Si no se abrió sola,
                    revisá que el navegador no haya bloqueado la ventana.{" "}
                    <span className="text-marfil-tenue">{reservas.avisoConfirmacion}</span>
                  </p>
                )}

                {sinCanal && (
                  <p className="border border-brasa/40 bg-brasa/5 p-4 text-sm leading-relaxed text-marfil">
                    Todavía no está publicado el canal oficial de reservas. Ya tenés tu
                    consulta escrita: copiala y envianosla por Instagram mientras tanto.
                  </p>
                )}
              </div>

              <p className="pt-1 text-xs leading-relaxed text-marfil/60">{reservas.avisoDatos}</p>
            </form>
          </Revelar>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Campo({
  id,
  etiqueta,
  requerido,
  opcional,
  error,
  className,
  inputProps,
}: {
  id: string;
  etiqueta: string;
  requerido?: boolean;
  opcional?: boolean;
  error?: string;
  className: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-sans text-[0.7rem] uppercase tracking-[0.16em] text-marfil/60"
      >
        {etiqueta}
        {requerido && (
          <span className="text-brasa" aria-hidden>
            {" "}
            *
          </span>
        )}
        {opcional && <span className="text-marfil/60"> (opcional)</span>}
      </label>

      <input
        id={id}
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={className}
        {...inputProps}
      />

      {/* El error se explica con texto, no sólo con color */}
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-xs text-brasa">
          <span aria-hidden>↑</span>
          {error}
        </p>
      )}
    </div>
  );
}
