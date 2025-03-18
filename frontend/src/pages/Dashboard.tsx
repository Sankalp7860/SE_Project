
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import SearchBar from '@/components/SearchBar';
import HistoryItem from '@/components/HistoryItem';
import { toast } from 'sonner';
import { LogOut, Trash } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data for history
const mockHistory = [
  { 
    id: '1',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:49',
    songs: [
      { id: '1a', title: 'Happy Upbeat Pop', artist: 'UniqueSound' },
      { id: '1b', title: 'Summer Vibes', artist: 'HappyTunes' },
    ]
  },
  { 
    id: '2',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:49',
    songs: [
      { id: '2a', title: 'Sunny Day', artist: 'MoodBoost' },
    ]
  },
  { 
    id: '3',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:48',
    songs: [
      { id: '3a', title: 'Morning Energy', artist: 'DailyBeats' },
      { id: '3b', title: 'Positive Thinking', artist: 'MindfulMusic' },
    ]
  },
  { 
    id: '4',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:48',
    songs: [
      { id: '4a', title: 'Uplifting Melody', artist: 'SpiritSound' },
    ]
  },
  { 
    id: '5',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:48',
    songs: [
      { id: '5a', title: 'Joyful Morning', artist: 'DawnMusic' },
    ]
  },
  { 
    id: '6',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:48',
    songs: [
      { id: '6a', title: 'Cheerful Day', artist: 'SunnyBeats' },
    ]
  },
  { 
    id: '7',
    mood: 'Happy', 
    date: '10/03/2025', 
    time: '19:46',
    songs: [
      { id: '7a', title: 'Feel Good', artist: 'PositiveVibes' },
    ]
  },
  { 
    id: '8',
    mood: 'Sad', 
    date: '10/03/2025', 
    time: '19:46',
    songs: [
      { id: '8a', title: 'Melancholy Memories', artist: 'DeepEmotions' },
    ]
  },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState(mockHistory);
  
  const handleClearHistory = () => {
    toast.success('History cleared successfully');
    setHistory([]);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };
  
  // Protect route
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-white/10 p-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Logo />
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore
              </Link>
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-foreground transition-colors"
              >
                History
              </Link>
            </nav>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>
      
      {/* Search bar */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-b border-white/10 p-4">
        <SearchBar />
      </div>
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 max-w-screen-xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Your Dashboard</h1>
            <p className="text-muted-foreground">
              Track your mood and music recommendation history.
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClearHistory}
            className="mt-4 md:mt-0 px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <Trash size={16} />
            <span>Clear history</span>
          </motion.button>
        </div>
        
        {/* History list */}
        <div className="space-y-4">
          {history.length > 0 ? (
            history.map((item) => (
              <HistoryItem
                key={item.id}
                mood={item.mood}
                date={item.date}
                time={item.time}
                songs={item.songs}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No history available</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
