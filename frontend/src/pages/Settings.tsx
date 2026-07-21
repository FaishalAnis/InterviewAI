import React, { useState } from "react";
import { useAuth } from "../store/authStore";
import { api } from "../services/api";
import { Layout } from "../components/layout/Layout";
import { Save, Key, Trash2, RefreshCw } from "lucide-react";

export const Settings: React.FC = () => {
  const { user, profile, updateProfile, logout } = useAuth();
  
  // Profile form states
  const [skillsText, setSkillsText] = useState(profile?.skills?.join(", ") || "");
  const [experience, setExperience] = useState(profile?.experience_years || 0);
  const [educationText, setEducationText] = useState(profile?.education?.join(", ") || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const skillsArray = skillsText.split(",").map((s) => s.trim()).filter((s) => s !== "");
      const educationArray = educationText.split(",").map((edu) => edu.trim()).filter((edu) => edu !== "");
      
      await updateProfile({
        skills: skillsArray,
        experience_years: Number(experience),
        education: educationArray
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Password change failed.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: Are you absolutely sure you want to delete your account? This action is permanent.")) return;
    try {
      await api.delete("/auth/delete-account");
      logout();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };

  return (
    <Layout>
      <div className="space-y-8 flex-grow max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Settings</h2>
          <p className="text-sm text-slate-400 mt-1">Configure profile details, manage access credentials, and close your account.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Profile form */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Save className="text-primary-400" size={16} />
              <span>Update Profile & Experience</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Key Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="Python, React, MongoDB"
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Education Background (Comma separated)</label>
                <input
                  type="text"
                  value={educationText}
                  onChange={(e) => setEducationText(e.target.value)}
                  placeholder="BS Computer Science, MS Software Engineering"
                  className="w-full px-4 py-2 rounded-xl text-xs glass-input"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl font-bold text-xs text-white gradient-btn flex items-center space-x-2 disabled:opacity-50"
              >
                {savingProfile ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Save Profile Details</span>
              </button>
            </form>
          </div>

          {/* Password Reset */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="text-indigo-400" size={16} />
              <span>Update Password Credentials</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2 rounded-xl text-xs glass-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center space-x-2 disabled:opacity-50"
              >
                {changingPassword ? <RefreshCw className="animate-spin" size={14} /> : <Key size={14} />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel rounded-3xl p-6 border border-rose-500/10 space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center space-x-2">
              <Trash2 className="text-rose-400" size={16} />
              <span>Danger Zone</span>
            </h3>
            
            <p className="text-xs text-slate-400">
              Permanently delete your profile, stats records, completed interviews, and account metadata. This cannot be undone.
            </p>

            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md transition flex items-center space-x-2"
            >
              <Trash2 size={14} />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Settings;
