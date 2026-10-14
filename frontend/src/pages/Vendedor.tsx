import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function VendedorPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<any>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const d = await api("/api/vendedor/stats");
      setData(d);
    } catch {
      setAuthed(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/api/vendedor/me");
        if (me?.authenticated) {
          setAuthed(true);
          loadStats();
        } else {
          setAuthed(false);
        }
      } catch {
        setAuthed(false);
      }
    })();
  }, [loadStats]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/vendedor/login", {
        method: "POST",
        body: JSON.stringify({ code, password }),
      });
      setAuthed(true);
      loadStats();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api("/api/vendedor/logout", { method: "POST" });
    } catch {}
    setAuthed(false);
    setData(null);
    setPassword("");
  }

  const referralUrl = data?.vendor?.code
    ? `${window.location.origin}/rifa/rifa-10-playstation-5?ref=${data.vendor.code}`
    : data?.referralUrl || "";

  async function copy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const pesoT = (n: number) => `RD$ ${(n || 0).toLocaleString("es-DO")}`;

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-mute">
        Cargando…
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2">
            <span className="glow-dot inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="mono text-sm font-semibold text-white">
              sorteo<span className="text-accent">.novalink</span>
            </span>
            <span className="mono ml-2 rounded border border-line bg-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-faint">
              vendedor
            </span>
          </div>

          <div className="card p-6">
            <h1 className="text-lg font-bold text-white">Acceso vendedor</h1>
            <p className="mt-1 text-sm text-mute">
              Ingresa tu código y contraseña para ver tus ventas.
            </p>

            <form onSubmit={login} className="mt-6 space-y-4">
              <div>
                <label className="label">Código</label>
                <input
                  className="input mono uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="TU-CODIGO"
                />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? "Verificando…" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const s = data?.stats || {};
  const g1 = s.goal1 || { tickets: 2000, pesos: 20000, reached: false };
  const g2 = s.goal2 || { tickets: 3000, pesos: 30000, reached: false };
  const pct = Math.min(100, Math.round(((s.confirmedTickets || 0) / g2.tickets) * 100));

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line-soft bg-surface/40">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="glow-dot h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="mono text-sm font-semibold text-white">
              sorteo<span className="text-accent">.novalink</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-mute sm:block">{data?.vendor?.name}</span>
            <button onClick={logout} className="text-sm text-mute hover:text-white">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="container-x py-10">
        <div className="mb-8">
          <p className="eyebrow">// Panel de vendedor</p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Hola, {data?.vendor?.name} 👋
          </h1>
          <p className="mt-1 text-sm text-mute">
            Tu código: <span className="mono text-accent">{data?.vendor?.code}</span>
          </p>
        </div>

        {/* Link de referido */}
        <div className="card mb-6 p-5">
          <p className="label">Tu link de referido</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              className="input mono flex-1 text-sm"
              value={referralUrl}
            />
            <button onClick={copy} className="btn-primary px-4 py-2.5 text-sm">
              {copied ? "✓ Copiado" : "Copiar link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-faint">
            Comparte este link: las compras que se hagan desde él contarán para tu meta.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs text-faint">Boletos confirmados</p>
            <p className="mono mt-2 text-2xl font-bold text-white">
              {(s.confirmedTickets || 0).toLocaleString("es-DO")}
            </p>
            <p className="mt-1 text-xs text-mute">
              {s.pendingTickets || 0} pendientes de confirmar
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-faint">Comisión acumulada</p>
            <p className="mono mt-2 text-2xl font-bold text-accent">
              {pesoT(s.commissionPesos)}
            </p>
            <p className="mt-1 text-xs text-mute">pagadero al concluir la rifa</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-faint">Órdenes totales</p>
            <p className="mono mt-2 text-2xl font-bold text-white">
              {(s.totalOrders || 0).toLocaleString("es-DO")}
            </p>
          </div>
        </div>

        {/* Metas */}
        <div className="card mt-6 p-5">
          <p className="mb-3 text-sm font-semibold text-white">Progreso hacia tus metas</p>
          <div className="mb-2 flex justify-between text-xs text-faint">
            <span>
              Meta 1: {g1.tickets} boletos → {pesoT(g1.pesos)}{" "}
              {g1.reached ? "✓ lograda" : ""}
            </span>
            <span>
              Meta 2: {g2.tickets} boletos → {pesoT(g2.pesos)}{" "}
              {g2.reached ? "✓ lograda" : ""}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-faint">
            RD$10,000 por cada 1,000 boletos confirmados.
          </p>
        </div>

        {/* Órdenes recientes */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white">Tus últimas órdenes</p>
          <div className="card divide-y divide-line-soft">
            {!data?.recentOrders?.length ? (
              <p className="p-6 text-center text-mute">
                Aún no tienes ventas. ¡Comparte tu link!
              </p>
            ) : (
              data.recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="mono text-sm text-white">{o.order_code}</p>
                    <p className="text-xs text-mute">{o.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="mono text-sm text-white">{o.ticket_quantity} boletos</p>
                    <p
                      className={`text-xs ${
                        o.status === "confirmado"
                          ? "text-accent"
                          : o.status === "pendiente"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {o.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
