import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Play, Send, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../services/api";
import { CameraPreview } from "./CameraPreview";

interface TestResult {
  test_case_idx: number;
  passed: boolean;
  output: string;
  expected: string;
  error?: string;
}

interface CodeEditorProps {
  questionId: string;
  interviewId: string;
  codingMetadata: {
    title: string;
    problem_description: string;
    starter_code: Record<string, string>;
    test_cases: Array<{ input: string; expected: string }>;
  };
  onComplete: (evaluation: any) => void;
  webcamEnabled: boolean;
  onStreamCreated: (stream: MediaStream) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  questionId,
  interviewId,
  codingMetadata,
  onComplete,
  webcamEnabled,
  onStreamCreated,
}) => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<string | null>(null);

  useEffect(() => {
    // Set initial starter code depending on language
    const starter = codingMetadata.starter_code[language] || codingMetadata.starter_code["python"] || "";
    setCode(starter);
    setResults(null);
    setConsoleError(null);
  }, [language, questionId, codingMetadata]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResults(null);
    setConsoleError(null);
    try {
      const res = await api.post("/coding/run", {
        code,
        language,
        test_cases: codingMetadata.test_cases,
      });

      if (res.data.status === "runtime_error" || res.data.status === "time_limit_exceeded") {
        setConsoleError(res.data.error || "Runtime execution error occurred.");
      } else {
        setResults(res.data.results || []);
      }
    } catch (err: any) {
      setConsoleError(err.response?.data?.detail || "Connection lost to execution sandbox.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResults(null);
    setConsoleError(null);
    try {
      const res = await api.post("/coding/submit", {
        interview_id: interviewId,
        question_id: questionId,
        code,
        language,
      });

      const sandboxResult = res.data.sandbox_result;
      setSandboxStatus(sandboxResult.status);

      if (sandboxResult.status === "runtime_error" || sandboxResult.status === "time_limit_exceeded") {
        setConsoleError(sandboxResult.error || "Execution error during submission.");
      } else {
        setResults(sandboxResult.results || []);
      }
      
      // Let the page know question was evaluated successfully
      onComplete(res.data.evaluation);
    } catch (err: any) {
      setConsoleError(err.response?.data?.detail || "Submission process failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-grow items-stretch animate-fade-in">
      {/* Editor & Instructions panel */}
      <div className="lg:col-span-3 flex flex-col glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">{codingMetadata.title}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Write your algorithm in the editor below.</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node)</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="java">Java 17</option>
              <option value="go">Go 1.20</option>
              <option value="rust">Rust</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 mb-4 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-200 dark:border-white/5 overflow-y-auto max-h-48 whitespace-pre-line">
          {codingMetadata.problem_description}
        </div>

        <div className="flex-grow min-h-[300px] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shadow-inner">
          <MonacoEditor
            height="100%"
            language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : "python"}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 10, bottom: 10 }
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Code is auto-saved locally</span>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/5 transition disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
              <span>Run Code</span>
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 gradient-btn text-xs font-semibold rounded-lg text-white shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
              <span>Submit Solution</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test cases & Output console */}
      <div className="lg:col-span-2 flex flex-col bg-slate-100/50 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-white/5 p-5 space-y-4">
        {/* Webcam feedback if active */}
        <div className="w-full flex justify-center mb-1">
          <CameraPreview isEnabled={webcamEnabled} onStreamCreated={onStreamCreated} />
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Test Cases & Output</h4>
        
        <div className="flex-grow overflow-y-auto flex flex-col space-y-4">
          {results ? (
            <div className="space-y-3">
              {sandboxStatus && (
                <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center space-x-2 ${
                  sandboxStatus === "accepted" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}>
                  {sandboxStatus === "accepted" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span>Status: {sandboxStatus.toUpperCase()}</span>
                </div>
              )}

              {results.map((r, index) => (
                <div key={index} className={`p-3 rounded-xl border ${
                  r.passed ? "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/10" : "bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-500/10"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Test Case {index + 1}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      r.passed ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    }`}>
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Expected</span>
                      <span className="text-slate-800 dark:text-slate-200">{r.expected}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Actual</span>
                      <span className="text-slate-800 dark:text-slate-200">{r.output || (r.error ? "Error" : "None")}</span>
                    </div>
                  </div>
                  
                  {r.error && (
                    <div className="mt-2 text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/25 p-2 rounded border border-rose-200 dark:border-rose-500/10 overflow-x-auto whitespace-pre">
                      {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : consoleError ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/10 rounded-xl text-rose-700 dark:text-rose-400 font-mono text-xs flex items-start space-x-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="overflow-x-auto whitespace-pre-wrap">{consoleError}</div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-xs p-6 text-center">
              <Play className="mb-2 text-slate-400 dark:text-slate-600" size={32} />
              <span>Run or submit your solution to view evaluations. Test inputs are verified in sandboxed environments.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
