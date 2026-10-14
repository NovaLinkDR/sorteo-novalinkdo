import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      navigate("/admin", { replace: true });
    } catch {
      setError("Contraseña incorrecta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="glow-dot inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="mono text-sm font-semibold text-white">
            sorteo<span className="text-accent">.novalink</span>
          </span>
          <span className="mono ml-2 rounded border border-line bg-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-faint">
            backoffice
          </span>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-bold text-white">Acceso al backoffice</h1>
          <p className="mt-1 text-sm text-mute">
            Ingresa la contraseña de administrador.
          </p>

          <form onSubmit={onSubmit} className="mt-6">
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
            {error && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-5 w-full py-3"
            >
              {loading ? "Verificando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
