import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  Award,
  Flame,
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [interviews, setInterviews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const intRes = await api.get("/interview/history?limit=10");
        setInterviews(intRes.data);
        
        const repRes = await api.get("/report/user?limit=10");
        setReports(repRes.data);
      } catch (err) {
        console.error("Failed to load dashboard logs:", err);
      }
    };
    fetchData();
  }, []);

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
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              Welcome back, {user?.full_name || "Practitioner"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here is your interview analytics summary and dashboard.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/start")}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-primary-500/20 transition hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={16} />
              <span>New Practice Session</span>
            </button>

            <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-xl">
              <Flame className="text-amber-500 fill-amber-500" size={18} />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">Current Streak</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{profile?.streak || 0} Days</span>
              </div>
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider">Mock Sessions</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{interviews.length} Sessions</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider">Average Score</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{avgScore}% Accuracy</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/10 rounded-xl">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider">Strongest skill</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px] block">Algorithms</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/10 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider">Weakest skill</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px] block">System Scaling</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Analytics Chart */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Score Progression Trajectory</h3>
              <div className="h-[320px]">
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
            <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Recent Sessions</h3>
              <div className="space-y-3 flex-grow overflow-y-auto max-h-96">
                {interviews.length > 0 ? (
                  interviews.map((int) => (
                    <div
                      key={int.id}
                      onClick={() => navigate(int.status === "completed" ? `/report/${int.id}` : `/interview/${int.id}`)}
                      className="flex items-center justify-between p-3 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{int.interview_type}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{int.difficulty} • {int.mode}</span>
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
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                    No sessions recorded. Ready to begin!
                  </div>
                )}
              </div>
            </div>

            {/* Preparation recommendations */}
            <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Prep Recommendations</h3>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-white/5">
                  <span className="font-bold text-indigo-500 dark:text-indigo-400 block mb-0.5">Review STAR framework</span>
                  Map behavioral responses with context inputs and numeric values.
                </li>
                <li className="p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-white/5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Optimize algorithms execution</span>
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
