
import { useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerContext } from '@/context/PlayerContext';
import { motion } from 'framer-motion';

interface SongCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  previewAvailable?: boolean;
  mood: string;
}

const SongCard = ({ 
  id, 
  title, 
  artist, 
  thumbnailUrl, 
  previewAvailable = true ,
  mood
}: SongCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const { playSong, currentSongId } = usePlayerContext();
  const isPlaying = currentSongId === id;
  
  const handlePlayClick =  async (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(id, title, artist, thumbnailUrl);

    const mood1 = mood;

    // History details to save
    const historyData = {
        artist: artist,             // Song artist
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        time: new Date().toLocaleTimeString(),       // Current time in HH:MM:SS AM/PM formattime:,
        songTitle: title,
        mood: mood                     // Mood from props
    };

    // Get JWT token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found');
        return;
    }

    try {
        const response = await fetch('http://localhost:5050/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Send token for authentication
            },
            body: JSON.stringify(historyData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to add history:', errorData.message);
            return;
        }

        const result = await response.json();
        console.log('History added successfully:', result);
    } catch (error) {
        console.error('Error adding history:', error);
    }
  };
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="music-card"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="music-card-hover">
          <button 
            onClick={handlePlayClick}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-transform duration-300 hover:scale-110"
            disabled={!previewAvailable}
          >
            <Play size={20} fill="white" />
          </button>
        </div>
        <button 
          onClick={handleLikeClick}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
            isLiked ? "bg-white text-red-500" : "bg-black/30 text-white hover:text-red-400"
          )}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-2">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        <p className="text-xs text-muted-foreground truncate">{artist}</p>
        {previewAvailable && (
          <p className="text-xs text-blue-400 mt-1">Preview Available</p>
        )}
      </div>
    </motion.div>
  );
};

export default SongCard;
