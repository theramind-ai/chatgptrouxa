'use client';

export default function MeltingCorner() {
  return (
    <div className="hidden md:block fixed top-0 right-0 w-32 h-32 pointer-events-none z-50 overflow-hidden">
      <div className="w-full h-full bg-amber-400 opacity-90 animate-melt origin-top"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 80% 60%, 60% 90%, 40% 50%, 20% 80%, 0 40%)',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
        }}>
      </div>
      <style jsx>{`
        @keyframes melt {
          0% { transform: scaleY(0.8); }
          50% { transform: scaleY(1.2); }
          100% { transform: scaleY(0.8); }
        }
        .animate-melt {
          animation: melt 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
