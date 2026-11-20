import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS, getTerrainHeight, type PlanetId } from '@starcorsair/shared';

interface PlanetSurfaceProps {
  planetId: PlanetId;
}

const SEGMENTS = 96;

export function PlanetSurface({ planetId }: PlanetSurfaceProps) {
  const geometry = useMemo(() => {
    const size = PLANETS[planetId].halfSize * 2;
    const plane = new THREE.PlaneGeometry(size, size, SEGMENTS, SEGMENTS);
    plane.rotateX(-Math.PI / 2);

    const pos = plane.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = getTerrainHeight(planetId, x, z);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    plane.computeVertexNormals();
    return plane;
  }, [planetId]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#3b4d5e" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}
