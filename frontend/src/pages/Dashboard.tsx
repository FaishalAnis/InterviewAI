import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  Play,
  FileText,
  Briefcase,
  TrendingUp,
  Award,
  Flame,
  Clock,
  ChevronRight,
  Upload,
  RefreshCw,
  Plus
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [interviews, setInterviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [interviewType, setInterviewType] = useState("Software Engineering");
  const [difficulty, setDifficulty] = useState("Medium");
  const [mode, setMode] = useState("voice");
  const [jdText, setJdText] = useState("");
  
  // Resume upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const intRes = await api.get("/interview/history?limit=10");
        setInterviews(intRes.data);
        
        const repRes = await api.get("/report/user?limit=10");
        setReports(repRes.data);
      } catch (err) {
        console.error("Failed to load dashboard logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  // Compile Chart Data
  const chartData = reports.slice().reverse().map((r, index) => ({
    name: `Int ${index + 1}`,
    score: r.scores?.overall || 0,
  }));

  if (chartData.length === 0) {
    // Fill dummy visual trends
    chartData.push(
      { name: "Start", score: 60 },
      { name: "Week 1", score: 72 },
      { name: "Week 2", score: 81 }
    );
  }

  // Aggregate stats
  const avgScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (r.scores?.overall || 0), 0) / reports.length) 
    : 75;

  return (
    <Layout>
      <div className="space-y-8 flex-grow">
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-none">
              Welcome back, {user?.full_name || "Practitioner"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Here is your interview analytics summary and dashboard.</p>
          </div>
          
          <div className="flex items-center space-x-4 bg-slate-900/60 border border-white/5 px-4 py-2 rounded-xl">
            <Flame className="text-amber-500 fill-amber-500" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none">Current Streak</span>
              <span className="text-sm font-bold text-white">{profile?.streak || 0} Days</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Mock Sessions</span>
              <span className="text-xl font-bold text-white">{interviews.length} Sessions</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Average Score</span>
              <span className="text-xl font-bold text-white">{avgScore}% Accuracy</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/10 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Strongest skill</span>
              <span className="text-sm font-bold text-white truncate max-w-[120px] block">Algorithms</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/10 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Weakest skill</span>
              <span className="text-sm font-bold text-white truncate max-w-[120px] block">System Scaling</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interview Launcher Panel */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-primary-600/20 text-primary-400 rounded-lg">
                  <Play size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Start New Practice Session</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
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

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="Easy">Easy (Entry level)</option>
                    <option value="Medium">Medium (Mid level)</option>
                    <option value="Hard">Hard (Staff / Senior)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Interview Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="voice">Voice + Avatar</option>
                    <option value="coding">Monaco Coding</option>
                    <option value="video">Full Webcam Video</option>
                  </select>
                </div>
              </div>

              {/* Upload CV Panel */}
              <div className="border border-dashed border-white/10 rounded-2xl p-4 bg-slate-950/20 text-center relative hover:border-primary-500/50 transition">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingResume}
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {uploadingResume ? (
                    <RefreshCw className="animate-spin text-primary-400" size={24} />
                  ) : (
                    <Upload className="text-slate-400" size={24} />
                  )}
                  <span className="text-xs text-slate-300 font-semibold">
                    {resumeLoaded ? "✓ CV Uploaded & Synced" : "Upload Resume PDF to customize questions"}
                  </span>
                  <span className="text-[10px] text-slate-500">Only PDF files supported. Tailors prompt templates to past projects.</span>
                </div>
              </div>

              {parsedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parsedSkills.map((s, idx) => (
                    <span key={idx} className="text-[10px] bg-indigo-950/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/10">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Paste Job Description */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Job Description (Optional)</label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the target role description here to align mock questions against key job requirements..."
                  rows={2}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                onClick={handleLaunchInterview}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-primary-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                <span>Launch Mock Interview</span>
              </button>
            </div>

            {/* Performance Analytics Chart */}
            <div className="glass-panel rounded-3xl p-5 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Score Progression Trajectory</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" domain={[0, 100]} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#161d30", borderColor: "rgba(255,255,255,0.08)" }} />
                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sidebar Feed: Recent mock list & recommendations */}
          <div className="space-y-6">
            {/* Recent list */}
            <div className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Sessions</h3>
              <div className="space-y-3 flex-grow overflow-y-auto max-h-96">
                {interviews.length > 0 ? (
                  interviews.map((int) => (
                    <div
                      key={int.id}
                      onClick={() => navigate(int.status === "completed" ? `/report/${int.id}` : `/interview/${int.id}`)}
                      className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-800 transition"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">{int.interview_type}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{int.difficulty} • {int.mode}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          int.status === "completed" ? "bg-emerald-500/25 text-emerald-400" : "bg-indigo-500/25 text-indigo-400"
                        }`}>
                          {int.status === "completed" ? "Reviewed" : "Resume"}
                        </span>
                        <ChevronRight size={14} className="text-slate-500" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No sessions recorded. Ready to begin!
                  </div>
                )}
              </div>
            </div>

            {/* Preparation recommendations */}
            <div className="glass-panel rounded-3xl p-5 border border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Prep Recommendations</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
                  <span className="font-bold text-indigo-400 block mb-0.5">Review STAR framework</span>
                  Map behavioral responses with context inputs and numeric values.
                </li>
                <li className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
                  <span className="font-bold text-emerald-400 block mb-0.5">Optimize algorithms execution</span>
                  Speak solutions out loud to increase pacing rates.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Dashboard;
