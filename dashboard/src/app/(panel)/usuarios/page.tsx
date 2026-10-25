import { exigirDueno } from "@/lib/auth";
import { db } from "@/lib/db";
import { horariosDeProfesional } from "@/lib/repo/config";
import { listarServicios } from "@/lib/repo/servicios";
import { contarDuenosActivos, listarUsuarios, serviciosDeProfesional } from "@/lib/repo/usuarios";
import Encabezado from "@/components/Encabezado";
import { Kpi, Panel } from "@/components/ui";
import FichaUsuario from "./FichaUsuario";
import FormularioUsuario from "./FormularioUsuario";

export const metadata = { title: "Usuarios · Senko" };

export default async function PaginaUsuarios() {
  await exigirDueno();

  const usuarios = listarUsuarios();
  const servicios = listarServicios(true);
  const duenosActivos = contarDuenosActivos();

  const conteos = db()
    .prepare<[string], { profesional_id: string; n: number }>(
      `SELECT profesional_id, COUNT(*) AS n
         FROM turnos
        WHERE inicio >= ? AND estado IN ('pendiente', 'confirmado')
        GROUP BY profesional_id`,
    )
    .all(new Date().toISOString());
  const turnosPorProfesional = new Map(conteos.map((c) => [c.profesional_id, c.n]));

  const profesionales = usuarios.filter((u) => u.rol === "profesional");
  const activos = profesionales.filter((u) => u.activo);

  return (
    <>
      <Encabezado
        titulo="Usuarios"
        descripcion="Cada profesional entra con su propio email y ve únicamente el calendario con sus turnos. Vos, como dueño, ves todo."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi etiqueta="Profesionales activos" valor={activos.length} detalle="Pueden entrar al panel." />
        <Kpi
          etiqueta="Desactivados"
          valor={profesionales.length - activos.length}
          detalle="Conservan su historial pero no pueden entrar."
        />
        <Kpi
          etiqueta="Dueños"
          valor={duenosActivos}
          detalle="Acceso total: cobros, usuarios y configuración."
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_320px]">
        <Panel
          titulo="Equipo"
          descripcion="Tocá Editar para cambiar datos, color del calendario, servicios que atiende o contraseña."
          sinPadding
        >
          <ul className="divide-y divide-borde">
            {usuarios.map((u) => (
              <FichaUsuario
                key={u.id}
                usuario={u}
                servicios={servicios}
                serviciosAsignados={u.rol === "profesional" ? serviciosDeProfesional(u.id) : []}
                horarios={u.rol === "profesional" ? horariosDeProfesional(u.id) : []}
                turnosProximos={turnosPorProfesional.get(u.id) ?? 0}
                esUltimoDueno={u.rol === "dueno" && duenosActivos <= 1}
              />
            ))}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel titulo="Agregar alguien al equipo">
            <FormularioUsuario />
          </Panel>

          <Panel titulo="Qué ve cada rol">
            <dl className="space-y-3 text-xs leading-relaxed">
              <div>
                <dt className="font-semibold text-tinta-1">Dueño</dt>
                <dd className="text-tinta-2">
                  Todo: resumen, calendario completo de los profesionales, gasto por cliente, señas,
                  pagos, usuarios y configuración de porcentajes.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-tinta-1">Profesional</dt>
                <dd className="text-tinta-2">
                  Solo su calendario, con sus turnos y nada más. Puede ver, comentar y avisarte si
                  un cliente se retrasa o no vino. No cobra, no cambia estados, y no ve la
                  facturación del negocio ni la agenda de sus compañeros.
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
