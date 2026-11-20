import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 2200;

/**
 * Campo estelar ligero en Three.js puro (cero dependencia de @react-three/drei).
 */
export function Starfield() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    // Semilla determinista simple (LCG) para distribución uniforme en el cielo
    let seed = 421337;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = nextRand() * Math.PI * 2;
      const phi = Math.acos(0.15 + nextRand() * 0.85); // Hemisferio superior sobre el planeta
      const radius = 260 + nextRand() * 140;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#cbd5e1" size={1.6} sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}
