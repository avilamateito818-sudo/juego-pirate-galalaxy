import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENEMY_ARCHETYPES, type EnemyArchetypeId } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

function lerpAngle(current: number, target: number, alpha: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

function MantisMesh({ archetypeId }: { archetypeId: EnemyArchetypeId }) {
  const spec = ENEMY_ARCHETYPES[archetypeId];
  const isBoss = archetypeId === 'mantis_harvester';

  return (
    <group scale={spec.scale}>
      {/* Cuerpo central hostil */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <octahedronGeometry args={[1.3, 0]} />
        <meshStandardMaterial
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={0.28}
          metalness={0.55}
          roughness={0.32}
        />
      </mesh>

      {/* Tenazas delanteras estilo Mantis */}
      <mesh position={[-1.4, 0, 0.9]} rotation={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.28, 2.4]} />
        <meshStandardMaterial color="#18181b" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[1.4, 0, 0.9]} rotation={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.28, 2.4]} />
        <meshStandardMaterial color="#18181b" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Núcleo luminoso */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[isBoss ? 0.65 : 0.42, 10, 10]} />
        <meshStandardMaterial
          color={isBoss ? '#facc15' : '#fda4af'}
          emissive={isBoss ? '#eab308' : '#f43f5e'}
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

export function EnemyEntities() {
  const enemyVersion = useHudStore((s) => s.enemyVersion);
  const targetId = useHudStore((s) => s.target?.id ?? '');
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const reticleRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const alpha = Math.min(1, safeDelta * 11);

    for (const [id, enemy] of planetClient.enemies.entries()) {
      const group = groupRefs.current.get(id);
      if (!group) continue;

      group.visible = enemy.alive;
      if (!enemy.alive) continue;

      enemy.render.x += (enemy.target.x - enemy.render.x) * alpha;
      enemy.render.y += (enemy.target.y - enemy.render.y) * alpha;
      enemy.render.z += (enemy.target.z - enemy.render.z) * alpha;
      enemy.render.yaw = lerpAngle(enemy.render.yaw, enemy.target.yaw, alpha);

      group.position.set(enemy.render.x, enemy.render.y, enemy.render.z);
      group.rotation.y = enemy.render.yaw;
    }

    // Anillo holográfico sobre el enemigo fijado
    const reticle = reticleRef.current;
    if (reticle) {
      const selected = planetClient.localTargetId
        ? planetClient.enemies.get(planetClient.localTargetId)
        : undefined;
      if (selected && selected.alive) {
        reticle.visible = true;
        reticle.position.set(selected.render.x, selected.render.y - 1.4, selected.render.z);
        reticle.rotation.z += safeDelta * 1.8;
      } else {
        reticle.visible = false;
      }
    }
  });

  // Se re-lee la lista de IDs solo cuando cambia la topología (enemyVersion)
  const enemyEntries = enemyVersion >= 0 ? Array.from(planetClient.enemies.values()) : [];

  return (
    <group>
      {enemyEntries.map((enemy) => (
        <group
          key={enemy.id}
          ref={(el) => {
            if (el) {
              groupRefs.current.set(enemy.id, el);
            } else {
              groupRefs.current.delete(enemy.id);
            }
          }}
          position={[enemy.render.x, enemy.render.y, enemy.render.z]}
          onClick={(e) => {
            e.stopPropagation();
            planetClient.selectTarget(enemy.id);
          }}
        >
          <MantisMesh archetypeId={enemy.archetypeId} />
          {/* Hitbox invisible ligeramente más cómoda para hacer clic */}
          <mesh visible={false}>
            <sphereGeometry args={[3.4, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
        </group>
      ))}

      <mesh
        ref={reticleRef}
        visible={Boolean(targetId)}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[3.2, 3.85, 32]} />
        <meshBasicMaterial
          color="#fb7185"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
