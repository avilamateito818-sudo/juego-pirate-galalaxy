import { Canvas } from '@react-three/fiber';
import { useHudStore } from '../store/useHudStore';
import { CombatEffects } from './CombatEffects';
import { EnemyEntities } from './EnemyEntities';
import { LootEntities } from './LootEntities';
import { PlanetSurface } from './PlanetSurface';
import { PlayerController } from './PlayerController';
import { Starfield } from './Starfield';

export function SceneCanvas() {
  const planetId = useHudStore((state) => state.planetId);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 20, 26], fov: 55, near: 0.5, far: 1000 }}
      className="h-full w-full"
    >
      <color attach="background" args={['#040814']} />
      <fog attach="fog" args={['#040814', 140, 390]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[60, 95, 45]} intensity={1.35} castShadow />
      <hemisphereLight args={['#38bdf8', '#1e293b', 0.4]} />
      <Starfield />

      <PlanetSurface planetId={planetId} />
      <PlayerController />
      <EnemyEntities />
      <LootEntities />
      <CombatEffects />
    </Canvas>
  );
}
