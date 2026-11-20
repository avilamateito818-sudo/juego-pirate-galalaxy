import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  HANGAR_SHIPS,
  SIMULATION_CONSTANTS,
  type AbilitySlot
} from '@starcorsair/shared';
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

const DIGIT_SLOT_MAP: Record<string, AbilitySlot> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit5: 5,
  Digit6: 6,
  Digit7: 7,
  Digit8: 8
};

export function PlayerController() {
  const { camera } = useThree();
  const localShipRef = useRef<THREE.Group>(null);
  const remoteGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const inputAccumRef = useRef(0);
  const smoothYawRef = useRef(0);

  const playerCount = useHudStore((s) => s.playerCount);
  const afterburnerActive = useHudStore((s) => s.afterburnerActive);
  const shipModelId = useHudStore((s) => s.shipModelId);
  const alive = useHudStore((s) => s.alive);
  const inOrbit = useHudStore((s) => s.inOrbit);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.add(code);

      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Digit4') {
        useHudStore.getState().setAfterburnerActive(true);
      }

      if (code === 'Tab') {
        e.preventDefault();
        planetClient.cycleNearestTarget();
        return;
      }

      const slot = DIGIT_SLOT_MAP[code];
      if (slot && !e.repeat) {
        planetClient.castAbility(slot);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.delete(code);
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Digit4') {
        const stillBoost =
          keysRef.current.has('ShiftLeft') ||
          keysRef.current.has('ShiftRight') ||
          keysRef.current.has('Digit4');
        useHudStore.getState().setAfterburnerActive(stillBoost);
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

    while (inputAccumRef.current >= INPUT_STEP_SECONDS) {
      inputAccumRef.current -= INPUT_STEP_SECONDS;
      const keys = keysRef.current;

      let moveX = 0;
      let moveZ = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveZ -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveZ += 1;

      const afterburner =
        keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('Digit4');

      if (moveX !== 0 || moveZ !== 0) {
        planetClient.sendMovementStep(moveX, moveZ, afterburner);
      }
    }

    const local = planetClient.localTransform;
    const shipObj = localShipRef.current;
    if (shipObj) {
      shipObj.visible = planetClient.localAlive && !planetClient.localInOrbit;
      shipObj.position.x += (local.x - shipObj.position.x) * Math.min(1, safeDelta * 14);
      shipObj.position.y += (local.y - shipObj.position.y) * Math.min(1, safeDelta * 14);
      shipObj.position.z += (local.z - shipObj.position.z) * Math.min(1, safeDelta * 14);

      smoothYawRef.current = lerpAngle(
        smoothYawRef.current,
        local.yaw,
        Math.min(1, safeDelta * 12)
      );
      shipObj.rotation.y = smoothYawRef.current;

      // Cámara en tercera persona (más alta en órbita para vista panorámica)
      const camHeight = planetClient.localInOrbit ? 48 : 17;
      const camBack = planetClient.localInOrbit ? 56 : 26;
      _cameraTargetPos.set(
        shipObj.position.x,
        shipObj.position.y + camHeight,
        shipObj.position.z + camBack
      );
      camera.position.lerp(_cameraTargetPos, Math.min(1, safeDelta * 6));
      _cameraLookAt.set(shipObj.position.x, shipObj.position.y + 1.5, shipObj.position.z);
      camera.lookAt(_cameraLookAt);
    }

    const interpAlpha = Math.min(1, safeDelta * 12);
    for (const [id, remote] of planetClient.remoteShips.entries()) {
      const group = remoteGroupsRef.current.get(id);
      if (!group) continue;
      group.visible = remote.alive && !remote.inOrbit;
      if (!group.visible) continue;

      remote.render.x += (remote.target.x - remote.render.x) * interpAlpha;
      remote.render.y += (remote.target.y - remote.render.y) * interpAlpha;
      remote.render.z += (remote.target.z - remote.render.z) * interpAlpha;
      remote.render.yaw = lerpAngle(remote.render.yaw, remote.target.yaw, interpAlpha);

      group.position.set(remote.render.x, remote.render.y, remote.render.z);
      group.rotation.y = remote.render.yaw;
    }
  });

  const localSpec = HANGAR_SHIPS[shipModelId];
  const remoteEntries =
    playerCount > 1 ? Array.from(planetClient.remoteShips.values()) : [];

  return (
    <group>
      <group
        ref={localShipRef}
        visible={alive && !inOrbit}
        position={[
          planetClient.localTransform.x,
          planetClient.localTransform.y,
          planetClient.localTransform.z
        ]}
      >
        <ShipMesh
          color={localSpec.color}
          accentColor={localSpec.accentColor}
          afterburner={afterburnerActive}
        />
      </group>

      {remoteEntries.map((remote) => {
        const spec = HANGAR_SHIPS[remote.shipModelId];
        return (
          <group
            key={remote.id}
            ref={(el) => {
              if (el) {
                remoteGroupsRef.current.set(remote.id, el);
              } else {
                remoteGroupsRef.current.delete(remote.id);
              }
            }}
          >
            <ShipMesh
              color={spec.color}
              accentColor="#fbbf24"
              afterburner={remote.afterburner}
            />
          </group>
        );
      })}
    </group>
  );
}
