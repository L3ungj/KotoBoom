import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody, CuboidCollider } from "@react-three/rapier"
import { BoxGeometry, DoubleSide, MeshStandardMaterial, Vector3 } from "three"
import { usePlayer } from "../contexts/PlayerContext"

const GROUND_SIZE = 10

export function Ground() {
  const matRef = useRef<MeshStandardMaterial>(null)
  const pulseRef = useRef(0)
  const lastBeatIndexRef = useRef(-1)
  const { findCurrentBeat } = usePlayer()

  useFrame(() => {
    const beat = findCurrentBeat()
    if (beat && beat.index !== lastBeatIndexRef.current) {
      lastBeatIndexRef.current = beat.index
      pulseRef.current = 1.0
    }
    pulseRef.current *= 0.92
    if (matRef.current) {
      matRef.current.emissiveIntensity = pulseRef.current * 3
    }
  })

  const sidesPos = [
    new Vector3(0, 0.5, GROUND_SIZE / 2 + 0.5), // front
    new Vector3(0, 0.5, -GROUND_SIZE / 2 - 0.5), // back
    new Vector3(-GROUND_SIZE / 2 - 0.5, 0.5, 0), // left
    new Vector3(GROUND_SIZE / 2 + 0.5, 0.5, 0), // right
  ]

  return (<>
    {/* Floor */}
    <RigidBody type="fixed" restitution={1.0}>
      <mesh position={[0, -.005, 0]} scale={[GROUND_SIZE, 0.01, GROUND_SIZE]}>
        <boxGeometry />
        <meshStandardMaterial
          ref={matRef}
          color="#00ffff"
          transparent
          opacity={0.1}
          depthWrite={false}
          emissive="#00ffff"
          emissiveIntensity={2}
        />
      </mesh>

      <lineSegments position={[0, -.005, 0]} scale={[GROUND_SIZE, 0.01, GROUND_SIZE]}>
        <edgesGeometry args={[new BoxGeometry()]} />
        <lineBasicMaterial color="#00ffff" />
      </lineSegments>
    </RigidBody>
  
    {/* Front Wall */}
    <mesh
      position={[0, 0.35, GROUND_SIZE / 2 + 0.005]}
      scale={[GROUND_SIZE, 0.7, 0.01]}
    >
      <boxGeometry />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={DoubleSide}
        vertexShader={`
          varying float vY;
          void main() {
            vY = position.y + 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying float vY;
          void main() {
            float alpha = (1.0 - vY) * 0.4;
            gl_FragColor = vec4(1.0, 0.1, 0.1, alpha);
          }
        `}
      />
    </mesh>

    {/* Side Walls — collider only, no mesh */}
    {sidesPos.map((pos, index) => (
      <RigidBody type="fixed" key={index}>
        <CuboidCollider
          args={[pos.x === 0 ? 5 : 0.5, 5, pos.z === 0 ? 5 : 0.5]}
          position={pos}
        />
      </RigidBody>
    ))}
  </>)
}
