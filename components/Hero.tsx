import React from 'react';

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Grid and Glow */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e520_1px,transparent_1px),linear-gradient(to_bottom,#4f46e520_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="mb-6 inline-flex items-center space-x-2 bg-indigo-900/40 border border-indigo-500/30 rounded-full px-4 py-2 text-indigo-300 text-sm font-medium backdrop-blur-sm">
          <span>🚀</span>
          <span>Next Gen AI Industrial Planner</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
            Discover Your Next
          </span>
          <br />
          Industrial Adventure
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Plan tailored industrial visits, student educational tours, and corporate insights. 
          Powered by Gemini to give you itineraries, smart budgets, and geo-tagged company discovery.
        </p>
        
        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
        >
          <div className="absolute -inset-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 opacity-20 group-hover:opacity-40 blur transition duration-200" />
          <span>Start Planning</span>
          <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Dashboard Preview Mockup - Updated to match Screenshot Layout */}
        <div className="mt-16 mx-auto max-w-5xl transform hover:scale-[1.01] transition duration-500">
           {/* Outer Glow Border Container */}
           <div className="relative rounded-xl p-[1px] bg-gradient-to-b from-indigo-500/50 to-purple-500/10 shadow-2xl">
              <div className="rounded-xl bg-slate-900/90 backdrop-blur-xl p-4 md:p-6 border border-slate-800">
                 
                 {/* The Dashboard Grid Layout */}
                 <div className="aspect-[16/9] grid grid-cols-12 gap-4 md:gap-6 bg-slate-950/50 rounded-lg p-4 md:p-6 border border-slate-800/50 relative overflow-hidden">
                    
                    {/* Background Grid Pattern inside Dashboard */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>

                    {/* Sidebar (Left Column) */}
                    <div className="col-span-3 bg-slate-800/40 rounded-lg border border-slate-700/30 flex flex-col gap-3 p-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-700/50 mb-4"></div>
                        <div className="h-2 w-3/4 bg-slate-700/50 rounded"></div>
                        <div className="h-2 w-1/2 bg-slate-700/50 rounded"></div>
                        <div className="h-2 w-2/3 bg-slate-700/50 rounded"></div>
                        <div className="mt-auto h-2 w-full bg-slate-700/30 rounded"></div>
                    </div>

                    {/* Right Content Area */}
                    <div className="col-span-9 flex flex-col gap-4 md:gap-6">
                        
                        {/* Top Header Row */}
                        <div className="h-1/3 bg-slate-800/40 rounded-lg border border-slate-700/30 p-4 flex items-center justify-between">
                            <div className="space-y-2 w-1/2">
                                <div className="h-3 w-1/3 bg-slate-700/50 rounded animate-pulse"></div>
                                <div className="h-2 w-2/3 bg-slate-700/30 rounded animate-pulse delay-75"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded bg-slate-700/30"></div>
                                <div className="w-8 h-8 rounded bg-slate-700/30"></div>
                            </div>
                        </div>

                        {/* Bottom Grid Row */}
                        <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6">
                            
                            {/* Card 1: The AI Robot (Matches 'Add the image' from screenshot) */}
                            <div className="relative bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-lg border border-indigo-500/30 flex items-center justify-center overflow-hidden group">
                                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {/* 3D Robot Image */}
                                <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center">
                                    <img 
                                      src="https://img.freepik.com/free-photo/3d-render-cute-robot-with-graduation-cap-diploma_107791-16629.jpg?t=st=1725540000~exp=1725543600~hmac=abc" 
                                      alt="AI Planner Robot"
                                      className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] filter contrast-110"
                                      onError={(e) => {
                                        // Fallback if image fails
                                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/4712/4712038.png";
                                      }}
                                    />
                                </div>
                                {/* Label mimicking 'Add the image' but as a feature label */}
                                <div className="absolute bottom-2 left-0 right-0 text-center">
                                    <span className="text-[10px] uppercase tracking-widest text-indigo-300/60 font-bold">AI Assistant</span>
                                </div>
                            </div>

                            {/* Card 2: Placeholder Stats */}
                            <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 p-4 flex flex-col justify-end">
                                <div className="flex items-end gap-2 h-full justify-center pb-2 px-4">
                                    <div className="w-1/4 h-1/3 bg-emerald-500/20 rounded-t border-t border-x border-emerald-500/30 animate-[pulse_2s_infinite]"></div>
                                    <div className="w-1/4 h-2/3 bg-emerald-500/20 rounded-t border-t border-x border-emerald-500/30 animate-[pulse_2s_infinite_0.2s]"></div>
                                    <div className="w-1/4 h-1/2 bg-emerald-500/20 rounded-t border-t border-x border-emerald-500/30 animate-[pulse_2s_infinite_0.4s]"></div>
                                </div>
                                <div className="h-2 w-full bg-slate-700/30 rounded mt-2"></div>
                            </div>
                        </div>
                    </div>

                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};