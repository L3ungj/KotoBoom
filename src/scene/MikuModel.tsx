import { useRef, useEffect } from "react"
import { useLoader, useFrame } from "@react-three/fiber"
import { RigidBody, CapsuleCollider } from "@react-three/rapier"
import { AnimationAction, AnimationMixer, Quaternion, Vector3 } from "three"
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import { getActions, getBone, type AnimationName } from "./animations"
import { rigidBodyRef, headBoneRef, cameraMode, movementState } from "./MovementManager"
import { usePlayer } from "../contexts/PlayerContext"

const ARM_DEFAULT_ROTATION = Math.PI / 4
const HEAD_SWAY_MAX = 0.2
const HAIR_SWAY_MAX = 0.3
const HAIR_AMP      = [1.0, 1.3, 1.6]  // rest-angle amplitude per tier
const HAIR_SPRING_K = [60,  30,  15 ]  // stiffness (rad/s²) — stiffer = faster response
const HAIR_DAMPING  = [12,  8,   5  ]  // damping — less = more oscillation at tips
const HAIR_DRIFT_MAX = 0.12            // max X rotation (rad) at full walk speed

export async function MikuModel() {
  const mesh = useLoader(MMDLoader, `${import.meta.env.BASE_URL}box_miku_1.1/box_miku.pmd`)
  mesh.scale.set(0.1, 0.1, 0.1)

  console.log("MikuModel loaded:", mesh)

  const mixerRef = useRef<AnimationMixer | null>(null)
  const actionsRef = useRef<Record<AnimationName, AnimationAction> | null>(null)
  const currentAnimRef = useRef<AnimationName>('idle')
  const { findCurrentBeat, playerRef } = usePlayer()
  const hairAngleRef    = useRef([[0,0],[0,0],[0,0]])  // [tier][Z, X]
  const hairVelocityRef = useRef([[0,0],[0,0],[0,0]])

  useEffect(() => {
    const mixer = new AnimationMixer(mesh)
    mixerRef.current = mixer
    actionsRef.current = getActions(mesh, mixer)
    actionsRef.current['idle'].play()
    headBoneRef.current = getBone(mesh, 'head')
  }, [])

  useFrame((_, delta) => {
    mesh.visible = cameraMode.isOrbit

    if (actionsRef.current) {
      const target: AnimationName = (movementState.forward || movementState.backward) ? 'walk' : 'idle'
      if (target !== currentAnimRef.current) {
        actionsRef.current[currentAnimRef.current].stop()
        actionsRef.current[target].play()
        currentAnimRef.current = target
      }
    }

    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    const isPlaying = playerRef.current?.isPlaying ?? false
    const beat = findCurrentBeat()
    const pos = playerRef.current?.mediaPosition ?? 0
    const returnAlpha = 1 - Math.exp(-6 * delta)

    const arm_L = getBone(mesh, 'arm_L')
    const arm_R = getBone(mesh, 'arm_R')
    if (arm_L && arm_R) {
      arm_L.rotation.z = -ARM_DEFAULT_ROTATION
      arm_R.rotation.z = ARM_DEFAULT_ROTATION
    }

    const headSway = (isPlaying && beat)
      ? (beat.index % 2 === 0 ? 1 : -1) * (beat.progress(pos) * 2 - 1)
      : 0

    // Head: direct when playing, lerp to 0 when stopped
    const headBone = getBone(mesh, 'head')
    if (headBone) {
      const headTarget = headSway * HEAD_SWAY_MAX
      headBone.rotation.z += (headTarget - headBone.rotation.z) * returnAlpha
    }

    // Forward speed in character-local space (positive = moving forward)
    const rb = rigidBodyRef.current
    let forwardSpeed = 0
    if (rb) {
      const vel = rb.linvel()
      const rot = rb.rotation()
      const facing = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(rot.x, rot.y, rot.z, rot.w))
      forwardSpeed = vel.x * facing.x + vel.z * facing.z
    }

    for (let t = 0; t < 3; t++) {
      const targetZ = headSway * HAIR_SWAY_MAX * HAIR_AMP[t]
      const targetX = forwardSpeed * HAIR_DRIFT_MAX * HAIR_AMP[t]
      for (let a = 0; a < 2; a++) {
        const tgt = a === 0 ? targetZ : targetX
        const acc = (tgt - hairAngleRef.current[t][a]) * HAIR_SPRING_K[t]
        hairVelocityRef.current[t][a] += acc * delta
        hairVelocityRef.current[t][a] *= Math.exp(-HAIR_DAMPING[t] * delta)
        hairAngleRef.current[t][a] += hairVelocityRef.current[t][a] * delta
      }
    }
    const ha = hairAngleRef.current
    const hair1L = getBone(mesh, 'hair1_L'); if (hair1L) { hair1L.rotation.z = ha[0][0]; hair1L.rotation.x = ha[0][1] }
    const hair1R = getBone(mesh, 'hair1_R'); if (hair1R) { hair1R.rotation.z = ha[0][0]; hair1R.rotation.x = ha[0][1] }
    const hair2L = getBone(mesh, 'hair2_L'); if (hair2L) { hair2L.rotation.z = ha[1][0]; hair2L.rotation.x = ha[1][1] }
    const hair2R = getBone(mesh, 'hair2_R'); if (hair2R) { hair2R.rotation.z = ha[1][0]; hair2R.rotation.x = ha[1][1] }
    const hair3L = getBone(mesh, 'hair3_L'); if (hair3L) { hair3L.rotation.z = ha[2][0]; hair3L.rotation.x = ha[2][1] }
    const hair3R = getBone(mesh, 'hair3_R'); if (hair3R) { hair3R.rotation.z = ha[2][0]; hair3R.rotation.x = ha[2][1] }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      mass={1}
      position={[0, 0, 0]}
      colliders={false}
      enabledRotations={[false, true, false]}
      type="kinematicVelocity"
    >
      <CapsuleCollider args={[0.1, 0.4]} position={[0, 0.5, 0]} />
      <primitive object={mesh} />
    </RigidBody>
  )
}
