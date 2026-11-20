import { useEffect, useState } from 'react';
import { SceneCanvas } from './game/SceneCanvas';
import {
  clearStoredToken,
  fetchCurrentPilot,
  loadStoredToken
} from './network/authApi';
import { planetClient } from './network/planetClient';
import { useHudStore } from './store/useHudStore';
import { AuthScreen } from './ui/AuthScreen';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { HudOverlay } from './ui/HudOverlay';

export function App() {
  const authToken = useHudStore((s) => s.authToken);
  const planetId = useHudStore((s) => s.planetId);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    const stored = loadStoredToken();
    if (!stored) {
      setRestoringSession(false);
      return;
    }

    let cancelled = false;
    void fetchCurrentPilot(stored)
      .then((res) => {
        if (!cancelled) {
          useHudStore
            .getState()
            .setAuthSession(res.token, res.pilot, res.persistenceMode);
        }
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => {
        if (!cancelled) {
          setRestoringSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;
    void planetClient.connect(planetId, authToken);
    return () => {
      planetClient.disconnect();
    };
  }, [authToken, planetId]);

  return (
    <ErrorBoundary>
      <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
        <SceneCanvas />
        {restoringSession ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 text-sm text-cyan-300">
            Verificando credenciales de piloto...
          </div>
        ) : authToken ? (
          <HudOverlay />
        ) : (
          <AuthScreen />
        )}
      </main>
    </ErrorBoundary>
  );
}
