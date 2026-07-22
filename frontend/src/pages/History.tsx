import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { Search, SlidersHorizontal, Calendar, ChevronRight, Trash2, RefreshCw } from "lucide-react";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/interview/history?limit=100");
      setInterviews(res.data);
    } catch (err) {
      console.error("Failed to load interview history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session record?")) return;
    try {
      await api.delete(`/interview/${id}`);
      setInterviews((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete interview.");
    }
  };

  const filteredInterviews = interviews.filter((i) => {
    const matchesSearch = i.interview_type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = categoryFilter === "all" || i.mode === categoryFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-6 flex-grow">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Interview History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Search, review, and filter through all your completed mock sessions.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by interview type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs glass-input"
            />
          </div>

          <div className="flex items-center space-x-3">
            <SlidersHorizontal className="text-slate-500" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Modes</option>
              <option value="voice">Voice Mode</option>
              <option value="coding">Coding Mode</option>
              <option value="video">Video Mode</option>
            </select>
          </div>
        </div>

        {/* List items */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="animate-spin text-primary-400" size={24} />
          </div>
        ) : filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredInterviews.map((int) => (
              <div
                key={int.id}
                onClick={() => navigate(int.status === "completed" ? `/report/${int.id}` : `/interview/${int.id}`)}
                className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{int.interview_type}</h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                      {new Date(int.created_at).toLocaleDateString()} • {int.difficulty} • Mode: {int.mode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 justify-between sm:justify-end">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    int.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                  }`}>
                    {int.status === "completed" ? "Completed" : "In Progress"}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(int.id, e)}
                      className="p-2 bg-slate-100 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/5 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-xs">
            No past interview sessions found matching your search.
          </div>
        )}
      </div>
    </Layout>
  );
};
export default History;
