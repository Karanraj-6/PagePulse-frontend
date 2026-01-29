interface Model3DProps {
  className?: string;
  rotated?: boolean;
}

const Model3D = ({ className = '', rotated = false }: Model3DProps) => {
  return (
    <div
      className={`flex items-center justify-center transition-transform duration-700 ${
        rotated ? 'rotate-180' : ''
      } ${className}`}
    >
      {/* 3D-like rotating cube effect */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Outer glow */}
        <div className="absolute w-3/4 h-3/4 bg-gradient-to-br from-primary to-secondary rounded-3xl opacity-20 blur-3xl animate-pulse" />
        
        {/* Main cube */}
        <div className="relative w-3/4 h-3/4 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center overflow-hidden">
          {/* Inner pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute border border-white/20 rounded-full"
                  style={{
                    width: `${(i + 1) * 15}%`,
                    height: `${(i + 1) * 15}%`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center book icon */}
          <svg
            viewBox="0 0 24 24"
            className="w-1/3 h-1/3 text-white relative z-10"
            fill="currentColor"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="2" stroke="currentColor" fill="none" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="2" stroke="currentColor" fill="none" />
          </svg>
        </div>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full opacity-60"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Model3D;
