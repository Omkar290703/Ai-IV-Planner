import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const [text, setText] = useState("Initializing AI Core...");
  
  useEffect(() => {
    const messages = [
      "Analyzing Destination Parameters...",
      "Scanning Industrial Sector...",
      "Identifying Key Facilities...",
      "Optimizing Logistics Routes...",
      "Calculating Budget Trajectories...",
      "Rendering Visualization Models...",
      "Finalizing Itinerary Protocols..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      setText(messages[i]);
      i = (i + 1) % messages.length;
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Sci-Fi Loader Animation */}
        <div className="relative w-32 h-32 mb-12">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-2 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
            
            {/* Middle Ring */}
            <div className="absolute inset-4 border-2 border-slate-700 rounded-full"></div>
            <div className="absolute inset-4 border-b-2 border-purple-500 rounded-full animate-[spin_3s_linear_infinite]"></div>
            
            {/* Inner Ring */}
            <div className="absolute inset-8 border-2 border-slate-700 rounded-full"></div>
            <div className="absolute inset-8 border-l-2 border-cyan-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>
        </div>

        <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 uppercase">
                Generating Plan
            </h2>
            <div className="h-6 flex items-center justify-center">
                <p className="text-slate-400 font-mono text-sm tracking-wider animate-pulse">
                    {`> ${text}`}
                </p>
            </div>
        </div>
        
        {/* Progress Bar Decoration */}
        <div className="mt-12 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[width_2s_ease-in-out_infinite] w-1/3"></div>
        </div>
      </div>
    </div>
  );
};