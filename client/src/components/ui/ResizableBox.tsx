// src/components/ui/ResizableBox.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizableBoxProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function ResizableBox({ 
  children, 
  className = '', 
  minWidth = 200, 
  maxWidth = 1600, 
  minHeight = 150,
  maxHeight = 1000
}: ResizableBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number | null, height: number | null }>({ width: null, height: null });
  const resizeDirection = useRef<'x' | 'y' | 'xy' | null>(null);

  useEffect(() => {
    if (containerRef.current && size.width === null && size.height === null) {
      setSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, [size.width, size.height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: 'x' | 'y' | 'xy') => {
    e.preventDefault();
    resizeDirection.current = direction;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizeDirection.current) {
      setSize(prevSize => {
        let newWidth = prevSize.width || 0;
        let newHeight = prevSize.height || 0;

        if (resizeDirection.current?.includes('x')) {
          newWidth += e.movementX;
        }
        if (resizeDirection.current?.includes('y')) {
          newHeight += e.movementY;
        }

        const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

        return { width: constrainedWidth, height: constrainedHeight };
      });
    }
  }, [minWidth, maxWidth, minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    resizeDirection.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: size.width ? `${size.width}px` : '100%', height: size.height ? `${size.height}px` : 'auto' }}>
      <div className="w-full h-full overflow-auto">
        {children}
      </div>
      {/* Horizontal Resizer */}
      <div 
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize bg-slate-600/50 hover:bg-amber-500 transition-colors duration-200 z-10"
        onMouseDown={(e) => handleMouseDown(e, 'x')}
      />
      {/* Vertical Resizer */}
      <div 
        className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize bg-slate-600/50 hover:bg-amber-500 transition-colors duration-200 z-10"
        onMouseDown={(e) => handleMouseDown(e, 'y')}
      />
      {/* Corner Resizer */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-slate-700 hover:bg-amber-600 transition-colors duration-200 z-20 border-l-2 border-t-2 border-slate-600 rounded-tl-lg"
        onMouseDown={(e) => handleMouseDown(e, 'xy')}
      />
    </div>
  );
}
