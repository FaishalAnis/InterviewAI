import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const NotFound: React.FC = () => {
  return (
    <Layout>
      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-5 py-20">
        <div className="h-16 w-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center animate-bounce">
          <AlertCircle size={32} />
        </div>
        
        <h2 className="text-4xl font-extrabold text-white">404 - Page Not Found</h2>
        
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The evaluation coordinates you are searching for do not exist or have been removed.
        </p>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-xl font-bold text-xs text-slate-200 transition"
        >
          <ArrowLeft size={14} />
          <span>Return Home</span>
        </Link>
      </div>
    </Layout>
  );
};
export default NotFound;
