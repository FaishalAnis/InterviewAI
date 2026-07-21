import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (interviewId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    // Connect to websocket backend
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_interview", { interview_id: interviewId });
    });

    socket.on("joined", (data) => {
      console.log("WebSocket joined interview room:", data.room);
    });

    socket.on("transcription", (data: { question_id: string; text: string }) => {
      setTranscripts((prev) => ({
        ...prev,
        [data.question_id]: data.text,
      }));
    });

    socket.on("error", (err) => {
      console.error("Socket error event:", err);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [interviewId]);

  const emitAudioStream = (audioBytes: Blob, questionId: string, questionText: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("audio_stream", {
        interview_id: interviewId,
        audio_bytes: audioBytes,
        question_id: questionId,
        question_text: questionText,
      });
    }
  };

  return {
    isConnected,
    transcripts,
    emitAudioStream,
  };
};
