import { useRef, useMemo } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { usePlayer } from '../contexts/PlayerContext'

const CUBE_COUNT = 10
const CEILING_Y = 5
const RERANDOMIZE_GAP = 5000
const IMPULSE_MAGNITUDE = 0.3
const MIN_SPEED = 0.1
const COLORS = ['#ff6fa3','#FFD700','#00D9FF','#ff4757','#2ed573','#1e90ff','#ff6b81','#eccc68','#70a1ff','#ffa502']

export function ChorusCubes() {
  const { findCurrentChorus } = usePlayer()
  const rbRefs   = useRef<(RapierRigidBody | null)[]>(Array(CUBE_COUNT).fill(null))
  const matRefs  = useRef<(THREE.LineBasicMaterial | null)[]>(Array(CUBE_COUNT).fill(null))
  const meshRefs = useRef<(THREE.LineSegments | null)[]>(Array(CUBE_COUNT).fill(null))
  const lastChorusStartRef = useRef(-Infinity)
  const lastChorusEndRef   = useRef(-Infinity)
  const opacityRef    = useRef(0)
  const isActiveRef   = useRef(false)
  const { camera } = useThree()
  const sizes = useMemo(() => Array.from({ length: CUBE_COUNT }, () => 0.2 + Math.random() * 0.6), [])

  function onPress(e: ThreeEvent<PointerEvent>, i: number) {
    e.stopPropagation()
    if (!isActiveRef.current) return
    const rb = rbRefs.current[i]
    if (!rb) return
    const t = rb.translation()
    const dir = new THREE.Vector3(t.x - camera.position.x, t.y - camera.position.y, t.z - camera.position.z).normalize()
    rb.applyImpulse({ x: dir.x * IMPULSE_MAGNITUDE, y: dir.y * IMPULSE_MAGNITUDE, z: dir.z * IMPULSE_MAGNITUDE }, true)
    rb.wakeUp()
  }

  useFrame((_, delta) => {
    const chorus = findCurrentChorus()
    
    if (chorus && chorus.startTime !== lastChorusStartRef.current) {
      lastChorusStartRef.current = chorus.startTime
      if (chorus.startTime > lastChorusEndRef.current + RERANDOMIZE_GAP) {
        rbRefs.current.forEach(rb => {
          if (!rb) return
          rb.setTranslation({ x: (Math.random() - 0.5) * 7, y: Math.random() * 3 + .5, z: (Math.random() - 0.5) * 7 }, true)
          rb.setLinvel({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 }, true)
          rb.setAngvel({ x: Math.random() * 3, y: Math.random() * 3, z: Math.random() * 3 }, true)
        })
      }
      lastChorusEndRef.current   = chorus.endTime
      isActiveRef.current = true
    }

    if (!chorus && lastChorusStartRef.current !== -Infinity) {
      lastChorusStartRef.current = -Infinity
      isActiveRef.current = false
    }

    // Enforce minimum speed while active
    if (isActiveRef.current) {
      rbRefs.current.forEach(rb => {
        if (!rb) return
        const v = rb.linvel()
        const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        if (speed < MIN_SPEED) {
          if (speed > 0.001) {
            const s = MIN_SPEED / speed
            rb.setLinvel({ x: v.x * s, y: v.y * s, z: v.z * s }, true)
          } else {
            rb.setLinvel({ x: (Math.random() - 0.5) * MIN_SPEED * 2, y: MIN_SPEED, z: (Math.random() - 0.5) * MIN_SPEED * 2 }, true)
          }
        }
      })
    }

    // Fade opacity
    const target = isActiveRef.current ? 1 : 0
    opacityRef.current += (target - opacityRef.current) * Math.min(1, 3 * delta)
    const visible = opacityRef.current > 0.01
    matRefs.current.forEach(mat => { if (mat) mat.opacity = opacityRef.current })
    meshRefs.current.forEach(mesh => { if (mesh) mesh.visible = visible })
  })

  return (
    <>
      {/* Ceiling collider — keeps cubes in bounds */}
      <RigidBody type="fixed" restitution={1.0}>
        <CuboidCollider args={[5, 0.1, 5]} position={[0, CEILING_Y, 0]} />
      </RigidBody>

      {COLORS.map((color, i) => (
        <RigidBody
          key={i}
          ref={(rb) => { rbRefs.current[i] = rb }}
          restitution={1.0}
          friction={0.1}
        >
          <mesh onPointerDown={(e) => onPress(e, i)}>
            <boxGeometry args={[sizes[i], sizes[i], sizes[i]]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <lineSegments ref={(m) => { meshRefs.current[i] = m }} visible={false}>
            <edgesGeometry args={[new THREE.BoxGeometry(sizes[i], sizes[i], sizes[i])]} />
            <lineBasicMaterial
              ref={(mat) => { matRefs.current[i] = mat }}
              color={color}
              transparent
              opacity={0}
            />
          </lineSegments>
        </RigidBody>
      ))}
    </>
  )
}
