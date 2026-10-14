import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import BuyForm from "@/components/BuyForm";
import { formatCents, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { saveReferralCode, appendRefToUrl } from "@/lib/referral";

interface RifaData {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  prize_name: string | null;
  ticket_price_cents: number;
  min_tickets: number;
  max_tickets_per_order: number;
  total_tickets: number;
  sorteo_date: string | null;
  sorteo_time: string | null;
  sorteo_place: string | null;
  sorteo_note: string | null;
  draw_mechanic: string | null;
  status: string;
  stats: {
    ticketsSold: number;
    progress: number;
  };
}

export default function RifaDetallePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const refParam = searchParams.get("ref");

  const [rifa, setRifa] = useState<RifaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (refParam) {
      saveReferralCode(refParam);
    }
  }, [refParam]);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError("");

    (async () => {
      try {
        const data = await api<{ rifa: RifaData }>(`/api/rifas/${slug}`);
        if (isMounted) {
          if (!data.rifa) {
            setNotFound(true);
          } else {
            setRifa(data.rifa);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          if (err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || "Error al cargar la rifa");
          }
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
  }, [slug]);

  if (loading) {
    return (
      <div className="container-x py-24 text-center text-mute">
        Cargando detalles de la rifa…
      </div>
    );
  }

  if (notFound || !rifa) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Rifa no encontrada</h1>
        <p className="mt-2 text-mute">La rifa que buscas no existe o ya no está disponible.</p>
        <Link to={appendRefToUrl("/rifas")} className="btn-primary mt-6 inline-block">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-x py-24 text-center text-red-400">
        <p>{error}</p>
        <Link to={appendRefToUrl("/rifas")} className="btn-ghost mt-6 inline-block">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const stats = rifa.stats || { ticketsSold: 0, progress: 0 };
  const pct = Math.round(stats.progress * 100);

  return (
    <div className="container-x py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Izquierda: info */}
        <div>
          <Link
            to={appendRefToUrl("/rifas")}
            className="mono text-xs text-faint hover:text-white"
          >
            ← Volver al catálogo
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="chip border-accent/30 bg-accent/10 text-accent">
              ● Activa
            </span>
            <span className="chip">+18</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {rifa.name}
          </h1>
          <p className="mt-3 text-mute">{rifa.tagline}</p>

          {rifa.description && (
            <p className="mt-4 text-sm leading-relaxed text-mute">
              {rifa.description}
            </p>
          )}

          {/* Progreso */}
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-mute">Boletos vendidos</span>
              <span className="mono text-white">
                {stats.ticketsSold.toLocaleString("es-DO")} /{" "}
                {rifa.total_tickets.toLocaleString("es-DO")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-accent">{pct}% vendido</p>
          </div>

          {/* Detalles */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Detail label="Precio del boleto" value={formatCents(rifa.ticket_price_cents)} />
            <Detail label="Compra mínima" value={`${rifa.min_tickets} boletos`} />
            <Detail label="Compra máxima" value={`${rifa.max_tickets_per_order.toLocaleString("es-DO")} boletos`} />
            <Detail label="Sorteo" value={rifa.sorteo_date ? formatDate(rifa.sorteo_date) : rifa.sorteo_note || "Por anunciar"} />
          </div>

          {rifa.sorteo_place && (
            <div className="mt-3">
              <Detail label="Lugar del sorteo" value={rifa.sorteo_place} />
            </div>
          )}

          {/* Mecánica */}
          {rifa.draw_mechanic && (
            <div className="mt-6 rounded-lg border border-line bg-surface p-4">
              <p className="mono text-xs uppercase tracking-widest text-accent">
                // Mecánica del sorteo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                {rifa.draw_mechanic}
              </p>
            </div>
          )}
        </div>

        {/* Derecha: formulario */}
        <div>
          <BuyForm
            referralCode={refParam || undefined}
            rifa={{
              id: rifa.id,
              slug: rifa.slug,
              name: rifa.name,
              prize_name: rifa.prize_name,
              ticket_price_cents: rifa.ticket_price_cents,
              min_tickets: rifa.min_tickets,
              max_tickets_per_order: rifa.max_tickets_per_order,
              sorteo_date: rifa.sorteo_date,
              sorteo_time: rifa.sorteo_time,
              sorteo_place: rifa.sorteo_place,
              draw_mechanic: rifa.draw_mechanic,
              stats: { ticketsSold: stats.ticketsSold, progress: stats.progress },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line-soft bg-surface px-4 py-3">
      <p className="text-xs text-faint">{label}</p>
      <p className="mono mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
