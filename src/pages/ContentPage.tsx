import ContentShowcase from "../components/sections/ContentShowcase";
import Closing from "../components/sections/Closing";
import { useSeo } from "../lib/seo";

export default function ContentPage() {
  useSeo({
    path: "/contenido",
    title: "Contenido — Entrevistas, shows en vivo y fotos | RINDE",
    description: "Entrevistas con artistas, videos de shows en vivo y fotografía de músicos en escena, producidos por RINDE.",
  });
  return (
    <>
      <ContentShowcase asPage />
      <Closing title="¿Querés contenido así" accent="para tu artista?" cta={{ label: "Hablemos de tu artista", to: "/contacto?tipo=artista" }} />
    </>
  );
}
