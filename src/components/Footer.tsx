import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { AudioControls } from './AudioControls';
import { SongSelection } from './SongSelection';
import { usePlayer } from '../contexts/PlayerContext';

export function Footer() {
  const [showSongSelection, setShowSongSelection] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const { initializePlayer } = usePlayer();

  useEffect(() => {
    if (mediaRef.current) {
      initializePlayer(mediaRef.current);
    }
  }, [initializePlayer]);

  useLayoutEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    function equalize() {
      if (window.innerWidth < 640) {
        left!.style.minWidth = '';
        right!.style.minWidth = '';
        return;
      }
      const maxW = Math.max(left!.offsetWidth, right!.offsetWidth);
      const target = `${maxW}px`;
      if (left!.style.minWidth !== target) left!.style.minWidth = target;
      if (right!.style.minWidth !== target) right!.style.minWidth = target;
    }

    equalize();
    const ro = new ResizeObserver(equalize);
    ro.observe(left);
    ro.observe(right);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <footer className="bg-gray-900 text-white border-t border-gray-700">
        {/* Toggle button */}
        <div className="flex justify-center">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="px-4 py-0.5 text-gray-400 hover:text-white transition-colors text-xs leading-none"
            title={collapsed ? 'Show controls' : 'Hide controls'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <polyline points="18 15 12 9 6 15" />
                : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </button>
        </div>

        <div className={"flex flex-col sm:flex-row items-center max-w-6xl mx-auto gap-4 px-4 pb-4" + (collapsed ? ' hidden' : '')}>
          {/* Media div on the left */}
          <div ref={leftRef} className="shrink-0">
            <div ref={mediaRef} />
          </div>

          {/* AudioControls in the middle */}
          <div className="flex-1 min-w-0">
            <AudioControls />
          </div>

          {/* Music icon on the right */}
          <div ref={rightRef} className="shrink-0 flex justify-end">
            <button
              onClick={() => setShowSongSelection(!showSongSelection)}
              className="hover:text-blue-400 transition-colors"
              title="Select a song"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Song Selection Modal */}
      {showSongSelection && <SongSelection onExit={() => setShowSongSelection(false)} />}
    </>
  );
};
