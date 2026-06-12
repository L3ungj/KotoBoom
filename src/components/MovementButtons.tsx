import { movementState } from '../scene/MovementManager'

interface DpadBtnProps {
  onStart: () => void
  onEnd: () => void
  className?: string
  children: React.ReactNode
}

function DpadBtn({ onStart, onEnd, className = '', children }: DpadBtnProps) {
  return (
    <button
      className={`flex items-center justify-center w-12 h-12 bg-gray-800/70 active:bg-gray-600/70 text-white rounded-lg border border-gray-600/50 select-none touch-none ${className}`}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); onStart() }}
      onPointerUp={onEnd}
      onPointerLeave={onEnd}
      onPointerCancel={onEnd}
    >
      {children}
    </button>
  )
}

function Arrow({ dir }: { dir: 'up' | 'down' | 'left' | 'right' }) {
  const points: Record<string, string> = {
    up:    '12 7 19 17 5 17',
    down:  '12 17 5 7 19 7',
    left:  '7 12 17 5 17 19',
    right: '17 12 7 19 7 5',
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points={points[dir]} />
    </svg>
  )
}

export function MovementButtons() {
  return (
    <div className="touch-only absolute bottom-4 right-4 grid-cols-3 gap-1.5" style={{ gridTemplateRows: 'repeat(3, 3rem)' }}>
      <div />
      <DpadBtn onStart={() => movementState.forward = true} onEnd={() => movementState.forward = false}>
        <Arrow dir="up" />
      </DpadBtn>
      <div />

      <DpadBtn onStart={() => movementState.rotateLeft = true} onEnd={() => movementState.rotateLeft = false}>
        <Arrow dir="left" />
      </DpadBtn>
      <div />
      <DpadBtn onStart={() => movementState.rotateRight = true} onEnd={() => movementState.rotateRight = false}>
        <Arrow dir="right" />
      </DpadBtn>

      <div />
      <DpadBtn onStart={() => movementState.backward = true} onEnd={() => movementState.backward = false}>
        <Arrow dir="down" />
      </DpadBtn>
      <div />
    </div>
  )
}
