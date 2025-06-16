import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SpeedTimerProps {
  isActive?: boolean;
  onReset?: () => void;
}

export function SpeedTimer({ isActive = true, onReset }: SpeedTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (onReset) {
      setElapsedTime(0);
    }
  }, [onReset]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (elapsedTime <= 30) return "text-green-400 border-green-400 bg-green-500";
    if (elapsedTime <= 60) return "text-amber-400 border-amber-400 bg-amber-500";
    if (elapsedTime <= 120) return "text-orange-400 border-orange-400 bg-orange-500";
    return "text-red-400 border-red-400 bg-red-500";
  };

  const getBonusText = () => {
    if (elapsedTime <= 30) return "SPEED BONUS";
    if (elapsedTime <= 60) return "GOOD TIME";
    if (elapsedTime <= 120) return "STANDARD";
    return "SLOW";
  };

  return (
    <div className={cn(
      "border rounded px-3 py-2 bg-opacity-20",
      getTimerColor()
    )}>
      <div className={cn(
        "font-mono font-bold text-lg",
        getTimerColor().split(' ')[0]
      )}>
        {formatTime(elapsedTime)}
      </div>
      <div className={cn(
        "text-xs opacity-75",
        getTimerColor().split(' ')[0]
      )}>
        {getBonusText()}
      </div>
    </div>
  );
}

export { SpeedTimer as Timer };