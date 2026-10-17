import { Header } from "@/components/Header";
import { Preloader } from "@/components/Preloader";
import { HeroExperiencia } from "@/components/HeroExperiencia";
import { Historia } from "@/components/Historia";
import { TransicionFuego } from "@/components/TransicionFuego";
import { Gastronomia } from "@/components/Gastronomia";
import { Carta } from "@/components/Carta";
import { Ocasiones } from "@/components/Ocasiones";
import { SelectorOcasion } from "@/components/SelectorOcasion";
import { Espacios } from "@/components/Espacios";
import { PruebaSocial } from "@/components/PruebaSocial";
import { Galeria } from "@/components/Galeria";
import { FormularioReserva } from "@/components/FormularioReserva";
import { Ubicacion } from "@/components/Ubicacion";
import { Footer } from "@/components/Footer";
import { ContactoFlotante } from "@/components/ContactoFlotante";

/**
 * Recorrido narrativo de la página.
 *
 *   curiosidad  -> portada
 *   descubrimiento -> historia
 *   deseo       -> fuego + gastronomía + carta
 *   identificación -> ocasiones + selector
 *   confianza   -> espacios + notoriedad + galería
 *   acción      -> reservas + ubicación
 *   recuerdo    -> cierre
 */
export default function Pagina() {
  return (
    <>
      <Preloader />
      <Header />

      <main id="contenido">
        <HeroExperiencia />
        <Historia />
        <TransicionFuego />
        <Gastronomia />
        <Carta />
        <Ocasiones />
        <SelectorOcasion />
        <Espacios />
        <PruebaSocial />
        <Galeria />
        <FormularioReserva />
        <Ubicacion />
      </main>

      <Footer />
      <ContactoFlotante />
    </>
  );
}
