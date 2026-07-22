import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Download, ChevronLeft, Loader, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isTerminated = new URLSearchParams(location.search).get("terminated") === "true";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retries = 0;
    const maxRetries = 6; // Try up to 6 times (12 seconds)
    let isMounted = true;
    let timer: any;

    const fetchReport = async () => {
      try {
        const res = await api.get(`/report/${id}`);
        if (isMounted) {
          setReport(res.data);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn(`Report fetch attempt ${retries + 1} failed:`, err);
        
        // If it's a 404 (not ready yet) and we haven't exceeded max retries, poll again
        if (err.response?.status === 404 && retries < maxRetries && isMounted) {
          retries++;
          timer = setTimeout(fetchReport, 2000);
        } else {
          if (isMounted) {
            setError(err.response?.data?.detail || "Failed to fetch evaluation report.");
            setLoading(false);
          }
        }
      }
    };

    fetchReport();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const handleDownloadPDF = () => {
    // Direct stream download
    // Open in new window with token in query params or fetch direct blob
    api.get(`/report/${id}/pdf`, { responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `InterviewAI_Report_${id}.pdf`;
        link.click();
      })
      .catch((err) => {
        console.error("PDF download failed:", err);
        alert("Failed to download PDF report.");
      });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <Loader className="animate-spin text-primary-400" size={32} />
          <span className="text-sm text-slate-500 dark:text-slate-400">Compiling evaluation report metrics...</span>
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="text-rose-500" size={40} />
          <span className="text-sm text-slate-700 dark:text-slate-300">{error || "Report not found."}</span>
        </div>
      </Layout>
    );
  }

  const scores = report.scores || {};

  return (
    <Layout>
      <div className="space-y-8 flex-grow">
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 border-b border-slate-200 dark:border-white/5 pb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ChevronLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 transition"
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </button>
        </div>

        {/* Integrity violations block */}
        {isTerminated ? (
          <div className="p-5 bg-rose-100 dark:bg-rose-950/45 border-2 border-rose-500/30 text-rose-800 dark:text-rose-350 rounded-2xl flex items-start space-x-3.5 mb-6 animate-pulse shadow-md">
            <AlertTriangle className="text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" size={24} />
            <div>
              <span className="font-extrabold text-sm block">⚠️ Session Auto-Terminated due to Cheating Prevention</span>
              <span className="mt-1 text-xs block leading-relaxed">
                This interview was automatically aborted and locked. The candidate attempted to switch tabs, resize the window, or focus away from the test interface more than once. All progress has been finalized, and a security flag has been permanently attached to this evaluation dossier.
              </span>
            </div>
          </div>
        ) : report.tab_switch_violations > 0 ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-3 mb-6 animate-fade-in shadow-sm">
            <AlertTriangle className="text-rose-500 shrink-0" size={18} />
            <div>
              <span className="font-bold block">Integrity Alert: Tab Switched Detected</span>
              <span className="mt-0.5 block">
                The candidate focused away from the browser window or switched tabs a total of <span className="font-bold text-rose-600 dark:text-rose-400">{report.tab_switch_violations}</span> times during this session.
              </span>
            </div>
          </div>
        ) : null}

        {/* Main report columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detailed Scores & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={20} />
                <span>Executive Summary</span>
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.summary}</p>
            </div>

            {/* Score Breakdowns */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Performance Criteria</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Overall Rating", value: scores.overall },
                  { label: "Technical depth", value: scores.technical },
                  { label: "Communication", value: scores.communication },
                  { label: "Problem Solving", value: scores.problem_solving },
                  { label: "Vocabulary", value: scores.vocabulary },
                  { label: "Confidence", value: scores.confidence },
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center text-center shadow-inner">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mb-2 block uppercase font-bold tracking-wider">{s.label}</span>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timelines Charts */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Webcam Confidence Timeline</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.confidence_timeline}>
                    <XAxis dataKey="label" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" domain={[0, 100]} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#161d30", borderColor: "rgba(255,255,255,0.08)" }} />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Question Evaluation detailed view */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Question Breakdown</h3>
              {report.question_evaluations?.map((qe: any, index: number) => (
                <div key={index} className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Question {index + 1}</span>
                    <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400">{qe.score}% Score</span>
                  </div>
                  
                  <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">Q: {qe.question_text}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                      Your answer: "{qe.user_answer}"
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-primary-700 dark:text-primary-300">AI Critique:</span> {qe.feedback}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">Suggested Answer:</span> {qe.suggested_answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action improvement checklists */}
          <div className="space-y-6">
            {/* Strengths */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Key Strengths</h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {report.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Weaknesses & Gaps</h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {report.weaknesses?.map((w: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-rose-500 dark:text-rose-400 font-bold mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Improvement Plan */}
            <div className="glass-panel rounded-3xl p-5 border border-primary-300 dark:border-primary-500/20">
              <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3">Action Improvement Plan</h4>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                {report.actionable_improvement_plan?.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">✓</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Report;
