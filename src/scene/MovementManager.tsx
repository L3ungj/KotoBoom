import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { type RapierRigidBody } from '@react-three/rapier'
import { Bone, Quaternion, Vector3 } from 'three'
import { OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const MOVE_SPEED = 1
const ROTATE_SPEED = 1
const MAX_PITCH = Math.PI / 6
const PITCH_LERP = 0.3

export const movementState = {
  forward: false,
  backward: false,
  rotateLeft: false,
  rotateRight: false,
}

export const rigidBodyRef: { current: RapierRigidBody | null } = { current: null }
export const headBoneRef:  { current: Bone | null }            = { current: null }
export const cameraMode = { isOrbit: false, prevIsOrbit: false }

export function MovementManager() {
  const { camera } = useThree()
  const orbitRef = useRef<OrbitControlsImpl | null>(null)

  let currentPitch = 0
  let targetPitch = 0
  let isDragging = false

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'KeyW') movementState.forward = true
      if (e.code === 'KeyS') movementState.backward = true
      if (e.code === 'KeyA') movementState.rotateLeft = true
      if (e.code === 'KeyD') movementState.rotateRight = true
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'KeyW') movementState.forward = false
      if (e.code === 'KeyS') movementState.backward = false
      if (e.code === 'KeyA') movementState.rotateLeft = false
      if (e.code === 'KeyD') movementState.rotateRight = false
    }
    let lastTouchY = 0
    function onMouseDown() { isDragging = true }
    function onMouseUp()   { isDragging = false }
    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return
      targetPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch - e.movementY * 0.003))
    }
    function onTouchStart(e: TouchEvent) {
      isDragging = true
      lastTouchY = e.touches[0].clientY
    }
    function onTouchEnd() { isDragging = false }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging || e.touches.length === 0) return
      const dy = e.touches[0].clientY - lastTouchY
      lastTouchY = e.touches[0].clientY
      targetPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetPitch - dy * 0.003))
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchmove', onTouchMove)
    }
  })

  useFrame((_, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    if (movementState.rotateLeft || movementState.rotateRight) {
      const dir = movementState.rotateLeft ? 1 : -1
      const rot = rb.rotation()
      const q = new Quaternion(rot.x, rot.y, rot.z, rot.w)
      q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dir * ROTATE_SPEED * delta))
      rb.setRotation(q, true)
    }

    const linvel = rb.linvel()
    if (movementState.forward || movementState.backward) {
      const dir = movementState.forward ? 1 : -1
      const rot = rb.rotation()
      const forward = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(rot.x, rot.y, rot.z, rot.w))
      rb.setLinvel({ x: forward.x * MOVE_SPEED * dir, y: linvel.y, z: forward.z * MOVE_SPEED * dir }, true)
    } else {
      rb.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
    }

    if (!cameraMode.isOrbit) {
      if (orbitRef.current) orbitRef.current.enabled = false

      camera.position.set(rb.translation().x, rb.translation().y + 0.9, rb.translation().z)
      const rot = rb.rotation()
      const yaw = new Quaternion(rot.x, rot.y, rot.z, rot.w)
      const flip = new Quaternion(0, 1, 0, 0)

      currentPitch += (targetPitch - currentPitch) * Math.min(1, PITCH_LERP)
      const pitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), currentPitch)

      const headQ = headBoneRef.current?.quaternion ?? new Quaternion()
      const headQDamped = new Quaternion().slerp(headQ, 0.05)
      camera.quaternion.copy(yaw).multiply(flip).multiply(pitch).multiply(headQDamped)
    } else {
      if (orbitRef.current) {
        orbitRef.current.enabled = true
        if (cameraMode.prevIsOrbit !== cameraMode.isOrbit) {
          const playerPos = rb.translation()
          const cameraPos = new Vector3().copy(playerPos).add(new Vector3(0, 1.2, -3))
          orbitRef.current.object.position.copy(cameraPos)
          orbitRef.current.target.set(playerPos.x, playerPos.y + 1.5, playerPos.z)
        }
      }
    }
    cameraMode.prevIsOrbit = cameraMode.isOrbit
  })

  return <OrbitControls ref={orbitRef} />
}
