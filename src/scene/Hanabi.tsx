import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { IWord } from 'textalive-app-api'
import { usePlayer } from '../contexts/PlayerContext'
import { pickParticleType, buildVelocities, PARTICLE_SIZE } from './HanabiParticles'

interface HanabiProps {
  word: IWord
  fireworkSeed: number
}

const SPHERE_R = 15
const LAUNCH_ORIGIN = new THREE.Vector3(0, -4, 15)
const LAUNCH_DURATION = 1200
const BURST_MIN_DURATION = 1500
const PARTICLE_COUNT = 24
const GRAVITY = -2
const ARC_RADIANS = (1 / 4) * Math.PI
const TEXT_EARLY_MS = 500
const FADE_DURATION = 800
const CHAR_WIDTH = 1
const WORD_GAP   = 0.4
const TEXT_TILT_MAX = 0.3
const Y_SPREAD = 1

const _rocketPos = new THREE.Vector3()

function seededRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function posToColor(pos: string): string {
  switch (pos) {
    case 'N':
    case 'PN': return '#FFD700'
    case 'V':  return '#FF4010'
    case 'J':
    case 'A':  return '#00D9FF'
    default:   return '#FFB0D0'
  }
}

export function Hanabi({ word, fireworkSeed }: HanabiProps) {
  const { playerRef } = usePlayer()

  const rocketRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const textRef = useRef<any>(null)

  const { explosionPos, positionsBuffer, velocities, particleType, color, launchStart, textStart, phraseEnd, burstEnd, textRotation } = useMemo(() => {
    // Phrase base — all words in the same phrase share this anchor on the sphere
    const phraseRng = seededRng(fireworkSeed ^ word.parent.startTime)
    const azimuth = (phraseRng() - 0.5) * ARC_RADIANS
    const elevation = 0.2 + phraseRng() * 0.3
    const baseX = SPHERE_R * Math.cos(elevation) * Math.sin(azimuth)
    const baseY = SPHERE_R * Math.sin(elevation)
    const baseZ = SPHERE_R * Math.cos(elevation) * Math.cos(azimuth)

    // Left-to-right layout along the horizontal tangent at the phrase base position
    const phraseWords = word.parent.children
    const wordIndex   = phraseWords.indexOf(word)
    const radial = new THREE.Vector3(baseX, baseY, baseZ).normalize()
    const right  = new THREE.Vector3().crossVectors(new THREE.Vector3(0, -1, 0), radial).normalize()

    const widths = phraseWords.map(w => w.text.length * CHAR_WIDTH)
    const totalWidth = widths.reduce((a, b) => a + b, 0) + (phraseWords.length - 1) * WORD_GAP
    let cursor = -totalWidth / 2
    const offsets = widths.map(w => { const c = cursor + w / 2; cursor += w + WORD_GAP; return c })
    const spread = offsets[wordIndex]

    // wordRng declared here so it can be used for Y offset, tilt, and particles
    const wordRng = seededRng(fireworkSeed ^ word.startTime)
    const explosionPos = new THREE.Vector3(
      baseX + right.x * spread,
      baseY + (wordRng() - 0.5) * Y_SPREAD,
      baseZ + right.z * spread,
    )

    // Text rotation — faces origin, upright with random tilt (YXZ: yaw then pitch then roll)
    const forward = new THREE.Vector3().copy(explosionPos).negate().normalize()
    const yaw = Math.atan2(forward.x, forward.z)
    const pitch = Math.atan2(-forward.y, Math.sqrt(forward.x * forward.x + forward.z * forward.z))
    const tilt = (wordRng() - 0.5) * TEXT_TILT_MAX * 2
    const textRotation = new THREE.Euler(pitch, yaw, tilt, 'YXZ')

    // Basis vectors in the plane perpendicular to radial at explosion position
    const exRadial = explosionPos.clone().normalize()
    const tempRef  = Math.abs(exRadial.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0)
    const basisA = new THREE.Vector3().crossVectors(tempRef, exRadial).normalize()
    const basisB = new THREE.Vector3().crossVectors(exRadial, basisA).normalize()

    // Particle type (1 RNG draw — after Y offset and tilt)
    const particleType = pickParticleType(wordRng)
    const positionsBuffer = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = buildVelocities(particleType, wordRng, basisA, basisB, PARTICLE_COUNT)

    const phraseEnd = word.parent.lastWord.endTime

    return {
      explosionPos,
      positionsBuffer,
      velocities,
      particleType,
      color: posToColor(word.pos),
      launchStart: word.startTime - LAUNCH_DURATION,
      textStart: word.startTime - TEXT_EARLY_MS,
      phraseEnd,
      burstEnd: phraseEnd + FADE_DURATION,
      textRotation,
    }
  }, [word, fireworkSeed])

  useFrame(() => {
    const pos = playerRef.current?.mediaPosition ?? 0

    if (pos < launchStart || pos > burstEnd) {
      if (rocketRef.current) rocketRef.current.visible = false
      if (pointsRef.current) pointsRef.current.visible = false
      if (textRef.current) textRef.current.visible = false
      return
    }

    if (pos < word.startTime) {
      // Rocket rising phase
      const t = (pos - launchStart) / LAUNCH_DURATION
      _rocketPos.lerpVectors(LAUNCH_ORIGIN, explosionPos, t)
      if (rocketRef.current) {
        rocketRef.current.position.copy(_rocketPos)
        rocketRef.current.visible = true
      }
      if (pointsRef.current) pointsRef.current.visible = false
      if (textRef.current) {
        if (pos >= textStart) {
          textRef.current.position.set(_rocketPos.x, _rocketPos.y, _rocketPos.z)
          textRef.current.visible = true
          textRef.current.fillOpacity = 1
        } else {
          textRef.current.visible = false
        }
      }
      return
    }

    // Burst phase
    if (rocketRef.current) rocketRef.current.visible = false

    const elapsed = (pos - word.startTime) / 1000
    const particleDuration = Math.max(word.endTime - word.startTime, BURST_MIN_DURATION)
    const particleT = (pos - word.startTime) / particleDuration

    if (pointsRef.current) {
      pointsRef.current.visible = true
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positionsBuffer[i * 3]     = explosionPos.x + velocities[i * 3]     * elapsed
        positionsBuffer[i * 3 + 1] = explosionPos.y + velocities[i * 3 + 1] * elapsed + 0.5 * GRAVITY * elapsed * elapsed
        positionsBuffer[i * 3 + 2] = explosionPos.z + velocities[i * 3 + 2] * elapsed
      }
      const attr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      attr.needsUpdate = true
      const mat = pointsRef.current.material as THREE.PointsMaterial
      mat.opacity = Math.max(0, 1 - particleT)
    }

    if (textRef.current) {
      textRef.current.position.set(explosionPos.x, explosionPos.y, explosionPos.z)
      textRef.current.visible = true
      if (pos <= phraseEnd) {
        textRef.current.fillOpacity = 1
      } else {
        const textT = (pos - phraseEnd) / FADE_DURATION
        textRef.current.fillOpacity = Math.max(0, 1 - textT)
      }
    }
  })

  return (
    <group>
      <mesh ref={rocketRef} visible={false}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <points ref={pointsRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positionsBuffer, 3]} />
        </bufferGeometry>
        <pointsMaterial size={PARTICLE_SIZE[particleType]} color={color} transparent opacity={1} depthWrite={false} sizeAttenuation />
      </points>

      <Text
        ref={textRef}
        font={`${import.meta.env.BASE_URL}fonts/ZenKakuGothic900.woff`}
        rotation={textRotation}
        fontSize={1}
        color={color}
        anchorX="center"
        anchorY="middle"
        visible={false}
      >
        {word.text}
      </Text>
    </group>
  )
}
