import { contacto, marca, navegacion, siVerificado, textos } from "@content/site";
import { Logotipo } from "./ui/Logotipo";
import { Separador } from "./ui/MarcaRosa";
import { Revelar } from "./ui/Revelar";
import { EnlaceInstagram } from "./ui/EnlaceInstagram";

export function Footer() {
  const anio = new Date().getFullYear();
  const telefono = siVerificado(contacto.telefono);
  const email = siVerificado(contacto.email);
  const direccion = siVerificado(contacto.direccion);
  const localidad = siVerificado(contacto.localidad);

  return (
    <footer className="relative overflow-hidden border-t border-[var(--borde-tenue)] bg-carbon">
      {/* Textura muy sutil inspirada en pétalos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 50% 120%, rgba(80,29,44,0.5) 0%, transparent 65%)",
        }}
      />

      <div className="marco relative">
        {/* --- Cierre emocional ------------------------------------------- */}
        <Revelar className="py-[clamp(4rem,9vh,7rem)] text-center">
          <Logotipo className="mx-auto h-auto w-[min(15rem,62vw)] text-marfil" />
          <Separador className="mx-auto mt-9 max-w-xs" />
          <p className="mx-auto mt-9 max-w-lg font-serif text-[clamp(1.25rem,1.05rem+0.8vw,1.75rem)] font-light italic leading-snug text-marfil/85">
            {textos.cierre.frase}
          </p>
        </Revelar>

        {/* --- Datos -------------------------------------------------------- */}
        <div className="grid gap-10 border-t border-[var(--borde-tenue)] py-12 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label="Navegación del pie de página">
            <h2 className="tipo-indice mb-5">Explorar</h2>
            <ul className="space-y-2.5">
              <li>
                <a href="#inicio" className="text-sm text-marfil-tenue transition-colors hover:text-oro">
                  Inicio
                </a>
              </li>
              {navegacion.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className="text-sm text-marfil-tenue transition-colors hover:text-oro"
                  >
                    {n.etiqueta}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="tipo-indice mb-5">Dónde</h2>
            <address className="space-y-1.5 text-sm not-italic text-marfil-tenue">
              <p>{direccion ?? localidad}</p>
              {!direccion && <p className="text-marfil/60">Dirección exacta al reservar.</p>}
            </address>
          </div>

          <div>
            <h2 className="tipo-indice mb-5">Contacto</h2>
            <ul className="space-y-2.5 text-sm text-marfil-tenue">
              {telefono && (
                <li>
                  <a href={`tel:${telefono.replace(/\s/g, "")}`} className="transition-colors hover:text-oro">
                    {telefono}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="transition-colors hover:text-oro">
                    {email}
                  </a>
                </li>
              )}
              <li>
                <a href="#reservas" className="transition-colors hover:text-oro">
                  Solicitar una reserva
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="tipo-indice mb-5">Seguinos</h2>
            <EnlaceInstagram origen="footer" className="text-marfil-tenue" />
          </div>
        </div>

        {/* --- Legales ------------------------------------------------------ */}
        <div className="flex flex-col gap-4 border-t border-[var(--borde-tenue)] py-8 text-xs text-marfil/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {anio} {marca.nombre}. {marca.ciudad}, {marca.provincia}.
          </p>
          <p className="max-w-md sm:text-right">
            Los datos que nos dejás se usan únicamente para responder tu consulta.
          </p>
        </div>
      </div>
    </footer>
  );
}
