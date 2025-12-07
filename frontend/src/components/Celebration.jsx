import React, { useState, useEffect, useMemo } from 'react';

const Celebration = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [fireworks, setFireworks] = useState([]);


  // Effects to trigger confetti + fireworks
  useEffect(() => {
    const pieces = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#FF1744', '#00E676'];

    // Left confetti cannon
    for (let i = 0; i < 75; i++) {
      const angle = -60 - Math.random() * 60;
      pieces.push({
        id: `left-${i}`,
        startX: -5,
        startY: 100,
        angle,
        velocity: 600 + Math.random() * 400,
        animationDuration: 3 + Math.random() * 2.5,
        animationDelay: Math.random() * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 10,
        rotation: Math.random() * 360,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }

    // Right confetti cannon
    for (let i = 0; i < 75; i++) {
      const angle = -120 - Math.random() * 60;
      pieces.push({
        id: `right-${i}`,
        startX: 105,
        startY: 100,
        angle,
        velocity: 600 + Math.random() * 400,
        animationDuration: 3 + Math.random() * 2.5,
        animationDelay: Math.random() * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 10,
        rotation: Math.random() * 360,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      });
    }

    setConfettiPieces(pieces);

    // Generate fireworks
    const fwArray = [];
    const fireworkColors = ['#FF6B6B', '#4ECDC4', '#FFD700', '#FF1744', '#00E676', '#BB8FCE', '#FFA07A'];
    for (let i = 0; i < 12; i++) {
      const x = 20 + Math.random() * 60;
      const y = 10 + Math.random() * 40;
      const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
      const delay = Math.random() * 4;

      const particles = [];
      for (let j = 0; j < 30; j++) {
        const angle = (Math.PI * 2 * j) / 30;
        particles.push({
          id: `fw-${i}-${j}`,
          angle,
          distance: 80 + Math.random() * 40
        });
      }

      fwArray.push({ id: `fw-${i}`, x, y, color, delay, particles });
    }
    setFireworks(fwArray);

    // Auto-hide after 6 sec
    const timer = setTimeout(() => setIsVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Fireworks */}
      {fireworks.map((fw) => (
        <div key={fw.id} className="absolute" style={{ left: `${fw.x}%`, top: `${fw.y}%` }}>
          {fw.particles.map((p) => {
            const endX = Math.cos(p.angle) * p.distance;
            const endY = Math.sin(p.angle) * p.distance;
            return (
              <div
                key={p.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: fw.color,
                  boxShadow: `0 0 10px ${fw.color}`,
                  animation: `fw-${p.id} 1s ease-out ${fw.delay}s forwards`
                }}
              >
                <style>{`
                  @keyframes fw-${p.id} {
                    0% { transform: translate(0,0); opacity:1; }
                    100% { transform: translate(${endX}px, ${endY}px); opacity:0; }
                  }
                `}</style>
              </div>
            );
          })}
        </div>
      ))}

      {/* Confetti */}
      {confettiPieces.map(piece => {
        const rad = (piece.angle * Math.PI) / 180;
        const endX = piece.startX + (Math.cos(rad) * piece.velocity) / 10;
        const endY = piece.startY + (Math.sin(rad) * piece.velocity) / 10;
        return (
          <div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.startX}%`,
              top: `${piece.startY}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '0',
              animation: `conf-${piece.id} ${piece.animationDuration}s ease-out ${piece.animationDelay}s forwards`,
              transform: `rotate(${piece.rotation}deg)`
            }}
          >
            <style>{`
              @keyframes conf-${piece.id} {
                0% { opacity:1; transform: translate(0,0) rotate(${piece.rotation}deg); }
                100% { opacity:0; transform: translate(${(endX - piece.startX) * 10}px, ${(endY - piece.startY) * 10}px) rotate(${piece.rotation + 720}deg); }
              }
            `}</style>
          </div>
        );
      })}

      {/* Celebration Text */}
      <div className="relative z-10 text-center animate-bounce-in">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight animate-text-glow"
          style={{
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #FFA07A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
          {"Congratulations! on Completing Your Milestone!"}
        </h1>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes text-glow {
          0%, 100% { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
          50% { filter: drop-shadow(0 4px 20px rgba(255,255,255,0.8)); }
        }
        .animate-bounce-in { animation: bounce-in 0.7s ease-out; }
        .animate-text-glow { animation: text-glow 2s infinite; }
      `}</style>
    </div>
  );
};

export default Celebration;
