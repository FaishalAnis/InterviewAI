import React, { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isListening: boolean;
  stream?: MediaStream | null;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isListening, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isListening && stream) {
      // Connect actual Web Audio API Analyser
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const drawActual = () => {
          if (!canvas || !ctx) return;
          const width = canvas.width;
          const height = canvas.height;
          
          animationRef.current = requestAnimationFrame(drawActual);
          analyser.getByteFrequencyData(dataArray);
          
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "rgba(11, 15, 25, 0.2)";
          ctx.fillRect(0, 0, width, height);
          
          const barWidth = (width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;
          
          for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            // Build purple / indigo gradient bars
            const red = 139 + barHeight;
            const green = 92 - barHeight / 2;
            const blue = 246;
            
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            
            x += barWidth;
          }
        };
        
        drawActual();
      } catch (e) {
        console.error("Failed to setup real-time audio visualization:", e);
      }
    } else {
      // Draw smooth fallback sinewaves
      let angle = 0;
      
      const drawSimulated = () => {
        if (!canvas || !ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        
        animationRef.current = requestAnimationFrame(drawSimulated);
        ctx.clearRect(0, 0, width, height);
        
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
          const amplitude = isListening ? 25 : 5;
          const frequency = isListening ? 0.05 : 0.02;
          const y = height / 2 + Math.sin(x * frequency + angle) * amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
        
        // Secondary shift wave
        ctx.strokeStyle = "rgba(79, 70, 229, 0.3)";
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const amplitude = isListening ? 15 : 3;
          const frequency = isListening ? 0.03 : 0.01;
          const y = height / 2 + Math.sin(x * frequency - angle + 2) * amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        
        angle += isListening ? 0.15 : 0.03;
      };
      
      drawSimulated();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isListening, stream]);

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-white/5 shadow-inner">
      <canvas
        ref={canvasRef}
        width={500}
        height={80}
        className="w-full h-20 max-w-md rounded"
      />
    </div>
  );
};
