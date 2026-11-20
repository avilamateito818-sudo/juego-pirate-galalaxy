import { Canvas } from '@react-three/fiber';
import { useHudStore } from '../store/useHudStore';
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
      <fog attach="fog" args={['#040814', 120, 360]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[60, 90, 40]} intensity={1.35} castShadow />
      <hemisphereLight args={['#38bdf8', '#1e293b', 0.35]} />
      <Starfield />

      {/* Plataforma visual de zona de aterrizaje en el origen */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[12, 16, 48]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>

      <PlanetSurface planetId={planetId} />
      <PlayerController />
    </Canvas>
  );
}
