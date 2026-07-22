import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import {
  Play,
  Upload,
  RefreshCw,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export const StartInterview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form States
  const [interviewType, setInterviewType] = useState("Software Engineering");
  const [difficulty, setDifficulty] = useState("Medium");
  const [mode, setMode] = useState("voice");
  const [jdText, setJdText] = useState("");
  
  // Resume upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingResume(true);
    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setParsedSkills(res.data.skills || []);
      setResumeLoaded(true);
    } catch (err) {
      console.error("Resume parse failed:", err);
      alert("Failed to parse resume PDF. Mock values applied instead.");
      setParsedSkills(["Python", "React", "TypeScript", "FastAPI"]);
      setResumeLoaded(true);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleLaunchInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/interview/", {
        interview_type: interviewType,
        difficulty,
        mode,
        job_description_text: jdText || undefined
      });
      const interviewId = res.data.id;
      navigate(`/interview/${interviewId}`);
    } catch (err) {
      console.error("Failed to trigger interview creation:", err);
      alert("Unable to spawn mock session. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 flex-grow py-4">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        {/* Heading */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles size={28} className="text-primary-500" />
            <span>Configure Mock Session</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize your simulated session parameters. Our LLMs tailor prompt templates based on your target role, resume, and experience.
          </p>
        </div>

        {/* Setup Card */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-200 dark:border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          {/* Form parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interview Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="Frontend">Frontend Dev</option>
                <option value="Backend">Backend Dev</option>
                <option value="Full Stack">Full Stack</option>
                <option value="Data Science">Data Science</option>
                <option value="AI/ML">AI / ML Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Behavioral Interview">Behavioral (STAR)</option>
                <option value="HR Interview">HR & Career Goals</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              >
                <option value="Easy">Easy (Entry level)</option>
                <option value="Medium">Medium (Mid level)</option>
                <option value="Hard">Hard (Staff / Senior)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interview Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none transition"
              >
                <option value="voice">Voice + Avatar</option>
                <option value="coding">Monaco Coding</option>
                <option value="video">Full Webcam Video</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-white/5" />

          {/* Upload CV Panel */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upload Resume / CV (Optional)</label>
            <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-slate-100/50 dark:bg-slate-950/20 text-center relative hover:border-primary-500/50 transition">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingResume}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                {uploadingResume ? (
                  <RefreshCw className="animate-spin text-primary-400" size={28} />
                ) : (
                  <Upload className="text-slate-400" size={28} />
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">
                  {resumeLoaded ? "✓ Resume Synced successfully" : "Upload PDF Resume"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  We parse your skills, experience, and past projects to adjust mock session criteria.
                </span>
              </div>
            </div>
          </div>

          {parsedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedSkills.map((s, idx) => (
                <span key={idx} className="text-xs bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/10 font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Paste Job Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Job Description (Optional)</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the target job role details here to align mock questions against key job requirements..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunchInterview}
            disabled={loading || uploadingResume}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-primary-500/25 flex items-center justify-center space-x-2 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            <span>Begin Live Session</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};
