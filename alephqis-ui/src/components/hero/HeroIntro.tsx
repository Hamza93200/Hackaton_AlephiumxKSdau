import { useEffect, useRef } from 'react';
import { motion, MotionValue } from 'motion/react';

interface HeroIntroProps {
  progress: MotionValue<number>;
  className?: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  size: number;
  alpha: number;
}

export default function HeroIntro({ progress, className = '' }: HeroIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle3D[]>([]);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create sphere of particles
    const createSphere = () => {
      const particles: Particle3D[] = [];
      const radius = 165;
      const particleCount = 1500;

      for (let i = 0; i < particleCount; i++) {
        // Fibonacci sphere
        const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        particles.push({
          x,
          y,
          z,
          originalX: x,
          originalY: y,
          originalZ: z,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.5,
        });
      }

      return particles;
    };

    particlesRef.current = createSphere();

    // Subscribe to scroll progress
    const unsubscribe = progress.on('change', (latest) => {
      scrollProgressRef.current = latest;
    });

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 35;
      const time = Date.now() * 0.0003;
      const scroll = scrollProgressRef.current;

      // Uniform radial expansion - grows bigger and bigger in all directions equally
      const expansionScale = 1 + scroll * 8;

      particlesRef.current.forEach((particle) => {
        // Rotate the sphere
        const rotatedX = particle.originalX * Math.cos(time) - particle.originalZ * Math.sin(time);
        const rotatedZ = particle.originalX * Math.sin(time) + particle.originalZ * Math.cos(time);
        const rotatedY = particle.originalY;

        // Apply uniform expansion - all axes scaled equally
        const finalX = rotatedX * expansionScale;
        const finalY = rotatedY * expansionScale;
        const finalZ = rotatedZ * expansionScale;

        // Project to 2D with perspective
        const perspective = 600;
        const scale = perspective / (perspective + finalZ);
        const projectedX = finalX * scale + centerX;
        const projectedY = finalY * scale + centerY;

        // Calculate opacity based on z-position and scroll
        const baseOpacity = (finalZ + 400) / 800;
        const scrollFade = Math.max(0, 1 - scroll * 0.8);
        const opacity = particle.alpha * baseOpacity * scrollFade;

        if (opacity > 0.05) {
          ctx.fillStyle = `rgba(65, 105, 225, ${opacity})`;
          ctx.beginPath();
          ctx.arc(projectedX, projectedY, particle.size * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      unsubscribe();
    };
  }, [progress]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ opacity: 1 }}
    />
  );
}
