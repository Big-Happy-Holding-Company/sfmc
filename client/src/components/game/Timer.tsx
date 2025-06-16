import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp?: () => void;
  isActive?: boolean;
}

export function Timer({ initialTime, onTimeUp, isActive = true }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    setTimeRemaining(initialTime);
    setHasExpired(false);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive || hasExpired || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setHasExpired(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasExpired, timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "border rounded px-3 py-2",
      hasExpired 
        ? "bg-red-500 bg-opacity-20 border-red-500 animate-pulse"
        : timeRemaining <= 10 
        ? "bg-red-500 bg-opacity-20 border-red-500"
        : "bg-red-500 bg-opacity-20 border-red-500"
    )}>
      <div className={cn(
        "font-mono font-bold text-lg",
        hasExpired ? "text-red-400" : "text-red-400"
      )}>
        {formatTime(timeRemaining)}
      </div>
      <div className="text-xs text-red-400 opacity-75">REMAINING</div>
    </div>
  );
}
