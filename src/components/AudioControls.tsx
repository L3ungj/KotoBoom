import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

function formatTime(ms: number | undefined): string {
  const s = Math.floor((ms ?? 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const AudioControls: React.FC = () => {
  const { play, pause, seek, playerRef, isLoading } = usePlayer();
  const progressRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const duration = playerRef.current?.video?.duration ?? 0;

  // Update progress bar value directly via DOM — no React re-renders
  useEffect(() => {
    function tick() {
      if (progressRef.current) {
        progressRef.current.value = isLoading ? '0' : String(playerRef.current?.mediaPosition);
      }
      if (currentTimeRef.current) {
        currentTimeRef.current.textContent = isLoading ? '--:--' : formatTime(playerRef.current?.mediaPosition);
      }
      setIsPlaying(playerRef.current?.isPlaying ?? false);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  });

  function seekRelative(deltaMs: number) {
    const target = Math.max(0, Math.min(duration, (playerRef.current?.mediaPosition ?? 0) + deltaMs));
    seek(target);
  }

  function onPlayPauseClick() {
    (playerRef.current?.isPlaying ? pause : play)();
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => seekRelative(-10000)}
          disabled={isLoading}
          className="hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/>
          </svg>
        </button>
        <button
          onClick={onPlayPauseClick}
          disabled={isLoading}
          className="hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <button
          onClick={() => seekRelative(10000)}
          disabled={isLoading}
          className="hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2 w-full max-w-2xl">
        <span ref={currentTimeRef} className="text-xs text-gray-400 tabular-nums w-8 text-right">0:00</span>
        <input
          ref={progressRef}
          type="range"
          min={0}
          max={duration}
          step={100}
          defaultValue={0}
          onChange={e => seek(Number(e.target.value))}
          className="flex-1 accent-cyan-400"
          disabled={isLoading || duration === 0}
        />
        <span className="text-xs text-gray-400 tabular-nums w-8">{isLoading ? '--:--' : formatTime(duration)}</span>
      </div>
    </div>
  );
};
