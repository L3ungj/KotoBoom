import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { SONGS } from '../songs';

interface SongSelectionProps {
  onExit: () => void;
}

export const SongSelection: React.FC<SongSelectionProps> = ({ onExit }) => {
  const { selectedSong, selectSong } = usePlayer();
  const [tempSelectedSong, setTempSelectedSong] = useState<number | null>(selectedSong);

  const handleSongSelect = (index: number) => {
    setTempSelectedSong(index);
  };

  const handleOK = () => {
    if (tempSelectedSong !== null) {
      selectSong(tempSelectedSong);
    }
    onExit();
  };

  const handleCancel = () => {
    setTempSelectedSong(selectedSong);
    onExit();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto text-white">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h1 className="text-2xl font-bold">曲を選ぶ</h1>
            <p className="text-xs text-gray-400 mt-0.5">Choose a song</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-2xl font-bold text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SONGS.map((song, index) => (
              <button
                key={index}
                onClick={() => handleSongSelect(index)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  tempSelectedSong === index
                    ? 'border-blue-400 bg-blue-900/40'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold">{song.title}</div>
                {song.engTitle && (
                  <div className="text-xs text-gray-400 mt-0.5">{song.engTitle}</div>
                )}
                <div className="text-sm text-gray-400 mt-2">{song.artist}</div>
                {song.engArtist && (
                  <div className="text-xs text-gray-500">{song.engArtist}</div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
            title="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={handleOK}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            title="OK"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
