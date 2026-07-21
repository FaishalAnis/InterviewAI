import React, { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Eye, Smile, AlertCircle } from "lucide-react";

interface CameraPreviewProps {
  isEnabled: boolean;
  onStreamCreated?: (stream: MediaStream) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isEnabled, onStreamCreated }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time telemetry values to simulate live analysis
  const [eyeContact, setEyeContact] = useState(90);
  const [smileRate, setSmileRate] = useState(15);
  const [posture, setPosture] = useState("Centered");

  useEffect(() => {
    if (!isEnabled) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    const startCamera = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        
        setStream(userStream);
        setError(null);
        
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
        
        if (onStreamCreated) {
          onStreamCreated(userStream);
        }
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setError("Camera permission denied. Check your settings.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isEnabled]);

  // Simulate changing telemetry
  useEffect(() => {
    if (!stream) return;
    
    const interval = setInterval(() => {
      setEyeContact((prev) => Math.max(70, Math.min(100, prev + Math.floor(Math.random() * 7) - 3)));
      setSmileRate((prev) => Math.max(5, Math.min(45, prev + Math.floor(Math.random() * 5) - 2)));
      
      const postures = ["Centered", "Leaning Left", "Leaning Right", "Centered", "Centered"];
      setPosture(postures[Math.floor(Math.random() * postures.length)]);
    }, 1500);

    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div className="relative glass-panel rounded-2xl overflow-hidden aspect-video w-full max-w-md mx-auto shadow-2xl border border-white/10">
      {isEnabled && !error ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          
          {/* Overlay metrics */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center space-x-1">
                <Video size={12} className="text-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">Live AI Tracking Active</span>
              </span>
              <span>Posture: {posture}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <div className="flex items-center space-x-2 bg-slate-900/60 rounded px-2 py-1 border border-white/5">
                <Eye size={14} className="text-indigo-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 leading-none">Eye Contact</span>
                  <span className="text-xs font-bold text-indigo-200">{eyeContact}%</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-slate-900/60 rounded px-2 py-1 border border-white/5">
                <Smile size={14} className="text-yellow-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 leading-none">Smile Rate</span>
                  <span className="text-xs font-bold text-yellow-200">{smileRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-900/50">
          {error ? (
            <>
              <AlertCircle size={40} className="text-rose-500 mb-3" />
              <p className="text-sm font-semibold text-rose-300 text-center">{error}</p>
            </>
          ) : (
            <>
              <VideoOff size={40} className="text-slate-500 mb-3" />
              <p className="text-sm text-center">Webcam disabled. Toggle webcam to begin recording face analytics.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default CameraPreview;
