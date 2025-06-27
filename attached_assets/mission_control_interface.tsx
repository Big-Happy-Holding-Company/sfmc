import React, { useState, useCallback } from 'react';

const MissionControlInterface = () => {
  const [toggleBoxActive, setToggleBoxActive] = useState(false);
  const [switchActive, setSwitchActive] = useState(false);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [completedTasks] = useState(12);
  const [totalTasks] = useState(45);

  // Simple sound generation using Web Audio API
  const playSound = useCallback((frequency, duration = 100, type = 'beep') => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type === 'beep' ? 'sine' : 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }, []);

  const handleToggleBox = () => {
    setToggleBoxActive(!toggleBoxActive);
    playSound(toggleBoxActive ? 400 : 600, 150);
  };

  const handleSwitch = () => {
    setSwitchActive(!switchActive);
    playSound(switchActive ? 300 : 500, 200);
  };

  const handleBubble = () => {
    setBubbleActive(!bubbleActive);
    playSound(800, 80);
    setTimeout(() => setBubbleActive(false), 200);
  };

  const handlePipClick = () => {
    playSound(700, 120);
  };

  // Generate progress dots for task completion
  const renderProgressDots = () => {
    const dots = [];
    const maxDots = 10;
    const filledDots = Math.round((completedTasks / totalTasks) * maxDots);
    
    for (let i = 0; i < maxDots; i++) {
      dots.push(
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < filledDots 
              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' 
              : 'bg-gray-600 border border-gray-500'
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Toggle Box - Upper Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={handleToggleBox}
          className={`w-16 h-16 rounded-lg border-2 transition-all duration-300 ${
            toggleBoxActive
              ? 'bg-cyan-500 border-cyan-300 shadow-lg shadow-cyan-500/50'
              : 'bg-slate-700 border-slate-500 hover:border-slate-400'
          }`}
        >
          <div className={`text-2xl transition-transform duration-300 ${
            toggleBoxActive ? 'rotate-90 scale-110' : ''
          }`}>
            ⚡
          </div>
        </button>
      </div>

      {/* PIP - Upper Right */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={handlePipClick}
          className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-lg p-3 hover:border-cyan-500 transition-all duration-300"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="text-lg">🎯</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {renderProgressDots()}
          </div>
        </button>
      </div>

      {/* Bubble - Lower Left */}
      <div className="absolute bottom-6 left-6 z-10">
        <button
          onClick={handleBubble}
          className={`w-20 h-20 rounded-full border-2 transition-all duration-200 ${
            bubbleActive
              ? 'bg-blue-500 border-blue-300 shadow-2xl shadow-blue-500/50 scale-110'
              : 'bg-slate-700/80 border-slate-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/30'
          }`}
        >
          <div className={`text-3xl transition-all duration-200 ${
            bubbleActive ? 'animate-bounce' : ''
          }`}>
            🚀
          </div>
        </button>
      </div>

      {/* Switch - Lower Right */}
      <div className="absolute bottom-6 right-6 z-10">
        <button
          onClick={handleSwitch}
          className={`w-24 h-12 rounded-full border-2 transition-all duration-300 relative ${
            switchActive
              ? 'bg-green-600 border-green-400'
              : 'bg-slate-700 border-slate-500'
          }`}
        >
          <div
            className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
              switchActive ? 'left-14' : 'left-1'
            }`}
          >
            <span className="text-sm">
              {switchActive ? '🔒' : '🔧'}
            </span>
          </div>
        </button>
      </div>

      {/* Central System Grid */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="grid grid-cols-3 gap-8 p-8">
          {/* Navigation */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🧭</span>
            </div>
          </div>

          {/* Rocket Systems */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🚀</span>
            </div>
          </div>

          {/* Power */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">⚡</span>
            </div>
          </div>

          {/* Communications */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📡</span>
            </div>
          </div>

          {/* Central Hub */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border-2 border-cyan-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:from-cyan-500/30 hover:to-blue-500/30 hover:scale-105 animate-pulse">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🛸</span>
            </div>
          </div>

          {/* Tools */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🔧</span>
            </div>
          </div>

          {/* Security */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🔒</span>
            </div>
          </div>

          {/* Analytics */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📊</span>
            </div>
          </div>

          {/* Maintenance */}
          <div className="group cursor-pointer">
            <div className="w-24 h-24 bg-slate-800/60 backdrop-blur-sm border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700/60 hover:scale-105">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🛠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default MissionControlInterface;