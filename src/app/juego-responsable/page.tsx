import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Juego Responsable — Sorteo NovaLink",
  description:
    "Compromiso con el juego responsable. Participa solo si eres mayor de 18 años.",
};

export default function JuegoResponsablePage() {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <p className="eyebrow">// Juego responsable</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Juego Responsable
          </h1>
        </header>

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <p className="text-lg font-semibold text-white">
            Prohibida la participación de menores de edad.
          </p>
          <p className="mt-2 text-sm text-mute">
            Solo pueden participar personas mayores de 18 años.
          </p>
        </div>

        <Section title="Juega con moderación">
          <p>
            Participar en rifas debe ser una actividad de entretenimiento y no
            una forma de obtener ingresos. Te recomendamos establecer un límite
            de gasto antes de participar y respetarlo.
          </p>
        </Section>

        <Section title="Señales de alerta">
          <ul className="list-disc space-y-2 pl-5">
            <li>Gastar más de lo que puedes permitirte.</li>
            <li>Intentar recuperar pérdidas comprando más boletos.</li>
            <li>Descuidar responsabilidades por participar en sorteos.</li>
            <li>Sentir ansiedad o malestar por no participar.</li>
          </ul>
        </Section>

        <Section title="¿Necesitas ayuda?">
          <p>
            Si consideras que el juego está afectando tu vida o la de alguien
            cercano, busca apoyo profesional. En la República Dominicana puedes
            contactar a la Dirección de Casinos y Juegos de Azar del Ministerio
            de Hacienda para orientación sobre juego responsable.
          </p>
        </Section>

        <Section title="Autoexclusión">
          <p>
            Si deseas dejar de participar en nuestras rifas, escríbenos a{" "}
            <span className="mono text-accent">soporte@novalinkdo.com</span> y
            gestionaremos tu exclusión de la Plataforma.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-mute">
        {children}
      </div>
    </section>
  );
}
