"use client";

import { useActionState, useState } from "react";
import {
  accionAlternarActivo,
  accionCambiarPassword,
  accionEditarUsuario,
  accionEliminarUsuario,
  accionGuardarHorarios,
} from "./acciones";
import { Aviso, Boton, Campo, Chip, estiloBoton } from "@/components/ui";
import type { Horario, Servicio, Usuario } from "@/lib/types";

const PALETA = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];

// Lunes primero, como se lee una agenda; el valor sigue siendo 0 = domingo.
const DIAS: Array<{ valor: number; nombre: string }> = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" },
];

export default function FichaUsuario({
  usuario,
  servicios,
  serviciosAsignados,
  horarios,
  turnosProximos,
  esUltimoDueno,
}: {
  usuario: Usuario;
  servicios: Servicio[];
  serviciosAsignados: string[];
  horarios: Horario[];
  turnosProximos: number;
  esUltimoDueno: boolean;
}) {
  const [editar, accionEditar, editando] = useActionState(accionEditarUsuario, null);
  const [clave, accionClave, cambiandoClave] = useActionState(accionCambiarPassword, null);
  const [agenda, accionAgenda, guardandoAgenda] = useActionState(accionGuardarHorarios, null);
  const [abierto, setAbierto] = useState(false);

  const porDia = new Map(horarios.map((h) => [h.diaSemana, h]));
  const diasWork = horarios.length;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 size-8 shrink-0 rounded-lg"
            style={{ background: usuario.color }}
          />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-tinta-1">
              {usuario.nombre}
              {usuario.rol === "dueno" ? (
                <Chip tono="acento">dueño</Chip>
              ) : (
                <Chip tono="neutro">profesional</Chip>
              )}
              {!usuario.activo && <Chip tono="grave">desactivado</Chip>}
            </p>
            {usuario.ocupacion && (
              <p className="truncate text-xs font-medium text-tinta-2">{usuario.ocupacion}</p>
            )}
            <p className="tabular truncate text-xs text-tinta-3">
              {usuario.email}
              {usuario.telefono ? ` · ${usuario.telefono}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-tinta-3">
              {turnosProximos > 0
                ? `${turnosProximos} ${turnosProximos === 1 ? "turno" : "turnos"} de acá en adelante`
                : "Sin turnos próximos"}
              {usuario.rol === "profesional" &&
                ` · ${diasWork === 0 ? "sin horarios cargados" : `${diasWork} ${diasWork === 1 ? "día" : "días"} por semana`}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className={estiloBoton("secundario")}
            aria-expanded={abierto}
          >
            {abierto ? "Cerrar" : "Editar"}
          </button>

          <form action={accionAlternarActivo}>
            <input type="hidden" name="usuarioId" value={usuario.id} />
            <Boton
              variante="fantasma"
              disabled={esUltimoDueno && usuario.activo}
              title={
                esUltimoDueno && usuario.activo
                  ? "No podés desactivar al único dueño activo."
                  : usuario.activo
                    ? "Le saca el acceso al panel, pero conserva sus turnos."
                    : "Le devuelve el acceso al panel."
              }
            >
              {usuario.activo ? "Desactivar" : "Activar"}
            </Boton>
          </form>
        </div>
      </div>

      {abierto && (
        <div className="mt-3 grid gap-4 border-t border-borde pt-3 lg:grid-cols-2">
          <form action={accionEditar} className="space-y-3">
            <input type="hidden" name="usuarioId" value={usuario.id} />
            {editar?.error && <Aviso>{editar.error}</Aviso>}
            {editar?.ok && <Aviso tono="ok">{editar.ok}</Aviso>}

            <Campo etiqueta="Nombre">
              <input name="nombre" defaultValue={usuario.nombre} required />
            </Campo>
            <Campo etiqueta="Ocupación" ayuda="Peluquera, colorista, manicura…">
              <input name="ocupacion" defaultValue={usuario.ocupacion ?? ""} maxLength={60} />
            </Campo>
            <Campo etiqueta="Email">
              <input name="email" type="email" defaultValue={usuario.email} required />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input name="telefono" defaultValue={usuario.telefono ?? ""} />
            </Campo>

            <Campo etiqueta="Color en el calendario">
              <div className="flex flex-wrap gap-2 pt-1">
                {PALETA.map((c) => (
                  <label
                    key={c}
                    className="cursor-pointer"
                    title={c}
                    style={{ marginBottom: 0 }}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={c}
                      defaultChecked={usuario.color.toLowerCase() === c}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className="block size-7 rounded-lg border-2 border-transparent peer-checked:border-tinta-1"
                      style={{ background: c }}
                    />
                  </label>
                ))}
              </div>
            </Campo>

            {usuario.rol === "profesional" && (
              <Campo
                etiqueta="Servicios que atiende"
                ayuda="El bot solo le ofrece estos servicios a los clientes."
              >
                <div className="space-y-1.5 pt-1">
                  {servicios.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 text-sm font-normal normal-case tracking-normal text-tinta-2"
                      style={{ marginBottom: 0 }}
                    >
                      <input
                        type="checkbox"
                        name="servicios"
                        value={s.id}
                        defaultChecked={serviciosAsignados.includes(s.id)}
                        className="size-4"
                      />
                      {s.nombre}
                    </label>
                  ))}
                </div>
              </Campo>
            )}

            <button type="submit" disabled={editando} className={estiloBoton()}>
              {editando ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>

          <div className="space-y-4">
            {usuario.rol === "profesional" && (
              <form action={accionAgenda} className="space-y-3">
                <input type="hidden" name="usuarioId" value={usuario.id} />
                {agenda?.error && <Aviso>{agenda.error}</Aviso>}
                {agenda?.ok && <Aviso tono="ok">{agenda.ok}</Aviso>}

                <Campo
                  etiqueta="Días y horarios de trabajo"
                  ayuda="El bot solo ofrece turnos dentro de estas franjas."
                >
                  <div className="space-y-1.5 pt-1">
                    {DIAS.map(({ valor, nombre }) => {
                      const h = porDia.get(valor);
                      return (
                        <div key={valor} className="flex flex-wrap items-center gap-2">
                          <label
                            className="flex w-28 cursor-pointer items-center gap-2 text-sm font-normal normal-case tracking-normal text-tinta-2"
                            style={{ marginBottom: 0 }}
                          >
                            <input
                              type="checkbox"
                              name={`activo_${valor}`}
                              defaultChecked={Boolean(h)}
                              className="size-4"
                            />
                            {nombre}
                          </label>
                          <input
                            type="time"
                            name={`desde_${valor}`}
                            defaultValue={h?.desde ?? "09:00"}
                            className="w-28"
                            aria-label={`${nombre}: desde`}
                          />
                          <span className="text-xs text-tinta-3">a</span>
                          <input
                            type="time"
                            name={`hasta_${valor}`}
                            defaultValue={h?.hasta ?? "18:00"}
                            className="w-28"
                            aria-label={`${nombre}: hasta`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Campo>

                <button type="submit" disabled={guardandoAgenda} className={estiloBoton()}>
                  {guardandoAgenda ? "Guardando…" : "Guardar horarios"}
                </button>
              </form>
            )}

            <form action={accionClave} className="space-y-3">
              <input type="hidden" name="usuarioId" value={usuario.id} />
              {clave?.error && <Aviso>{clave.error}</Aviso>}
              {clave?.ok && <Aviso tono="ok">{clave.ok}</Aviso>}
              <Campo
                etiqueta="Nueva contraseña"
                ayuda="Se la pasás vos. No guardamos la anterior en ningún lado."
              >
                <input name="password" type="text" minLength={8} placeholder="Mínimo 8 caracteres" />
              </Campo>
              <button type="submit" disabled={cambiandoClave} className={estiloBoton("secundario")}>
                {cambiandoClave ? "Cambiando…" : "Cambiar contraseña"}
              </button>
            </form>

            {usuario.rol === "profesional" && (
              <form action={accionEliminarUsuario} className="border-t border-borde pt-3">
                <input type="hidden" name="usuarioId" value={usuario.id} />
                <Boton
                  variante="peligro"
                  title={
                    turnosProximos > 0
                      ? "Tiene turnos cargados: queda desactivado para no perder el historial."
                      : "No tiene turnos: se borra del todo."
                  }
                >
                  Eliminar usuario
                </Boton>
                <p className="mt-1.5 text-[0.7rem] leading-relaxed text-tinta-3">
                  Si tiene turnos cargados no se borra: queda desactivado, así no se pierde el
                  historial de cobros.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
