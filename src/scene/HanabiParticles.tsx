import { Vector3 } from 'three'

export type ParticleType = 'sphere' | 'ring' | 'heart' | 'star' | 'XD'

export const PARTICLE_SIZE: Record<ParticleType, number> = {
  sphere: 0.12,
  ring: 0.08,
  heart: 0.15,
  star: 0.14,
  XD: 0.14
}

export function pickParticleType(rng: () => number): ParticleType {
  const r = rng()
  const types: ParticleType[] = ['sphere', 'ring', 'heart', 'star', 'XD']
  return types[Math.floor(r * types.length)]
}

function getPoints(type: ParticleType, t: number): { x: number, y: number } {
  switch (type) {
    case 'ring': {
      const angle = t * Math.PI * 2
      const r = 0.8
      return { x: r * Math.cos(angle), y: r * Math.sin(angle) }
    }
    case 'heart': {
      const angle = t * Math.PI * 2
      const x = 16 * Math.pow(Math.sin(angle), 3) / 17
      const y = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 17
      return { x, y }
    }
    case 'star': {
      const theta = t * Math.PI * 2
      const r = 0.79 + 0.21 * Math.cos(5 * theta)
      return { x: r * Math.cos(theta), y: r * Math.sin(theta) }
    }
    case 'XD': {
      if (t < 0.25) return { x: .2 + Math.abs(4 * t - .5), y: .1 + 1.6 * t }
      else if (t < 0.5) return { x: -.2 - Math.abs(4 * (t - .25) - .5), y: .1 + 1.6 * (t - .25) }
      else if (t < 0.75) return { x: .8 * (4 * (t - .5) - .5), y: -0.3 }
      else {
        const tt = Math.PI * (1 + 4 * (t - .75))
        return { x: .4 * Math.cos(tt), y: -.3 + .4 * Math.sin(tt) }
      }
    }
    default:
      return { x: 0, y: 0 }
  }
}

export function buildVelocities(
  type: ParticleType,
  rng: () => number,
  basisA: Vector3,
  basisB: Vector3,
  count: number,
): Float32Array {
  const v = new Float32Array(count * 3)

  const speed = 1.5 + rng() * 2.0
  if (type === 'sphere') {
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      v[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      v[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      v[i * 3 + 2] = Math.cos(phi) * speed
    }
    return v
  }

  for (let i = 0; i < count; i++) {
    const t = i / count
    const { x, y } = getPoints(type, t)
    v[i * 3] = (basisA.x * x + basisB.x * y) * speed
    v[i * 3 + 1] = (basisA.y * x + basisB.y * y) * speed
    v[i * 3 + 2] = (basisA.z * x + basisB.z * y) * speed
  }
  return v
}
