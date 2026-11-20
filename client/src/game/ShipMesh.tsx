interface ShipMeshProps {
  color?: string;
  accentColor?: string;
  afterburner?: boolean;
}

/**
 * Nave espacial sci-fi estilizada (interceptor ligero estilo Pirate Galaxy).
 * Apunta hacia +Z para alinearse con yaw = atan2(dirX, dirZ) de /shared/movement.
 */
export function ShipMesh({
  color = '#38bdf8',
  accentColor = '#0ea5e9',
  afterburner = false
}: ShipMeshProps) {
  return (
    <group>
      {/* Fuselaje principal */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[1.05, 4.4, 6]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.28} />
      </mesh>

      {/* Cabina */}
      <mesh position={[0, 0.45, 0.25]}>
        <sphereGeometry args={[0.52, 12, 12]} />
        <meshStandardMaterial
          color="#bae6fd"
          emissive="#38bdf8"
          emissiveIntensity={0.45}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>

      {/* Alas laterales */}
      <mesh position={[0, -0.05, -0.55]} castShadow>
        <boxGeometry args={[4.6, 0.16, 1.35]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Puntas luminosas de ala */}
      <mesh position={[-2.25, -0.05, -0.55]}>
        <boxGeometry args={[0.22, 0.2, 1.5]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh position={[2.25, -0.05, -0.55]}>
        <boxGeometry args={[0.22, 0.2, 1.5]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Propulsor trasero */}
      <mesh position={[0, 0, -2.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[afterburner ? 0.62 : 0.42, afterburner ? 2.1 : 1.1, 8]} />
        <meshStandardMaterial
          color={afterburner ? '#f97316' : '#38bdf8'}
          emissive={afterburner ? '#fb923c' : '#0284c7'}
          emissiveIntensity={afterburner ? 2.2 : 1.3}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
