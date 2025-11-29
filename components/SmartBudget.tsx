import React from 'react';
import { BudgetBreakdown } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SmartBudgetProps {
  budget: BudgetBreakdown;
  travelerCount: number;
}

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#94a3b8'];

export const SmartBudget: React.FC<SmartBudgetProps> = ({ budget, travelerCount }) => {
  // Calculate totals based on traveler count
  const multiplier = Math.max(1, travelerCount);
  
  const data = [
    { name: 'Travel', value: budget.travel * multiplier, perPerson: budget.travel },
    { name: 'Stay', value: budget.accommodation * multiplier, perPerson: budget.accommodation },
    { name: 'Food', value: budget.food * multiplier, perPerson: budget.food },
    { name: 'Activities', value: budget.activities * multiplier, perPerson: budget.activities },
    { name: 'Buffer', value: budget.buffer * multiplier, perPerson: budget.buffer },
  ];

  const totalGroupCost = budget.total * multiplier;

  // Formatting helper for INR
  const formatMoney = (val: number) => {
    return val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div className="h-full space-y-8">
      {/* Top Banner: Per Person Contribution (As per screenshot) */}
      <div className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-xl p-6 text-center shadow-lg shadow-indigo-500/20 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="relative z-10">
             <h3 className="text-indigo-100 text-sm font-bold uppercase tracking-[0.2em] mb-2">Per Person Contribution</h3>
             <div className="text-4xl md:text-5xl font-bold text-white font-mono drop-shadow-md">
                {budget.currency} {formatMoney(budget.total)}
             </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* Left Side: Chart */}
        <div className="w-full lg:w-1/3 flex flex-col items-center bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Distribution Analysis</h4>
            <div className="w-full h-64 relative mb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number) => [`${budget.currency} ${formatMoney(value)}`, 'Total']}
                    />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest">Group Total</span>
                    <span className="text-white font-bold text-lg">{budget.currency} {formatMoney(totalGroupCost)}</span>
                </div>
            </div>
            
            <div className="mt-2 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Total Estimate for {travelerCount} Travelers
                </div>
            </div>
        </div>

        {/* Right Side: Detailed Table */}
        <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-slate-900/40 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/80 border-b border-slate-700">
                            <th className="p-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Category</th>
                            <th className="p-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right">Per Person</th>
                            <th className="p-4 text-slate-400 text-xs font-bold uppercase tracking-wider text-right bg-slate-800/60">Total ({travelerCount} Pax)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {data.map((item, idx) => (
                            <tr key={item.name} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: COLORS[idx] }}></div>
                                        <span className="text-slate-200 font-medium">{item.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-slate-300">
                                    {budget.currency} {formatMoney(item.perPerson)}
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-white bg-slate-800/20 border-l border-slate-800">
                                    {budget.currency} {formatMoney(item.value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-indigo-900/30 border-t-2 border-slate-600">
                        <tr>
                            <td className="p-4 font-bold text-white uppercase tracking-wider text-sm">Grand Total</td>
                            <td className="p-4 text-right font-bold text-indigo-300 font-mono text-lg border-t-2 border-indigo-500/20">
                                {budget.currency} {formatMoney(budget.total)}
                            </td>
                            <td className="p-4 text-right font-bold text-white font-mono text-xl border-l border-slate-700 border-t-2 border-indigo-500/20 bg-indigo-500/10">
                                {budget.currency} {formatMoney(totalGroupCost)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Tips Section */}
            <div className="bg-indigo-900/10 p-5 rounded-xl border border-indigo-500/20">
                <h4 className="text-sm font-bold text-indigo-300 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Money Saving Tips for {travelerCount} Travelers
                </h4>
                <ul className="space-y-2">
                    {budget.tips && budget.tips.length > 0 ? (
                        budget.tips.slice(0, 4).map((tip, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-300">
                                <span className="mr-2 text-indigo-500 mt-1">•</span>
                                {tip}
                            </li>
                        ))
                    ) : (
                        <li className="text-sm text-slate-500 italic">No specific tips available for this trip.</li>
                    )}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};