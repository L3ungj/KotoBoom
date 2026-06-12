import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AmbientLight } from 'three'
import { usePlayer } from '../contexts/PlayerContext'

const BASE_INTENSITY   = 0.6
const CHORUS_INTENSITY = 0.9

export function DynamicLighting() {
  const lightRef = useRef<AmbientLight>(null)
  const { findCurrentChorus } = usePlayer()

  useFrame((_, delta) => {
    const chorus = findCurrentChorus()
    const target = chorus ? CHORUS_INTENSITY : BASE_INTENSITY
    if (lightRef.current) {
      lightRef.current.intensity += (target - lightRef.current.intensity) * (1 - Math.exp(-1.5 * delta))
    }
  })

  return <ambientLight ref={lightRef} intensity={BASE_INTENSITY} />
}
