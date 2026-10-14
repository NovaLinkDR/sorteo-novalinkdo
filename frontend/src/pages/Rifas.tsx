import { useEffect, useState } from "react";
import RifaCard, { Rifa, RifaStats } from "@/components/RifaCard";
import { api } from "@/lib/api";

interface RifaItem extends Rifa {
  stats: RifaStats;
}

export default function RifasPage() {
  const [rifas, setRifas] = useState<RifaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api<{ rifas: RifaItem[] }>("/api/rifas");
        if (isMounted) {
          setRifas(data.rifas || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Error al cargar las rifas");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="container-x py-16">
      <div className="mb-8">
        <p className="eyebrow">// Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Todas las rifas</h1>
        <p className="mt-2 text-mute">
          Elige tu rifa, compra boletos y espera el sorteo en vivo.
        </p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-mute">
          Cargando rifas…
        </div>
      ) : error ? (
        <div className="card p-12 text-center text-red-400">
          {error}
        </div>
      ) : rifas.length === 0 ? (
        <div className="card p-12 text-center text-mute">
          No hay rifas activas por el momento.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rifas.map((r) => (
            <RifaCard key={r.id} rifa={r} stats={r.stats} />
          ))}
        </div>
      )}
    </section>
  );
}
