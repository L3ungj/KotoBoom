import { createContext, useContext, useState, useRef, type ReactNode } from 'react';
import { Player, type IBeat, type IRepetitiveSegment, type IVideo, type Timer } from 'textalive-app-api';
import { SONGS } from '../songs';

const token = import.meta.env.VITE_TEXTALIVE_API_TOKEN;

interface PlayerContextType {
  isLoading: boolean;
  playerRef: React.RefObject<Player | null>;
  selectedSong: number | null;
  fireworkSeed: number;
  play: () => boolean;
  pause: () => boolean;
  stop: () => boolean;
  seek: (posMs: number) => void;
  selectSong: (index: number) => void;
  initializePlayer: (mediaElement: HTMLElement) => void;
  findCurrentBeat: () => IBeat | null;
  findCurrentChorus: () => IRepetitiveSegment | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [selectedSong, setSelectedSong] = useState<number | null>(null);
  const currentPosRef = useRef(0);
  const [fireworkSeed, setFireworkSeed] = useState(() => Math.random() * 0xFFFFFFFF | 0);
  const [isLoading, setIsLoading] = useState(true);

  const playerRef = useRef<Player | null>(null);

  function initializePlayer(mediaElement: HTMLElement) {
    if (playerRef.current) return; // Already initialized

    const newPlayer = new Player({
      app: { token },
      mediaElement,
    });

    newPlayer.addListener({
      onVideoReady: (v: IVideo) => {
        console.log('video ready', v);
      },
      onTimerReady: (t: Timer) => {
        console.log('timer ready', t);
        setIsLoading(false);
      },
      onTimeUpdate: (pos: number) => {
        currentPosRef.current = pos;
        // const currentBeat = newPlayer.findBeat(pos);
        // if (currentBeat && currentBeat !== prevBeatRef.current) {
        //   setBeat(currentBeat);
        //   prevBeatRef.current = currentBeat;
        // }

        // const nextChar = prevCharRef.current?.next || playerRef.current?.video?.firstChar;
        // if(nextChar && nextChar.startTime < pos + LYRICS_OFFSET_MS) {
        //   setChar(nextChar);
        //   prevCharRef.current = nextChar;
        // }
      },
    });

    playerRef.current = newPlayer;

    // Load first song if selected
    if (selectedSong !== null && selectedSong < SONGS.length) {
      loadSong(SONGS[selectedSong].url);
    }
  }

  function loadSong(url: string) {
    if (playerRef.current) {
      playerRef.current.createFromSongUrl(url);
    }
  }

  function play() {
    if (playerRef.current) {
      return playerRef.current.requestPlay();
    }
    return false;
  }

  function pause() {
    if (playerRef.current) {
      return playerRef.current.requestPause();
    }
    return false;
  }

  function stop() {
    if (playerRef.current) {
      return playerRef.current.requestStop();
    }
    return false;
  }

  function seek(posMs: number) {
    if (playerRef.current) {
      playerRef.current.requestMediaSeek(posMs);
    }
  }

  function findCurrentBeat(): IBeat | null {
    return playerRef.current?.findBeat(playerRef.current?.mediaPosition ?? 0) ?? null;
  }

  function findCurrentChorus(): IRepetitiveSegment | null {
    return playerRef.current?.findChorus(playerRef.current?.mediaPosition ?? 0) ?? null;
  }

  function selectSong(index: number) {
    if(playerRef.current?.isPlaying) {
      playerRef.current.requestStop();
    }
    setIsLoading(true);
    if (index >= 0 && index < SONGS.length) {
      setSelectedSong(index);
      setFireworkSeed(Math.random() * 0xFFFFFFFF | 0);
      loadSong(SONGS[index].url);
    }
  }

  return (
    <PlayerContext.Provider
      value={{
        playerRef,
        fireworkSeed,
        isLoading,
        selectedSong,
        play,
        pause,
        stop,
        seek,
        selectSong,
        initializePlayer,
        findCurrentBeat,
        findCurrentChorus,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
