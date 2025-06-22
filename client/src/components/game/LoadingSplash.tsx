/**
 * LoadingSplash Component
 * --------------------------------------------------------
 * Author: Cascade AI
 * Description: 
 *   A fun splash screen that displays when the app first loads.
 *   Features Master Chief Wyatt with animated space emojis and a percentage counter.
 *   Purely decorative - not tied to actual loading processes.
 */
import { useState, useEffect } from 'react';
import { SPACE_EMOJIS } from "@/constants/spaceEmojis";

interface LoadingSplashProps {
  onComplete: () => void;
  duration?: number; // Duration in ms (default 5000)
}

export function LoadingSplash({ onComplete, duration = 5000 }: LoadingSplashProps) {
  const [progress, setProgress] = useState(0);
  const [emojiRow, setEmojiRow] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  
  // Combine celestial emojis for a more interesting display
  const combinedEmojis = [
    ...SPACE_EMOJIS.celestial_set1.slice(1), 
    ...SPACE_EMOJIS.celestial_set2.slice(1)
  ];

  useEffect(() => {
    // Initialize emoji row
    setEmojiRow(combinedEmojis);
    
    // Set start time
    const startTime = Date.now();
    
    // Simple interval-based animation for more reliable progress updates
    // Update every 50ms for smoother animation
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(Math.floor((elapsed / duration) * 100), 100);
      
      // Update progress state
      setProgress(progressPercent);
      
      // Check if complete
      if (progressPercent >= 100) {
        clearInterval(progressInterval);
        
        // Start exit animation
        setIsExiting(true);
        
        // Call onComplete after exit animation finishes
        setTimeout(() => onComplete(), 700);
      }
    }, 50);
    
    // Emoji rotation on a separate interval for animation
    const emojiInterval = setInterval(() => {
      setEmojiRow(prev => {
        if (prev.length === 0) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(emojiInterval);
    };
  }, [onComplete, duration, combinedEmojis]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 
        ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative w-11/12 sm:w-4/5 max-w-md mx-auto mb-6 sm:mb-8">
        <img 
          src="/master-chief-wyatt.png" 
          alt="Master Chief Wyatt" 
          className="w-full h-auto object-contain max-h-[40vh] sm:max-h-[50vh]"
        />
        <div className="absolute -bottom-3 sm:-bottom-4 left-0 right-0 text-center">
          <span className="bg-black px-3 py-1 rounded-full text-amber-400 font-mono text-xs sm:text-sm">
            SPACE FORCE
          </span>
        </div>
      </div>
      
      <div className="w-11/12 sm:w-4/5 max-w-md mb-2">
        <div className="h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex space-x-1 text-lg sm:text-2xl mb-2 min-h-[2rem] overflow-hidden">
        {emojiRow.slice(0, 10).map((emoji, idx) => (
          <span key={idx} className="animate-pulse">{emoji}</span>
        ))}
      </div>
      
      <div className="text-cyan-400 font-mono text-sm sm:text-lg font-bold">
        {progress}% <span className="animate-pulse">▋</span>
      </div>
    </div>
  );
}
