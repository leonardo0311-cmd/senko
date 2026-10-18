import { SaltoContenido } from "@/components/SaltoContenido";
import { SobreLacrado } from "@/components/SobreLacrado";
import { Cursor } from "@/components/ui/Cursor";
import { ActivarRevelado } from "@/components/ui/Revelar";
import { Header } from "@/components/Header";
import { BarraMovil } from "@/components/BarraMovil";
import { Hero } from "@/components/Hero";
import { Marquesina } from "@/components/Marquesina";
import { Nosotros } from "@/components/Nosotros";
import { Fuego } from "@/components/Fuego";
import { Carta } from "@/components/Carta";
import { Especialidades } from "@/components/Especialidades";
import { Galeria } from "@/components/Galeria";
import { Ocasiones } from "@/components/Ocasiones";
import { Prensa } from "@/components/Prensa";
import { Lugar } from "@/components/Lugar";
import { Reservas } from "@/components/Reservas";
import { Instagram } from "@/components/Instagram";
import { Footer } from "@/components/Footer";

export default function Pagina() {
  return (
    <>
      <SobreLacrado />
      <SaltoContenido />
      <Cursor />
      <ActivarRevelado />

      <Header />
      <BarraMovil />

      <main>
        <Hero />
        <Marquesina />
        <Nosotros />
        <Fuego />
        <Carta />
        <Especialidades />
        <Galeria />
        <Ocasiones />
        <Prensa />
        <Lugar />
        <Reservas />
        <Instagram />
      </main>

      <Footer />
    </>
  );
}
