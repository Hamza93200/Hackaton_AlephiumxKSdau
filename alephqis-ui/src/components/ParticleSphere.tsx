import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
  vx: number;
  vy: number;
  vz: number;
}

export const ParticleSphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();
  const explosionFactor = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  
  const particles = useRef<Particle[]>([]);
  const NUM_PARTICLES = 1500;

  useEffect(() => {
    // Initialize particles
    const pts: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 150;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      pts.push({
        x, y, z,
        ox: x, oy: y, oz: z,
        vx: x * 0.05, vy: y * 0.05, vz: z * 0.05
      });
    }
    particles.current = pts;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const render = () => {
      const factor = explosionFactor.get();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      rotation += 0.002;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
      
      particles.current.forEach((p) => {
        // Explode outward based on scroll
        const curX = p.ox + p.vx * factor * 20;
        const curY = p.oy + p.vy * factor * 20;
        const curZ = p.oz + p.vz * factor * 20;
        
        // Simple 3D rotation
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        
        const rx = curX * cosR - curZ * sinR;
        const rz = curX * sinR + curZ * cosR;
        
        // Project to 2D
        const perspective = 600 / (600 + rz);
        const screenX = centerX + rx * perspective;
        const screenY = centerY + curY * perspective;
        
        const size = Math.max(0.5, 2 * perspective);
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 600;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [explosionFactor]);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="z-10 text-center px-4">
        <h2 className="text-4xl md:text-6xl font-bold mb-4">L'Intelligence Quantitative</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Propulser vos investissements grâce à des algorithmes de pointe et une analyse de données en temps réel.
        </p>
      </div>
    </div>
  );
};
