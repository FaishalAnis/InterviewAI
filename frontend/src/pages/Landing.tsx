import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../store/authStore";
import { ShieldCheck, Cpu, Mic, Video, Code, FileText, ArrowRight } from "lucide-react";
import Layout from "../components/layout/Layout";

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/features") {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    } else if (location.pathname === "/pricing") {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    } else if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname]);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="text-center max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-primary-950/40 border border-primary-500/20 px-3 py-1 rounded-full text-xs font-semibold text-primary-300">
            <span>Powered by Gemini & GPT-4o</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
            Master Your Technical Interviews with <span className="gradient-text">InterviewAI</span>
          </h1>
          
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Practice realistic mock interviews under time-pressure. Receive structured feedback, AI voice conversations, webcam posture telemetry, and full-stack coding sandboxes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-6 py-3 gradient-btn rounded-xl font-bold text-white shadow-lg transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="flex items-center space-x-2 px-6 py-3 gradient-btn rounded-xl font-bold text-white shadow-lg transition"
                >
                  <span>Start Practicing Free</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl font-bold text-slate-200 transition"
                >
                  Schedule Demo
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-16 border-t border-white/5 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">Full-Stack SaaS Platform Built for Scale</h2>
          <p className="text-slate-400 mt-2">Everything you need to master behavioral, technical, and live coding challenges.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-primary-600/20 rounded-xl border border-primary-500/20 text-primary-400 mb-4">
              <Mic size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Voice & Conversation Pipeline</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Integrate local speech recognition and OpenAI Whisper API to conduct natural conversational style interviews with instant transcription.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-emerald-600/20 rounded-xl border border-emerald-500/20 text-emerald-400 mb-4">
              <Code size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Monaco Code Sandbox</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Solve algorithmic problems in python, javascript, C++, and Go inside a high-fidelity Monaco editor with automatic run & submit test case runner.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/20 text-indigo-400 mb-4">
              <Video size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Webcam Tracking & Posture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Evaluate behavioral criteria like eye-contact, smile rate, nervous gestures, speaking speed, and overall candidate confidence metrics in real-time.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-yellow-600/20 rounded-xl border border-yellow-500/20 text-yellow-400 mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Resume & JD Targeting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload CV documents or copy-paste target job details. Our LLMs tailor mock sessions targeting missing skills and past experience records.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/20 text-purple-400 mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Structured Evaluation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Get score breakdowns out of 100 for grammar, communication, problem-solving, depth of knowledge, and a printable PDF action checklist.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col items-start text-left">
            <div className="p-3 bg-rose-600/20 rounded-xl border border-rose-500/20 text-rose-400 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">SaaS Enterprise Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secured with CSRF, rate-limiters, security headers, password hashing, and clean async MongoDB Motor drivers.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-16 border-t border-white/5 text-center">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-white">SaaS Pricing Tiers</h2>
          <p className="text-slate-400 mt-2">Unlock unlimited mock interviews, CV adjustments, and download reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-8">
          {/* Free Tier */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col text-left">
            <h3 className="text-xl font-bold text-white">Starter</h3>
            <p className="text-xs text-slate-400 mt-1">Practice baseline interviews</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-slate-400 text-sm"> / month</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-grow">
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>2 Mock Interviews / month</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>Standard technical questions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>On-screen evaluation scores</span>
              </li>
            </ul>
            <Link
              to="/signup"
              className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold text-sm text-slate-200 transition border border-white/5"
            >
              Get Started
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="glass-panel p-8 rounded-2xl border border-primary-500/25 relative flex flex-col text-left">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-primary-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase text-white shadow-lg">
              Popular
            </div>
            <h3 className="text-xl font-bold text-white">Pro Coach</h3>
            <p className="text-xs text-slate-400 mt-1">Complete mock evaluation toolbox</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-white">$29</span>
              <span className="text-slate-400 text-sm"> / month</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-grow">
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>Unlimited Mock Interviews</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>Monaco Code sandbox compiling</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>Webcam & voice evaluation pipelines</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold">&#10003;</span>
                <span>PDF Report downloads</span>
              </li>
            </ul>
            <Link
              to="/signup"
              className="w-full text-center py-2.5 gradient-btn rounded-xl font-bold text-sm text-white shadow-md transition"
            >
              Unlock Pro Access
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Landing;
