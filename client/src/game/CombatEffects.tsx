import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { planetClient } from '../network/planetClient';

const POOL_SIZE = 24;
const _start = new THREE.Vector3();
const _end = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

/**
 * Pool pre-asignado de VFX 3D (láseres, ondas EMP/reparación y explosiones).
 * Cero asignaciones de objetos y cero re-renders de React en useFrame (Regla 6).
 */
export function CombatEffects() {
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const explosionRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const effects = planetClient.effects;

    // Avanza edad y compacta in-place
    let writeIdx = 0;
    for (let i = 0; i < effects.length; i++) {
      const fx = effects[i];
      if (!fx) continue;
      fx.age += safeDelta;
      if (fx.age < fx.duration) {
        effects[writeIdx++] = fx;
      }
    }
    effects.length = writeIdx;

    let beamIdx = 0;
    let ringIdx = 0;
    let expIdx = 0;

    for (let i = 0; i < effects.length; i++) {
      const fx = effects[i];
      if (!fx) continue;
      const progress = fx.age / fx.duration;

      if (fx.kind === 'beam' && beamIdx < POOL_SIZE) {
        const mesh = beamRefs.current[beamIdx++];
        if (!mesh) continue;

        _start.set(fx.fromX, fx.fromY, fx.fromZ);
        _end.set(fx.toX, fx.toY, fx.toZ);
        const length = _start.distanceTo(_end);
        if (length < 0.1) continue;

        _mid.copy(_start).add(_end).multiplyScalar(0.5);
        _dir.copy(_end).sub(_start).normalize();
        _quat.setFromUnitVectors(_up, _dir);

        mesh.visible = true;
        mesh.position.copy(_mid);
        mesh.quaternion.copy(_quat);
        const thickness = (1 - progress * 0.5) * 0.24 * fx.maxRadius;
        mesh.scale.set(thickness, length, thickness);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(fx.color);
        mat.opacity = 1 - progress;
      } else if (fx.kind === 'ring' && ringIdx < POOL_SIZE) {
        const mesh = ringRefs.current[ringIdx++];
        if (!mesh) continue;

        mesh.visible = true;
        mesh.position.set(fx.fromX, fx.fromY - 0.5, fx.fromZ);
        const radius = 1 + fx.maxRadius * progress;
        mesh.scale.set(radius, radius, 1);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(fx.color);
        mat.opacity = (1 - progress) * 0.85;
      } else if (fx.kind === 'explosion' && expIdx < POOL_SIZE) {
        const mesh = explosionRefs.current[expIdx++];
        if (!mesh) continue;

        mesh.visible = true;
        mesh.position.set(fx.fromX, fx.fromY, fx.fromZ);
        const radius = 0.8 + fx.maxRadius * Math.sin(progress * Math.PI * 0.7);
        mesh.scale.set(radius, radius, radius);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(fx.color);
        mat.opacity = (1 - progress) * 0.9;
      }
    }

    for (let i = beamIdx; i < POOL_SIZE; i++) {
      const m = beamRefs.current[i];
      if (m) m.visible = false;
    }
    for (let i = ringIdx; i < POOL_SIZE; i++) {
      const m = ringRefs.current[i];
      if (m) m.visible = false;
    }
    for (let i = expIdx; i < POOL_SIZE; i++) {
      const m = explosionRefs.current[i];
      if (m) m.visible = false;
    }
  });

  const poolIndices = Array.from({ length: POOL_SIZE }, (_, i) => i);

  return (
    <group>
      {poolIndices.map((i) => (
        <mesh
          key={`beam-${i}`}
          ref={(el) => {
            beamRefs.current[i] = el;
          }}
          visible={false}
        >
          <cylinderGeometry args={[1, 1, 1, 6]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.95} />
        </mesh>
      ))}

      {poolIndices.map((i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          visible={false}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.85, 1, 32]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {poolIndices.map((i) => (
        <mesh
          key={`exp-${i}`}
          ref={(el) => {
            explosionRefs.current[i] = el;
          }}
          visible={false}
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
