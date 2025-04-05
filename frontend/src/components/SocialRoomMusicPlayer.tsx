import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Search, Music, RotateCw, Clock, Heart, Disc, ListMusic, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { formatTime } from '@/utils/formatTime';
import { searchSongs, Song, searchSongsByMood } from '@/utils/youtubeApi';
import { toast } from 'sonner';
import SongCard from './SongCard';
import { useAuth } from "@/context/AuthContext";

interface SocialRoomMusicPlayerProps {
  isHost: boolean;
  roomId: string;
  socket: any;
  onSongChange?: (song: Song) => void;
  roomMood?: string;
}

const SocialRoomMusicPlayer = ({ isHost, roomId, socket, onSongChange, roomMood }: SocialRoomMusicPlayerProps) => {
  const { user } = useAuth();
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [playHistory, setPlayHistory] = useState<Song[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    playSong,
    playQueue,
    currentSongIndex
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

  // Load recommended songs based on room mood
  useEffect(() => {
    if (isHost && roomMood) {
      loadRecommendedSongs();
    }
  }, [isHost, roomMood]);

  const loadRecommendedSongs = async () => {
    if (!roomMood) return;

    try {
      const songs = await searchSongsByMood(roomMood);
      setRecommendedSongs(songs);
    } catch (error) {
      console.error('Error loading recommended songs:', error);
    }
  };

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

      // Update play history
      if (currentSongId && currentSongTitle) {
        const currentSong = {
          id: currentSongId,
          title: currentSongTitle,
          artist: currentSongArtist,
          thumbnailUrl: currentSongThumbnail,
          description: ''
        };
        setPlayHistory(prev => [currentSong, ...prev.slice(0, 9)]);
      }

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

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
  };

  // Handle song search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !isHost) return;

    setIsSearching(true);

    try {
      const results = await searchSongs(searchQuery);
      setSearchResults(results);

      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
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

    // Add to play history
    setPlayHistory(prev => [song, ...prev.slice(0, 9)]);

    // Emit song update to socket directly
    socket.emit('update_song', {
      roomId,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnailUrl
      }
    });

    // Also call the onSongChange callback for parent component handling
    if (onSongChange) {
      onSongChange(song);
    }

    // Close search panel
    setShowSearchPanel(false);
  };

  // Add song to queue
  const handleAddToQueue = (song: Song) => {
    if (!isHost) return;

    setQueue(prev => [...prev, song]);
    toast.success(`Added to queue: ${song.title}`);
  };

  // Play song from queue
  const playFromQueue = (index: number) => {
    if (!isHost || queue.length === 0) return;

    const song = queue[index];
    handlePlaySong(song);

    // Remove from queue
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Remove song from queue
  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Listen for socket events from other users
  useEffect(() => {
    if (!socket) return;

    if (!isHost) {
      // Listen for playback state updates (for non-hosts)
      socket.on('playback_state_updated', (data: { isPlaying: boolean, currentTime: number }) => {
        console.log('Received playback state update:', data);
        setIsPlaying(data.isPlaying);
        if (data.currentTime) {
          seekTo(data.currentTime);
        }
      });

      // Listen for playback time updates (for non-hosts)
      socket.on('playback_time_updated', (data: { currentTime: number }) => {
        console.log('Received playback time update:', data.currentTime);
        seekTo(data.currentTime);
      });
    }

    // Clean up event listeners
    return () => {
      socket.off('playback_state_updated');
      socket.off('playback_time_updated');
      socket.off('song_updated');
    };
  }, [isHost, socket, seekTo, setIsPlaying]);

  // Sync playback time with other users periodically
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;

    if (isHost && socket) {
      // More frequent sync when playing, less frequent when paused
      const syncIntervalTime = isPlaying ? 5000 : 15000; // 5 seconds when playing, 15 when paused

      syncInterval = setInterval(() => {
        // Always send current playback state and time
        socket.emit('update_playback_state', {
          roomId,
          isPlaying,
          currentTime
        });

        // Also send a separate time update for better seeking precision
        if (isPlaying) {
          socket.emit('update_playback_time', {
            roomId,
            currentTime
          });
        }
      }, syncIntervalTime);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isHost, isPlaying, currentTime, socket, roomId]);

  // Focus search input when search panel is opened
  useEffect(() => {
    if (showSearchPanel && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearchPanel]);

  if (!currentSongId) return null;

  return (
    <div className="relative">
      {/* Main Player */}
      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-lg">
        <div className="flex flex-col space-y-4">
          {/* Song Info */}
          <div className="flex items-center space-x-4">
            <img
              src={currentSongThumbnail}
              alt={currentSongTitle}
              className="w-16 h-16 rounded-md object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium truncate">{currentSongTitle}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentSongArtist}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center w-full space-x-2">
            <span className="text-xs">{formatTime(currentTime)}</span>
            <div
              className={cn(
                "h-2 bg-white/20 rounded-full flex-1 relative",
                isHost ? "cursor-pointer" : "cursor-default"
              )}
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-blue-500 rounded-full absolute top-0 left-0"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs">{formatTime(duration)}</span>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkipPrevious}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isHost ? "hover:text-white" : "opacity-50 cursor-not-allowed"
                )}
                disabled={!isHost}
                title="Previous"
              >
                <SkipBack size={22} />
              </button>
              
              <button
                onClick={handlePlayPause}
                className={cn(
                  "bg-white text-black p-3 rounded-full transition-all",
                  isHost ? "hover:bg-blue-500 hover:text-white" : "opacity-80"
                )}
                disabled={!isHost}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
              </button>
              
              <button
                onClick={handleSkipNext}
                className={cn(
                  "text-muted-foreground transition-colors",
                  isHost ? "hover:text-white" : "opacity-50 cursor-not-allowed"
                )}
                disabled={!isHost}
                title="Next"
              >
                <SkipForward size={22} />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Volume Control */}
              <div className="relative group">
                <button
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-md p-3 w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div className="py-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Search Button (Host Only) */}
              {isHost && (
                <button
                  onClick={() => setShowSearchPanel(!showSearchPanel)}
                  className="text-muted-foreground hover:text-white transition-colors"
                  title="Search Songs"
                >
                  <Search size={20} />
                </button>
              )}
              
              {/* Stop Button (Host Only) */}
              {isHost && (
                <button
                  onClick={() => {
                    // Stop local playback
                    stopPlayback();
                    
                    // Notify other users that playback has stopped
                    socket.emit('update_playback_state', {
                      roomId,
                      isPlaying: false,
                      currentTime: 0
                    });
                  }}
                  className="text-muted-foreground hover:text-white transition-colors"
                  title="Stop Playback"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Panel */}
      <AnimatePresence>
        {showSearchPanel && isHost && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full mb-4 w-full bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-4 max-h-[500px] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Music Library</h3>
              <button 
                onClick={() => setShowSearchPanel(false)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('search')}
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  activeTab === 'search' ? "border-b-2 border-blue-500 text-blue-500" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Search size={16} />
                  <span>Search</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('recommended')}
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  activeTab === 'recommended' ? "border-b-2 border-blue-500 text-blue-500" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Music size={16} />
                  <span>Recommended</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('queue')}
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  activeTab === 'queue' ? "border-b-2 border-blue-500 text-blue-500" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <ListMusic size={16} />
                  <span>Queue</span>
                  {queue.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {queue.length}
                    </span>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  activeTab === 'history' ? "border-b-2 border-blue-500 text-blue-500" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <History size={16} />
                  <span>History</span>
                </div>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {/* Search Tab */}
              {activeTab === 'search' && (
                <div className="h-full flex flex-col">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                    }}
                    className="flex items-center space-x-2 mb-4"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for songs..."
                      className="flex-1 h-10 rounded-md bg-secondary/50 border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim() || isSearching}
                      className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  
                  {/* Rest of search tab content */}
                </div>
              )}
              
              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="h-full overflow-y-auto">
                  <h4 className="text-sm font-medium mb-3">Recently Played</h4>
                  
                  {playHistory.length > 0 ? (
                    <div className="space-y-2">
                      {playHistory.map((song, index) => (
                        <div key={`${song.id}-${index}`} className="flex items-center bg-secondary/20 rounded-lg p-2">
                          <img
                            src={song.thumbnailUrl}
                            alt={song.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="ml-3 flex-1 overflow-hidden">
                            <h4 className="font-medium text-sm truncate">{song.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => handlePlaySong(song)}
                                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                              >
                                <Play size={12} className="mr-1" />
                                Play
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <History className="text-muted-foreground mb-2" size={32} />
                      <p className="text-muted-foreground">No play history yet</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Other tabs content */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialRoomMusicPlayer;