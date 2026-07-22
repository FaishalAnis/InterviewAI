import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { CameraPreview } from "../components/interview/CameraPreview";
import { VoiceVisualizer } from "../components/interview/VoiceVisualizer";
import { CodeEditor } from "../components/interview/CodeEditor";
import { useSpeech } from "../hooks/useSpeech";
import { useSocket } from "../hooks/useSocket";
import {
  Mic,
  Video,
  VideoOff,
  Volume2,
  ChevronRight,
  Loader,
  AlertCircle,
  Timer,
  CheckSquare
} from "lucide-react";

export const InterviewRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Resolve current active question
  const questions = interview?.questions || [];
  const currentIdx = interview?.current_question_index || 0;
  const isFinished = currentIdx >= questions.length;

  // Tab switching tracking
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const lastTabSwitchRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    isRunningRef.current = !loading && !isFinished && interview !== null;
  }, [loading, isFinished, interview]);

  useEffect(() => {
    const recordTabSwitch = () => {
      if (!isRunningRef.current) return;
      const now = Date.now();
      // Throttle to avoid double counting from blur + visibilitychange firing together
      if (now - lastTabSwitchRef.current > 1500) {
        lastTabSwitchRef.current = now;
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordTabSwitch();
      }
    };

    const handleBlur = () => {
      recordTabSwitch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (tabSwitchCount === 1) {
      setShowTabWarning(true);
    } else if (tabSwitchCount >= 2) {
      const autoTerminate = async () => {
        setLoading(true);
        try {
          await api.post(`/interview/${id}/complete`, { tab_switches: tabSwitchCount });
          navigate(`/report/${id}?terminated=true`);
        } catch (err) {
          console.error("Failed to terminate interview:", err);
          navigate("/dashboard");
        }
      };
      autoTerminate();
    }
  }, [tabSwitchCount, id, navigate]);

  // Conversational response state
  const [answerText, setAnswerText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  
  // Follow up state
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);

  // Timer states
  const [seconds, setSeconds] = useState(0);

  // Hooks
  const {
    isSpeaking,
    isListening,
    transcript,
    speakText,
    startListening,
    stopListening,
    stopSpeaking,
  } = useSpeech();

  useSocket(id);

  // Fetch Interview Session
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interview/${id}`);
        setInterview(res.data);
        setError(null);
      } catch (err) {
        console.error("Interview load error:", err);
        setError("Failed to fetch interview session.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  // Audio stream duration tracker
  const timerIntervalRef = useRef<number | null>(null);

  // Timer hook
  useEffect(() => {
    if (isFinished) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000) as unknown as number;
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isFinished]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const currentQuestion = questions[currentIdx];

  // Trigger TTS read out when question changes
  useEffect(() => {
    if (currentQuestion && !isSpeaking && !loading) {
      speakText(currentQuestion.text);
    }
    return () => {
      stopSpeaking();
    };
  }, [currentIdx, currentQuestion, loading]);

  // Syllables analyzer for live transcripts
  useEffect(() => {
    if (isListening && transcript) {
      setAnswerText(transcript);
    }
  }, [transcript, isListening]);

  // Turn off camera tracks when interview completes or unmounts
  useEffect(() => {
    if (isFinished && stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
      setWebcamEnabled(false);
    }
  }, [isFinished, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [stream]);

  const handleSpeakQuestion = () => {
    if (currentQuestion) {
      speakText(currentQuestion.text);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      const finalResult = stopListening();
      setAnswerText(finalResult);
    } else {
      startListening();
    }
  };

  const handleStreamCreated = (mediaStream: MediaStream) => {
    setStream(mediaStream);
  };

  const handleResponseSubmit = async () => {
    if (!answerText && !followUpPrompt) return;

    setSubmittingResponse(true);
    try {
      const payload = new FormData();
      payload.append("question_id", currentQuestion.id);
      
      // If candidate is answering a follow up, wrap context
      const answerBody = followUpPrompt 
        ? `[Follow-up Context: ${followUpPrompt}] Answer: ${answerText}`
        : answerText;
      
      payload.append("answer_text", answerBody);
      payload.append("webcam_metrics_json", JSON.stringify([
        { eye_contact: true, is_smiling: false, good_posture: true, wpm: 135 }
      ]));

      const res = await api.post(`/interview/${id}/response`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Check if AI generated a conversational follow up
      const nextFollowUp = res.data.follow_up_question;
      if (nextFollowUp && !followUpPrompt) {
        // Feed follow up to user instead of skipping to next question
        setFollowUpPrompt(nextFollowUp);
        speakText(nextFollowUp);
        setAnswerText("");
      } else {
        // Move to next question index
        setInterview(res.data.interview);
        setFollowUpPrompt(null);
        setAnswerText("");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to record answer response.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCodingComplete = () => {
    // Coding editor submitted successfully. Update active state index
    setInterview((prev: any) => ({
      ...prev,
      current_question_index: prev.current_question_index + 1
    }));
    setAnswerText("");
  };

  const handleFinishInterview = async () => {
    setLoading(true);
    try {
      await api.post(`/interview/${id}/complete`, { tab_switches: tabSwitchCount });
      navigate(`/report/${id}`);
    } catch (err) {
      console.error("Failed to complete interview:", err);
      alert("Could not complete session. Report creation failed.");
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <Loader className="animate-spin text-primary-400" size={32} />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {tabSwitchCount >= 2 ? "Integrity Violation: Terminating interview session..." : "Bootstrapping AI mock room..."}
          </span>
        </div>
      </Layout>
    );
  }

  if (error || !interview) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="text-rose-500" size={40} />
          <span className="text-sm text-slate-700 dark:text-slate-300">{error || "Interview not found."}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-grow flex flex-col space-y-6">
        {/* Header Panel */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{interview.interview_type}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{interview.difficulty} • Mode: {interview.mode}</span>
          </div>

          <div className="flex items-center space-x-6">
            {tabSwitchCount > 0 && (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 px-3 py-1.5 rounded-lg animate-pulse">
                <AlertCircle size={14} />
                <span>Violations: {tabSwitchCount}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg">
              <Timer size={14} className="text-indigo-500 dark:text-indigo-400" />
              <span>{formatTime(seconds)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWebcamEnabled(!webcamEnabled)}
                className={`p-2 rounded-lg border transition ${
                  webcamEnabled ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                }`}
              >
                {webcamEnabled ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Room Body */}
        {isFinished ? (
          <div className="flex-grow flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-5">
            <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Questions Answered</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Excellent! You have successfully completed the interview. Click the button below to compile and view your detailed scorecard report.
            </p>
            <button
              onClick={handleFinishInterview}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg transition"
            >
              Generate Interview Report
            </button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-stretch space-y-6">
            {/* Question Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase bg-primary-100 dark:bg-primary-600/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-500/25">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                
                <button
                  onClick={handleSpeakQuestion}
                  disabled={isSpeaking}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition disabled:opacity-50"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentQuestion.text}
              </p>

              {followUpPrompt && (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/10 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  <span className="font-bold block mb-1">🤖 AI Follow-up:</span>
                  {followUpPrompt}
                </div>
              )}
            </div>

            {/* Monaco coding challenge panel override */}
            {interview.mode === "coding" || currentQuestion.category === "coding" ? (
              <CodeEditor
                questionId={currentQuestion.id}
                interviewId={interview.id}
                codingMetadata={currentQuestion.coding_metadata || {
                  title: currentQuestion.text.split("?")[0] + "?",
                  problem_description: currentQuestion.text,
                  starter_code: {
                    python: "# Write your solution or explanation here\n",
                    javascript: "// Write your solution or explanation here\n",
                    cpp: "// Write your solution or explanation here\n"
                  },
                  test_cases: []
                }}
                onComplete={handleCodingComplete}
                webcamEnabled={webcamEnabled}
                onStreamCreated={handleStreamCreated}
              />
            ) : (
              // Conversational/Audio interaction split panel
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-grow items-start">
                {/* Webcam feedback if active */}
                <div className="md:col-span-2 flex flex-col space-y-4 items-center">
                  <CameraPreview isEnabled={webcamEnabled} onStreamCreated={handleStreamCreated} />
                  <VoiceVisualizer isListening={isListening} stream={stream} />
                </div>

                {/* Response textbox input */}
                <div className="md:col-span-3 flex flex-col space-y-4 h-full">
                  <div className="flex-grow flex flex-col bg-slate-100/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-white/5 p-5 relative min-h-[220px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Your Transcribed Response</span>
                      
                      <button
                        onClick={handleToggleListening}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                          isListening
                            ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Mic size={14} />
                        <span>{isListening ? "Listening..." : "Speak Answer"}</span>
                      </button>
                    </div>

                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your response here or click 'Speak Answer' to speak using your microphone..."
                      className="w-full flex-grow bg-transparent border-0 resize-none text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0 min-h-[140px]"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleResponseSubmit}
                      disabled={submittingResponse || (!answerText.trim() && !isListening)}
                      className="flex items-center space-x-2 px-6 py-3 gradient-btn text-sm font-bold rounded-xl text-white shadow-lg disabled:opacity-50"
                    >
                      {submittingResponse ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <>
                          <span>Submit & Continue</span>
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Switch Warning Overlay Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard border border-rose-200 dark:border-rose-500/25 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Tab Switch Detected</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Warning: Tab switching and window focus changes are monitored. This event has been flagged and logged in your final interview report. (Violation #{tabSwitchCount})
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              I Understand, Return to Interview
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default InterviewRoom;
