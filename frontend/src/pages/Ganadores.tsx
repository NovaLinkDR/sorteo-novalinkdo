import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Winner {
  id: number;
  winner_name?: string | null;
  prize_label: string;
  ticket_number: string;
  rifa_name?: string | null;
}

export default function GanadoresPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api<{ winners: Winner[] }>("/api/admin/winners");
        if (isMounted) {
          setWinners(data.winners || []);
        }
      } catch {
        // Modo público o 401 muestra estado vacío elegante
        if (isMounted) {
          setWinners([]);
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
    <div className="container-x py-16">
      <div className="mb-8 text-center">
        <p className="eyebrow">// Salón de ganadores</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Ganadores</h1>
        <p className="mt-2 text-mute">
          Los afortunados que se llevaron sus premios.
        </p>
      </div>

      {loading ? (
        <div className="card mx-auto max-w-md p-12 text-center text-mute">
          Cargando ganadores…
        </div>
      ) : winners.length === 0 ? (
        <div className="card mx-auto max-w-md p-12 text-center text-mute">
          Aún no hay ganadores anunciados. ¡Vuelve pronto!
        </div>
      ) : (
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {winners.map((w) => (
            <div key={w.id} className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl">
                🏆
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {w.winner_name || "Ganador"}
                </p>
                <p className="truncate text-sm text-mute">{w.prize_label}</p>
                <p className="mono text-xs text-accent">
                  Boleto {w.ticket_number} · {w.rifa_name || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
