import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import {
  Mail,
  Briefcase,
  GraduationCap,
  Flame,
  Settings
} from "lucide-react";

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    lastActive: "N/A"
  });

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const intRes = await api.get("/interview/history?limit=50");
        
        const repRes = await api.get("/report/user?limit=50");
        const avg = repRes.data.length > 0
          ? Math.round(repRes.data.reduce((acc: number, r: any) => acc + (r.scores?.overall || 0), 0) / repRes.data.length)
          : 0;

        let lastActiveDate = "N/A";
        if (intRes.data.length > 0) {
          const latest = intRes.data[0].created_at;
          lastActiveDate = new Date(latest).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }

        setStats({
          totalSessions: intRes.data.length,
          avgScore: avg,
          lastActive: lastActiveDate
        });
      } catch (err) {
        console.error("Failed to load profile statistics:", err);
      }
    };
    fetchProfileStats();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 flex-grow py-4">
        {/* Profile Header Banner */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-200 dark:border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between space-y-6 md:space-y-0 shadow-2xl">
          {/* Decorative Background Glow */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mt-20" />
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 relative z-10">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary-500 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-4xl shadow-xl border-2 border-white/20">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            
            <div className="text-center md:text-left space-y-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {user?.full_name || "Practitioner"}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary-500/15 text-primary-400 border border-primary-500/10">
                  {user?.role || "User"}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start space-x-1.5 pt-1">
                <Mail size={14} />
                <span>{user?.email}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Last mock interview active: {stats.lastActive}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/settings")}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 transition relative z-10"
          >
            <Settings size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Personal details */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Candidate Background Details</h3>

              {/* Skills */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Key Competency Skills</span>
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/10 font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No skills registered yet. Update them in Settings!</p>
                )}
              </div>

              {/* Experience */}
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/10 mt-0.5">
                  <Briefcase size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Professional Experience</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {profile?.experience_years ? `${profile.experience_years} Years` : "Not specified"}
                  </span>
                </div>
              </div>

              {/* Education */}
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl border border-yellow-500/10 mt-0.5">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Education Background</span>
                  {profile?.education && profile.education.length > 0 ? (
                    <div className="space-y-1">
                      {profile.education.map((edu: string, idx: number) => (
                        <span key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{edu}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mini stats & Streak */}
          <div className="space-y-6">
            {/* Streak card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/10">
                <Flame size={24} className="fill-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Activity Streak</span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-white">{profile?.streak || 0} Days Running</span>
              </div>
            </div>

            {/* Assessment stats */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Practice Stats</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Practice Runs</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">{stats.totalSessions} Sessions</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Avg. Score Accuracy</span>
                  <span className="text-xs font-extrabold text-emerald-500">{stats.avgScore > 0 ? `${stats.avgScore}%` : "75% (Demo)"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
