import React, { useEffect, useRef } from 'react';

export const RotatingGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const resize = () => {
      canvas.width = 300;
      canvas.height = 300;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;

      // Draw globe outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.stroke();

      // Draw latitudes
      for (let i = -4; i <= 4; i++) {
        const y = centerY + (i * radius) / 5;
        const rx = Math.sqrt(Math.pow(radius, 2) - Math.pow(y - centerY, 2));
        ctx.beginPath();
        ctx.ellipse(centerX, y, rx, rx * 0.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.stroke();
      }

      // Draw longitudes
      rotation += 0.005;
      for (let i = 0; i < 6; i++) {
        const angle = rotation + (i * Math.PI) / 3;
        const rx = radius * Math.cos(angle);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(rx), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = rx > 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.1)';
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="bg-black p-8 rounded-xl flex items-center justify-center aspect-square w-full max-w-[300px] mx-auto overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
