import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SIMULATION_CONSTANTS } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';
import { ShipMesh } from './ShipMesh';

const _cameraTargetPos = new THREE.Vector3();
const _cameraLookAt = new THREE.Vector3();

const INPUT_STEP_SECONDS = 1 / SIMULATION_CONSTANTS.CLIENT_INPUT_SEND_HZ;

function lerpAngle(current: number, target: number, alpha: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

export function PlayerController() {
  const { camera } = useThree();
  const localShipRef = useRef<THREE.Group>(null);
  const remoteGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const inputAccumRef = useRef(0);
  const smoothYawRef = useRef(0);

  const playerCount = useHudStore((s) => s.playerCount);
  const afterburnerActive = useHudStore((s) => s.afterburnerActive);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.add(code);
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        useHudStore.getState().setAfterburnerActive(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.delete(code);
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        useHudStore.getState().setAfterburnerActive(false);
      }
    };
    const onBlur = () => {
      keysRef.current.clear();
      useHudStore.getState().setAfterburnerActive(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    inputAccumRef.current += safeDelta;

    // 1. Muestreo y envío throttled de inputs a 20 Hz (ARCHITECTURE.md Regla 11)
    while (inputAccumRef.current >= INPUT_STEP_SECONDS) {
      inputAccumRef.current -= INPUT_STEP_SECONDS;
      const keys = keysRef.current;

      let moveX = 0;
      let moveZ = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveZ -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveZ += 1;

      const afterburner = keys.has('ShiftLeft') || keys.has('ShiftRight');

      if (moveX !== 0 || moveZ !== 0) {
        planetClient.sendMovementStep(moveX, moveZ, afterburner);
      }
    }

    // 2. Actualizar malla local sin re-renders de React (Regla 6)
    const local = planetClient.localTransform;
    const shipObj = localShipRef.current;
    if (shipObj) {
      shipObj.position.x += (local.x - shipObj.position.x) * Math.min(1, safeDelta * 14);
      shipObj.position.y += (local.y - shipObj.position.y) * Math.min(1, safeDelta * 14);
      shipObj.position.z += (local.z - shipObj.position.z) * Math.min(1, safeDelta * 14);

      smoothYawRef.current = lerpAngle(
        smoothYawRef.current,
        local.yaw,
        Math.min(1, safeDelta * 12)
      );
      shipObj.rotation.y = smoothYawRef.current;

      // 3. Cámara en tercera persona estilo Pirate Galaxy (GC-free)
      _cameraTargetPos.set(
        shipObj.position.x,
        shipObj.position.y + 15,
        shipObj.position.z + 24
      );
      camera.position.lerp(_cameraTargetPos, Math.min(1, safeDelta * 6));
      _cameraLookAt.set(shipObj.position.x, shipObj.position.y + 1.5, shipObj.position.z);
      camera.lookAt(_cameraLookAt);
    }

    // 4. Interpolación suave de otros pilotos conectados
    const interpAlpha = Math.min(1, safeDelta * 12);
    for (const [id, remote] of planetClient.remoteShips.entries()) {
      remote.render.x += (remote.target.x - remote.render.x) * interpAlpha;
      remote.render.y += (remote.target.y - remote.render.y) * interpAlpha;
      remote.render.z += (remote.target.z - remote.render.z) * interpAlpha;
      remote.render.yaw = lerpAngle(remote.render.yaw, remote.target.yaw, interpAlpha);

      const group = remoteGroupsRef.current.get(id);
      if (group) {
        group.position.set(remote.render.x, remote.render.y, remote.render.z);
        group.rotation.y = remote.render.yaw;
      }
    }
  });

  // Lista de IDs remotos actualizados solo cuando cambia playerCount
  const remoteIds = playerCount > 1 ? Array.from(planetClient.remoteShips.keys()) : [];

  return (
    <group>
      <group
        ref={localShipRef}
        position={[
          planetClient.localTransform.x,
          planetClient.localTransform.y,
          planetClient.localTransform.z
        ]}
      >
        <ShipMesh color="#38bdf8" accentColor="#22d3ee" afterburner={afterburnerActive} />
      </group>

      {remoteIds.map((id) => (
        <group
          key={id}
          ref={(el) => {
            if (el) {
              remoteGroupsRef.current.set(id, el);
            } else {
              remoteGroupsRef.current.delete(id);
            }
          }}
        >
          <ShipMesh color="#f59e0b" accentColor="#fbbf24" />
        </group>
      ))}
    </group>
  );
}
