
import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';

interface PlayerContextType {
  currentSongId: string | null;
  currentSongTitle: string;
  currentSongArtist: string;
  currentSongThumbnail: string;
  isPlaying: boolean;
  playSong: (id: string, title: string, artist: string, thumbnail: string) => void;
  stopPlayback: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentSongTitle, setCurrentSongTitle] = useState('');
  const [currentSongArtist, setCurrentSongArtist] = useState('');
  const [currentSongThumbnail, setCurrentSongThumbnail] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (id: string, title: string, artist: string, thumbnail: string) => {
    setCurrentSongId(id);
    setCurrentSongTitle(title);
    setCurrentSongArtist(artist);
    setCurrentSongThumbnail(thumbnail);
    setIsPlaying(true);
    
    toast.success(`Now playing: ${title}`, {
      description: artist,
      duration: 3000,
    });
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentSongId(null);
    setCurrentSongTitle('');
    setCurrentSongArtist('');
    setCurrentSongThumbnail('');
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSongId,
        currentSongTitle,
        currentSongArtist,
        currentSongThumbnail,
        isPlaying,
        playSong,
        stopPlayback,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
