import React, { useState, useEffect } from "react";
import { useAuth } from "../store/authStore";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Users, Database, AlertCircle, RefreshCw, Ban } from "lucide-react";

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get("/admin/users");
      setUsers(usersRes.data);
      
      const analRes = await api.get("/admin/analytics");
      setAnalytics(analRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Forbidden access or server connectivity issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const handleBanToggle = async (userId: string, currentlyActive: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlyActive ? "BAN" : "UNBAN"} this user account?`)) return;
    try {
      await api.put(`/admin/users/${userId}/ban`, { ban: currentlyActive });
      // Update state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentlyActive } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to toggle ban status.");
    }
  };

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="text-rose-500" size={40} />
          <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">Access Denied. Admin Privileges Required.</span>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex-grow flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-primary-400" size={24} />
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading system management grids...</span>
        </div>
      </Layout>
    );
  }

  const metrics = analytics?.metrics || {};
  const chartData = analytics?.usage_chart || [];

  return (
    <Layout>
      <div className="space-y-8 flex-grow">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Shield className="text-rose-500" size={28} />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage system configurations, view analytical traffic and ban accounts.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-450 text-xs rounded-xl flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="text-rose-500 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Analytical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider font-mono">Total Platform Users</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{metrics.total_users || 0} Registered</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider font-mono">Mock Interviews Taken</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{metrics.total_interviews || 0} Sessions</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider font-mono">Report Documents Generated</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white">{metrics.total_reports || 0} Evaluated</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User management list */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">User Database Directory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase">
                    <th className="py-2.5">User Details</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="text-slate-800 dark:text-slate-200">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{u.full_name || "Name not set"}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3 capitalize">{u.role}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.is_active ? "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/25 text-rose-600 dark:text-rose-400"
                        }`}>
                          {u.is_active ? "Active" : "Banned"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleBanToggle(u.id, u.is_active)}
                          className={`p-1.5 rounded-lg border transition ${
                            u.is_active
                              ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:bg-rose-100 dark:hover:bg-rose-950/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                              : "bg-emerald-100 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
                          }`}
                        >
                          <Ban size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System logs or usage graphs */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Traffic Usage Rate</h3>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="timestamp" stroke="#4b5563" fontSize={9} />
                  <YAxis stroke="#4b5563" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: "#161d30", borderColor: "rgba(255,255,255,0.08)" }} />
                  <Bar dataKey="requests" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 space-y-2">
              <div>API health status: <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">Active</span></div>
              <div>Database transactions: <span className="text-slate-800 dark:text-white">Motor Async Client loop connected</span></div>
              <div>Celery task queue status: <span className="text-indigo-600 dark:text-indigo-400">Idle (0 pending)</span></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Admin;
