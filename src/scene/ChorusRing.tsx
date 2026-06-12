import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial } from 'three'
import { usePlayer } from '../contexts/PlayerContext'

const RING_OFFSETS_MS  = [0, 200, 400]
const RING_DURATION_MS = 2000
const MAX_SCALE        = 15

export function ChorusRing() {
  const { findCurrentChorus, playerRef } = usePlayer()
  const ringsRef            = useRef<(Mesh | null)[]>([null, null, null])
  const triggerTimeRef      = useRef(-Infinity)
  const lastChorusStartRef  = useRef(-Infinity)

  useFrame(() => {
    const pos    = playerRef.current?.mediaPosition ?? 0
    const chorus = findCurrentChorus()

    if (chorus && chorus.startTime !== lastChorusStartRef.current) {
      lastChorusStartRef.current = chorus.startTime
      triggerTimeRef.current     = chorus.startTime
    }

    for (let i = 0; i < 3; i++) {
      const mesh = ringsRef.current[i]
      if (!mesh) continue
      const elapsed = pos - (triggerTimeRef.current + RING_OFFSETS_MS[i])
      if (elapsed < 0 || elapsed > RING_DURATION_MS) {
        mesh.visible = false
        continue
      }
      const t = elapsed / RING_DURATION_MS
      mesh.visible = true
      mesh.scale.setScalar(Math.max(0.01, t) * MAX_SCALE)
      ;(mesh.material as MeshBasicMaterial).opacity = 1 - t
    }
  })

  return (
    <>
      {RING_OFFSETS_MS.map((_, i) => (
        <mesh
          key={i}
          ref={el => { ringsRef.current[i] = el }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshBasicMaterial color="#6fe2ff" transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}
