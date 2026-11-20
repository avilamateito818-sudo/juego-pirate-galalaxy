import { useEffect } from 'react';
import { SceneCanvas } from './game/SceneCanvas';
import { planetClient } from './network/planetClient';
import { useHudStore } from './store/useHudStore';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { HudOverlay } from './ui/HudOverlay';

export function App() {
  const planetId = useHudStore((s) => s.planetId);

  useEffect(() => {
    void planetClient.connect(planetId);
    return () => {
      planetClient.disconnect();
    };
  }, [planetId]);

  return (
    <ErrorBoundary>
      <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
        <SceneCanvas />
        <HudOverlay />
      </main>
    </ErrorBoundary>
  );
}
