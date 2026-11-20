import { useState, type FormEvent } from 'react';
import {
  loginGuestPilot,
  loginPilot,
  registerPilot,
  saveStoredToken
} from '../network/authApi';
import { useHudStore } from '../store/useHudStore';

type AuthMode = 'login' | 'register';

export function AuthScreen() {
  const connectionError = useHudStore((s) => s.connectionError);
  const [mode, setMode] = useState<AuthMode>('login');
  const [callsign, setCallsign] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(connectionError);
  const [loading, setLoading] = useState(false);

  const handleSuccess = (
    token: string,
    pilot: Parameters<ReturnType<typeof useHudStore.getState>['setAuthSession']>[1],
    persistenceMode: 'postgresql' | 'memory-fallback'
  ) => {
    saveStoredToken(token);
    useHudStore.getState().setAuthSession(token, pilot, persistenceMode);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await registerPilot(callsign, email, password)
          : await loginPilot(email, password);
      handleSuccess(res.token, res.pilot, res.persistenceMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLaunch = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginGuestPilot(callsign || undefined);
      handleSuccess(res.token, res.pilot, res.persistenceMode);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar al servidor de autenticación (:2567).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-7 shadow-2xl shadow-cyan-950/70">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Sistema Vega • MMORPG Espacial
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-100">
            STARCORSAIR
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Combate planetario Server-Authoritative • JWT + Sesión Única
          </p>
        </div>

        {/* Botón de entrada rápida 1 clic */}
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleQuickLaunch()}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50"
        >
          {loading ? 'Conectando...' : '🚀 Despegue Rápido (Piloto Invitado JWT)'}
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          <span>o cuenta de piloto</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-md py-1.5 font-semibold transition ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-md py-1.5 font-semibold transition ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Piloto
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-slate-400">
                Indicativo (Callsign)
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="Ej. CommanderVega"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="piloto@starcorsair.gg"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/70 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-cyan-500/50 bg-cyan-950/60 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-900/70 disabled:opacity-50"
          >
            {mode === 'register' ? 'Registrar y Despegar' : 'Ingresar a Kalabesh'}
          </button>
        </form>
      </div>
    </div>
  );
}
