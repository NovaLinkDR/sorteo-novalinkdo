import RifaCard from "@/components/RifaCard";
import { listRifas, getRifaStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function RifasPage() {
  const rifas = listRifas(true).map((r) => ({
    rifa: r,
    stats: getRifaStats(r.id),
  }));

  return (
    <section className="container-x py-16">
      <div className="mb-8">
        <p className="eyebrow">// Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Todas las rifas</h1>
        <p className="mt-2 text-mute">
          Elige tu rifa, compra boletos y espera el sorteo en vivo.
        </p>
      </div>

      {rifas.length === 0 ? (
        <div className="card p-12 text-center text-mute">
          No hay rifas activas por el momento.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rifas.map(({ rifa, stats }) => (
            <RifaCard key={rifa.id} rifa={rifa} stats={stats} />
          ))}
        </div>
      )}
    </section>
  );
}
