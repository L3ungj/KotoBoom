import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshBasicMaterial } from 'three'
import { usePlayer } from '../contexts/PlayerContext'

const BASE_COLOR   = new Color('#0a0a1a')
const CHORUS_COLOR = new Color('#0a0a1e')

export function Sky() {
  const matRef = useRef<MeshBasicMaterial>(null)
  const tRef   = useRef(0)
  const { findCurrentChorus } = usePlayer()

  useFrame((_, delta) => {
    const chorus = findCurrentChorus()
    tRef.current += (chorus ? 1 : 0 - tRef.current) * (1 - Math.exp(-1.5 * delta))

    if (matRef.current) {
      matRef.current.color.copy(BASE_COLOR).lerp(CHORUS_COLOR, tRef.current)
    }
  })

  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial ref={matRef} color="#0a0a1a" side={1} />
    </mesh>
  )
}
