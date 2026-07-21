import React, { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-darkBg text-slate-100">
      <Navbar />
      <main className="flex-grow pt-16 flex flex-col relative">
        {/* Glow spots */}
        <div className="glow-spot bg-primary-600 top-20 left-10" />
        <div className="glow-spot bg-indigo-600 bottom-20 right-10" />
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex-grow flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
export default Layout;
