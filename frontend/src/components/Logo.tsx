import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300 hover:scale-110"
    >
      {/* Outer circle with gradient */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="url(#logoGradient)"
        stroke="url(#logoStroke)"
        strokeWidth="2"
      />

      {/* Stylized 'E' for Evenntz */}
      <path
        d="M12 14 L18 14 L18 16 L14 16 L14 18 L17 18 L17 20 L14 20 L14 22 L18 22 L18 24 L12 24 Z"
        fill="white"
        className="drop-shadow-sm"
      />

      {/* Small accent elements representing events/tickets */}
      <circle cx="26" cy="12" r="2" fill="#FFD700" opacity="0.8" />
      <circle cx="28" cy="16" r="1.5" fill="#FF6B6B" opacity="0.8" />
      <circle cx="26" cy="20" r="1.5" fill="#4ECDC4" opacity="0.8" />
      <circle cx="28" cy="24" r="2" fill="#45B7D1" opacity="0.8" />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="50%" stopColor="#764ba2" />
          <stop offset="100%" stopColor="#f093fb" />
        </linearGradient>
        <linearGradient id="logoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
