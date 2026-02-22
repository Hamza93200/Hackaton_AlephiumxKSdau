import React from 'react';

export const Logo = ({ className = "", onClick }: { className?: string; onClick?: () => void }) => {
  return (
    <div 
      className={`flex items-center gap-1 font-bold text-2xl tracking-tight cursor-pointer ${className}`}
      onClick={onClick}
    >
      <span className="text-black">Aleph</span>
      <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        QIS
      </span>
    </div>
  );
};
