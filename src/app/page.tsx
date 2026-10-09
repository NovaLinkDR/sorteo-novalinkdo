import Link from "next/link";
import RifaCard from "@/components/RifaCard";
import { listRifas, getRifaStats, listWinners } from "@/lib/data";

export const dynamic = "force-dynamic";

const pasos = [
  {
    n: "01",
    t: "Elige tu rifa",
    d: "Entra al catálogo y presiona «Participar» en la rifa que quieras.",
  },
  {
    n: "02",
    t: "Selecciona tus boletos",
    d: "Elige cuántos boletos quieres (mínimo 10, máximo 10,000).",
  },
  {
    n: "03",
    t: "Completa tus datos",
    d: "Nombre, teléfono/WhatsApp y correo para identificarte.",
  },
  {
    n: "04",
    t: "Transfiere y sube el comprobante",
    d: "Haz tu transferencia y adjunta el comprobante en el formulario.",
  },
  {
    n: "05",
    t: "Recibe tus boletos",
    d: "Tus boletos quedan activos una vez confirmada la transferencia.",
  },
];

export default function Home() {
  const rifas = listRifas(true).map((r) => ({
    rifa: r,
    stats: getRifaStats(r.id),
  }));
  const winners = listWinners().slice(0, 6);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line-soft">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.12),transparent_60%)]" />
        <div className="container-x relative flex flex-col items-center py-24 text-center sm:py-32">
          <div className="animate-fade-up flex items-center gap-2 rounded-full border border-line bg-surface/60 px-4 py-1.5 backdrop-blur">
            <span className="glow-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="mono text-xs text-mute">
              RIFAS EN LÍNEA · SORTEOS EN VIVO
            </span>
          </div>

          <h1 className="animate-fade-up mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Premios extraordinarios,{" "}
            <span className="text-accent">garantizados</span>
          </h1>

          <p className="animate-fade-up mt-5 max-w-xl text-base text-mute sm:text-lg">
            Boletos digitales, sorteos transparentes y verificación al
            instante. Tu próxima consola está a un boleto de distancia.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/rifas" className="btn-primary px-6 py-3 text-base">
              Quiero participar
            </Link>
            <Link href="/#como-jugar" className="btn-ghost px-6 py-3 text-base">
              ¿Cómo jugar?
            </Link>
          </div>

          <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            <Stat value="+18" label="Solo adultos" />
            <Stat value="100%" label="Sorteos en vivo" />
            <Stat value="24/7" label="Verificación" />
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section className="container-x py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">// Catálogo</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Rifas activas
            </h2>
          </div>
          <Link
            href="/rifas"
            className="hidden text-sm text-accent hover:text-accent-bright sm:block"
          >
            Ver todas →
          </Link>
        </div>

        {rifas.length === 0 ? (
          <div className="card p-12 text-center text-mute">
            Pronto publicaremos nuevas rifas. ¡Vuelve en unos días!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rifas.map(({ rifa, stats }) => (
              <RifaCard key={rifa.id} rifa={rifa} stats={stats} />
            ))}
          </div>
        )}
      </section>

      {/* CÓMO JUGAR */}
      <section id="como-jugar" className="border-y border-line-soft bg-surface/30">
        <div className="container-x py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">// Cómo jugar</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              5 pasos para participar y ganar
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {pasos.map((p) => (
              <div key={p.n} className="card relative p-5">
                <span className="mono text-3xl font-bold text-accent/30">
                  {p.n}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-white">{p.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-mute">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFICADOR */}
      <section className="container-x py-20">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">// Verificador</p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                ¿Ya compraste? Verifica tu boleto
              </h2>
              <p className="mt-2 max-w-md text-sm text-mute">
                Consulta el estado de tus boletos por número al instante.
              </p>
            </div>
            <Link href="/verificar" className="btn-primary px-6 py-3">
              Verificar boleto
            </Link>
          </div>
        </div>
      </section>

      {/* GANADORES */}
      {winners.length > 0 && (
        <section className="border-t border-line-soft bg-surface/30">
          <div className="container-x py-20">
            <div className="mb-8">
              <p className="eyebrow">// Salón de ganadores</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Ganadores recientes
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((w: any) => (
                <div key={w.id} className="card flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-lg">
                    🏆
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {w.winner_name || "Ganador"}
                    </p>
                    <p className="truncate text-xs text-mute">
                      {w.prize_label} ·{" "}
                      <span className="mono text-accent">
                        {w.ticket_number}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-lg font-bold text-accent">{value}</span>
      <span className="text-xs text-faint">{label}</span>
    </div>
  );
}
