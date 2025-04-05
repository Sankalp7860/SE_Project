import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { formatTime } from '@/utils/formatTime';
import { searchSongs, Song } from '@/utils/youtubeApi';
import { toast } from 'sonner';
import SongCard from './SongCard';

interface SocialRoomMusicPlayerProps {
  isHost: boolean;
  roomId: string;
  socket: any;
  onSongChange?: (song: Song) => void;
}

const SocialRoomMusicPlayer = ({ isHost, roomId, socket, onSongChange }: SocialRoomMusicPlayerProps) => {
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { 
    currentSongId, 
    currentSongTitle, 
    currentSongArtist, 
    currentSongThumbnail,
    isPlaying,
    setIsPlaying,
    stopPlayback,
    playNext,
    playPrevious,
    playSong
  } = usePlayerContext();

  const {
    currentTime,
    duration,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    seekTo
  } = useYouTubePlayer({
    videoId: currentSongId,
    isPlaying,
  });

  // Handle play/pause
  const handlePlayPause = () => {
    if (isHost) {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      
      // Emit play/pause event to other users
      socket.emit('update_playback_state', {
        roomId,
        isPlaying: newPlayingState,
        currentTime: currentTime
      });
    }
  };

  // Handle skip next
  const handleSkipNext = () => {
    if (isHost) {
      playNext();
      
      // Emit song change event to other users
      if (onSongChange && currentSongId) {
        onSongChange({
          id: currentSongId,
          title: currentSongTitle,
          artist: currentSongArtist,
          thumbnailUrl: currentSongThumbnail,
          description: ''
        });
      }
    }
  };

  // Handle skip previous
  const handleSkipPrevious = () => {
    if (isHost) {
      playPrevious();
      
      // Emit song change event to other users
      if (onSongChange && currentSongId) {
        onSongChange({
          id: currentSongId,
          title: currentSongTitle,
          artist: currentSongArtist,
          thumbnailUrl: currentSongThumbnail,
          description: ''
        });
      }
    }
  };

  // Handle progress click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !isHost) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    seekTo(newTime);
    
    // Emit seek event to other users
    socket.emit('update_playback_time', {
      roomId,
      currentTime: newTime
    });
  };

  // Handle volume click
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(100, Math.round(percent * 100)));
    
    setVolume(newVolume);
  };

  // Handle song search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !isHost) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const results = await searchSongs(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching songs:', error);
      toast.error('Failed to search songs');
    } finally {
      setIsSearching(false);
    }
  };

  // Play a song (for room host)
  const handlePlaySong = (song: Song) => {
    if (!isHost || !roomId) return;
    
    // Play the song locally
    playSong(song.id, song.title, song.artist, song.thumbnailUrl);
    
    // Emit song update to socket
    if (onSongChange) {
      onSongChange(song);
    }
    
    // Clear search results
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Listen for socket events from other users
  useEffect(() => {
    if (!isHost && socket) {
      // Listen for playback state updates
      socket.on('playback_state_updated', (data: { isPlaying: boolean, currentTime: number }) => {
        setIsPlaying(data.isPlaying);
        if (data.currentTime) {
          seekTo(data.currentTime);
        }
      });
      
      // Listen for playback time updates
      socket.on('playback_time_updated', (data: { currentTime: number }) => {
        seekTo(data.currentTime);
      });
      
      return () => {
        socket.off('playback_state_updated');
        socket.off('playback_time_updated');
      };
    }
  }, [isHost, socket, seekTo, setIsPlaying]);

  // Sync playback time with other users periodically
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;
    
    if (isHost && isPlaying && socket) {
      syncInterval = setInterval(() => {
        socket.emit('update_playback_time', {
          roomId,
          currentTime
        });
      }, 10000); // Sync every 10 seconds
    }
    
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isHost, isPlaying, currentTime, socket, roomId]);

  if (!currentSongId) return null;

  return (
    <div className="relative">
      <AnimatePresence>
        {showSearchResults && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full mb-2 w-full bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-4 max-h-[400px] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              <button 
                onClick={() => setShowSearchResults(false)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map((song) => (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    title={song.title}
                    artist={song.artist}
                    thumbnailUrl={song.thumbnailUrl}
                    mood=""
                    onClick={() => handlePlaySong(song)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No results found. Try a different search.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-black/80 backdrop-blur-md border-t border-white/10 p-3 rounded-lg"
      >
        <div className="flex items-center justify-between">
          {/* Song info */}
          <div className="flex items-center space-x-3">
            <img 
              src={currentSongThumbnail} 
              alt={currentSongTitle}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="hidden sm:block">
              <h4 className="text-sm font-medium truncate max-w-[150px]">{currentSongTitle}</h4>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{currentSongArtist}</p>
            </div>
          </div>
          
          {/* Player controls */}
          <div className="flex flex-col items-center flex-1 max-w-md px-4">
            <div className="flex items-center space-x-4 mb-1">
              <button 
                onClick={handleSkipPrevious}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isHost ? "hover:text-white" : "opacity-50 cursor-not-allowed"
                )}
                disabled={!isHost}
              >
                <SkipBack size={20} />
              </button>
              <button 
                onClick={handlePlayPause}
                className={cn(
                  "bg-white text-black p-2 rounded-full transition-all",
                  isHost ? "hover:bg-blue-500 hover:text-white" : "opacity-80"
                )}
                disabled={!isHost}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <button 
                onClick={handleSkipNext}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isHost ? "hover:text-white" : "opacity-50 cursor-not-allowed"
                )}
                disabled={!isHost}
              >
                <SkipForward size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="flex items-center w-full space-x-2">
              <span className="text-xs">{formatTime(currentTime)}</span>
              <div 
                className={cn(
                  "h-1.5 bg-white/20 rounded-full flex-1",
                  isHost ? "cursor-pointer" : "cursor-default"
                )}
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs">{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {isHost && (
              <button 
                onClick={() => setShowSearchResults(true)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <Search size={20} />
              </button>
            )}
            
            <button 
              onClick={toggleMute} 
              className="text-muted-foreground hover:text-white transition-colors"
              onMouseEnter={() => setVolumeVisible(true)}
              onMouseLeave={() => setVolumeVisible(false)}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <div 
              className="h-1.5 bg-white/20 rounded-full w-24 cursor-pointer"
              onClick={handleVolumeClick}
              onMouseEnter={() => setVolumeVisible(true)}
              onMouseLeave={() => setVolumeVisible(false)}
            >
              <div 
                className={cn("h-full rounded-full", isMuted ? "bg-muted" : "bg-blue-500")}
                style={{ width: `${volume}%` }}
              />
            </div>
            
            {isHost && (
              <button 
                onClick={stopPlayback} 
                className="text-muted-foreground hover:text-white ml-2"
              >
                <X size={20} />
              </button>
            )}
            
            {/* Search input for host */}
            {isHost && showSearchResults && (
              <div className="absolute top-full mt-2 right-0 w-full max-w-md">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for songs..."
                    className="flex-1 h-10 rounded-md bg-secondary/50 border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialRoomMusicPlayer;