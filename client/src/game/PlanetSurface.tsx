import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ENERGY_CONSTANTS,
  PLANETS,
  getTerrainHeight,
  type PlanetId
} from '@starcorsair/shared';

interface PlanetSurfaceProps {
  planetId: PlanetId;
}

const SEGMENTS = 110;
const ROCK_COUNT = 75;

export function PlanetSurface({ planetId }: PlanetSurfaceProps) {
  const rocksRef = useRef<THREE.InstancedMesh>(null);
  const planet = PLANETS[planetId];

  const geometry = useMemo(() => {
    const size = planet.halfSize * 2;
    const plane = new THREE.PlaneGeometry(size, size, SEGMENTS, SEGMENTS);
    plane.rotateX(-Math.PI / 2);

    const pos = plane.attributes.position;
    if (pos) {
      const colors = new Float32Array(pos.count * 3);
      const lowColor = new THREE.Color(planet.visual.lowColor);
      const midColor = new THREE.Color(planet.visual.midColor);
      const highColor = new THREE.Color(planet.visual.highColor);
      const padColor = new THREE.Color(planet.visual.padColor);
      const tmp = new THREE.Color();

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = getTerrainHeight(planetId, x, z);
        pos.setY(i, y);

        const distOrigin = Math.hypot(x, z);
        if (distOrigin < ENERGY_CONSTANTS.SAFE_ZONE_RADIUS) {
          tmp.copy(padColor);
        } else {
          const t = Math.max(0, Math.min(1, (y + 8) / 18));
          if (t < 0.5) {
            tmp.copy(lowColor).lerp(midColor, t * 2);
          } else {
            tmp.copy(midColor).lerp(highColor, (t - 0.5) * 2);
          }
        }
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }

      pos.needsUpdate = true;
      plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    plane.computeVertexNormals();
    return plane;
  }, [planetId, planet]);

  useEffect(() => {
    const mesh = rocksRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    const half = planet.halfSize - 18;
    let seed = planetId === 'vega_aurora' ? 771123 : 987651;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    let placed = 0;
    while (placed < ROCK_COUNT) {
      const x = (rand() * 2 - 1) * half;
      const z = (rand() * 2 - 1) * half;
      if (Math.hypot(x, z) < ENERGY_CONSTANTS.SAFE_ZONE_RADIUS + 14) continue;

      const y = getTerrainHeight(planetId, x, z);
      const scaleXZ = 1.6 + rand() * 3.4;
      const scaleY = 2.5 + rand() * 6.5;

      dummy.position.set(x, y + scaleY * 0.35, z);
      dummy.rotation.set(rand() * 0.25, rand() * Math.PI * 2, rand() * 0.25);
      dummy.scale.set(scaleXZ, scaleY, scaleXZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [planetId, planet.halfSize]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.08} />
      </mesh>

      <instancedMesh
        ref={rocksRef}
        args={[undefined, undefined, ROCK_COUNT]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={planet.visual.rockColor}
          roughness={0.85}
          metalness={0.2}
        />
      </instancedMesh>

      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[11, 14, 48]} />
        <meshStandardMaterial
          color={planet.visual.accentColor}
          emissive={planet.visual.accentColor}
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            ENERGY_CONSTANTS.SAFE_ZONE_RADIUS - 0.5,
            ENERGY_CONSTANTS.SAFE_ZONE_RADIUS,
            64
          ]}
        />
        <meshStandardMaterial
          color={planet.visual.accentColor}
          emissive={planet.visual.accentColor}
          emissiveIntensity={0.45}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}
