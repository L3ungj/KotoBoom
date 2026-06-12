"use client"

import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Physics } from "@react-three/rapier"
import { usePlayer } from "../contexts/PlayerContext"
import { MikuModel } from "../scene/MikuModel"
import { Ground } from "../scene/Ground"
import { Sky } from "../scene/Sky"
import { Hanabi } from "../scene/Hanabi"
import { StarField } from "../scene/StarField"
import { MovementManager, cameraMode } from "../scene/MovementManager"
import { DynamicLighting } from "../scene/DynamicLighting"
import { ChorusRing } from "../scene/ChorusRing"
import { MovementButtons } from "./MovementButtons"
import { ChorusCubes } from "../scene/ChorusCubes"

function Scene() {
  const { playerRef, fireworkSeed } = usePlayer()
  const words = playerRef.current?.video?.words ?? []

  console.log(playerRef.current?.video)
  return (
    <>
      <Sky />
      <StarField />
      <DynamicLighting />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#6fa3ff" />
      <pointLight position={[-5, 8, -5]} intensity={0.4} color="#ff6fa3" />
      <Physics gravity={[0, -.01, 0]}>
        <Ground />
        <MikuModel />
        <ChorusCubes />
      </Physics>

      <ChorusRing />
      <MovementManager />

      {words.map((word, index) => (
        <Hanabi key={index} word={word} fireworkSeed={fireworkSeed} />
      ))}
    </>
  )
}

function CameraButton() {
  const [isOrbit, setIsOrbit] = useState(cameraMode.isOrbit)

  function toggle() {
    cameraMode.isOrbit = !cameraMode.isOrbit
    setIsOrbit(cameraMode.isOrbit)
  }

  return (
    <button
      onClick={toggle}
      className="absolute bottom-4 left-4 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded border border-gray-600"
      title={isOrbit ? 'First Person' : 'Orbit'}
    >
      {isOrbit ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
        </svg>
      )}
    </button>
  )
}

export function MikuCanvas() {
    return (
    <div className="relative w-full h-full">
      <Canvas>
        <Scene />
      </Canvas>

      <CameraButton />
      <MovementButtons />
    </div>
  )
}
