import Hero from "../components/sections/Hero";
import AudienceSelector from "../components/sections/AudienceSelector";
import Intro from "../components/sections/Intro";
import ArtistFeature from "../components/sections/ArtistFeature";
import Areas from "../components/sections/Areas";
import Capabilities from "../components/sections/Capabilities";
import Process from "../components/sections/Process";
import ContentShowcase from "../components/sections/ContentShowcase";
import Modalities from "../components/sections/Modalities";
import Closing from "../components/sections/Closing";
import Marquee from "../components/ui/Marquee";
import { useSeo } from "../lib/seo";

export default function Home() {
  useSeo({
    path: "/",
    description:
      "RINDE es una agencia de marketing especializada en entretenimiento. Estrategia, contenido y publicidad para artistas, managers, productoras, venues y marcas.",
  });
  return (
    <>
      <Hero />
      <Marquee />
      <AudienceSelector />
      <Intro />
      <ArtistFeature />
      <Areas />
      <Capabilities />
      <Process />
      <ContentShowcase limit={6} />
      <Modalities />
      <Closing />
    </>
  );
}
