import CTA from "../components/ui/CTA";
import StageLights from "../components/ui/StageLights";
import { useSeo } from "../lib/seo";

export default function NotFound() {
  useSeo({ path: "/404", title: "Página no encontrada | RINDE" });
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden pt-24">
      <StageLights className="opacity-50" />
      <div className="container-x relative">
        <p className="label text-ash">Error 404</p>
        <h1 className="display mt-6 text-[clamp(3rem,10vw,9rem)]">
          Este escenario <span className="accent text-signal-soft">está vacío.</span>
        </h1>
        <div className="mt-10">
          <CTA to="/">Volver al inicio</CTA>
        </div>
      </div>
    </section>
  );
}
