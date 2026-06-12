import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePlayer } from '../contexts/PlayerContext'

const STAR_COUNT = 200
const SKY_RADIUS = 85
const DRIFT_SPEED = 4
const RESET_RADIUS = 8
const RETURN_LERP = 0.02
const TRAIL_LENGTH = 50

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function spherePoint(rng: () => number, r: number, out: Float32Array, i3: number) {
  const theta = rng() * Math.PI * 2
  const phi = Math.acos(2 * rng() - 1)
  out[i3]     = r * Math.sin(phi) * Math.cos(theta)
  out[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
  out[i3 + 2] = r * Math.cos(phi)
}

export function StarField() {
  const { fireworkSeed, findCurrentChorus, playerRef } = usePlayer()

  const { positions, basePositions, speeds, geometry, slots } = useMemo(() => {
    const rng = seededRng(fireworkSeed ^ 0x57A2F1E3)
    const positions = new Float32Array(STAR_COUNT * 3)
    const basePositions = new Float32Array(STAR_COUNT * 3)
    const speeds = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      spherePoint(rng, SKY_RADIUS, positions, i * 3)
      basePositions.set(positions.subarray(i * 3, i * 3 + 3), i * 3)
      speeds[i] = 2.5 + rng() * 3.0
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // One geometry per trail frame, slot 0 = newest, slot TRAIL_LENGTH-1 = oldest
    const slots = Array.from({ length: TRAIL_LENGTH }, () => {
      const arr = new Float32Array(STAR_COUNT * 3)
      arr.set(positions)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      return { arr, geo }
    })

    return { positions, basePositions, speeds, geometry, slots }
  }, [fireworkSeed])

  const respawnRng = useRef(seededRng(fireworkSeed ^ 0xA3C9BE11))

  useFrame((_, delta) => {
    const chorus = findCurrentChorus()
    const isPlaying = playerRef.current?.isPlaying ?? false

    // Shift trail
    for (let j = TRAIL_LENGTH - 1; j > 0; j--) {
      slots[j].arr.set(slots[j - 1].arr)
      slots[j].geo.attributes.position.needsUpdate = true
    }
    slots[0].arr.set(positions)
    slots[0].geo.attributes.position.needsUpdate = true

    // Move stars
    if (chorus && isPlaying) {
      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3
        const x = positions[i3], y = positions[i3 + 1], z = positions[i3 + 2]
        const r = Math.sqrt(x * x + y * y + z * z)

        if (r < RESET_RADIUS) {
          spherePoint(respawnRng.current, SKY_RADIUS, positions, i3)
          basePositions.set(positions.subarray(i3, i3 + 3), i3)
        } else {
          const step = (DRIFT_SPEED * speeds[i] * delta) / r
          positions[i3]     -= x * step
          positions[i3 + 1] -= y * step
          positions[i3 + 2] -= z * step
        }
      }
    } else {
      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3
        positions[i3]     += (basePositions[i3]     - positions[i3])     * RETURN_LERP
        positions[i3 + 1] += (basePositions[i3 + 1] - positions[i3 + 1]) * RETURN_LERP
        positions[i3 + 2] += (basePositions[i3 + 2] - positions[i3 + 2]) * RETURN_LERP
      }
    }

    geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      {slots.map((slot, j) => (
        <points key={j} geometry={slot.geo}>
          <pointsMaterial
            color="#ffffff"
            size={0.02}
            sizeAttenuation
            transparent
            depthWrite={false}
            opacity={(1 - j / TRAIL_LENGTH) * 0.75}
          />
        </points>
      ))}
      <points geometry={geometry}>
        <pointsMaterial color="#ffffff" size={0.1} sizeAttenuation transparent opacity={0.75} />
      </points>
    </>
  )
}
