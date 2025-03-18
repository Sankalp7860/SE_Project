
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MoodCardProps {
  icon: React.ReactNode;
  mood: string;
  description: string;
  color: string;
  isSelected?: boolean;
  onClick: () => void;
}

const MoodCard = ({ icon, mood, description, color, isSelected = false, onClick }: MoodCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const baseClasses = cn(
    'glassmorphism mood-card group',
    isSelected && 'mood-card-active',
  );
  
  const getBgColor = () => {
    if (isSelected) return `bg-${color}/20`;
    return isHovered ? `bg-${color}/10` : 'bg-transparent';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`${baseClasses} ${getBgColor()}`}
      onClick={onClick}
    >
      <div className={`text-${color} mb-3 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="font-medium text-lg mb-2">{mood}</h3>
      <p className="text-xs text-center text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default MoodCard;
