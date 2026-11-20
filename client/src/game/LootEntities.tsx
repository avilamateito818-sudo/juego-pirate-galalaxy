import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

export function LootEntities() {
  const dropVersion = useHudStore((s) => s.dropVersion);
  const containerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const group = containerRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i];
      if (!child) continue;
      child.rotation.y += delta * 2.2;
      child.position.y = child.userData.baseY + Math.sin(t * 3 + i) * 0.35;
    }
  });

  const drops = dropVersion >= 0 ? Array.from(planetClient.drops.values()) : [];

  return (
    <group ref={containerRef}>
      {drops.map((drop) => {
        const color =
          drop.kind === 'cryonite'
            ? '#facc15'
            : drop.kind === 'energy'
              ? '#38bdf8'
              : '#c084fc';

        return (
          <mesh
            key={drop.id}
            position={[drop.x, drop.y, drop.z]}
            userData={{ baseY: drop.y }}
          >
            {drop.kind === 'cryonite' && <octahedronGeometry args={[0.95, 0]} />}
            {drop.kind === 'energy' && <sphereGeometry args={[0.78, 12, 12]} />}
            {drop.kind === 'blueprint' && <boxGeometry args={[1.1, 1.1, 1.1]} />}
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1.15}
              metalness={0.35}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
