import React, { useState } from 'react';
import { BudgetType, TravelerType, FormData } from '../types';

interface TripFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  onBack: () => void;
  initialData?: FormData;
}

const INDUSTRIES = [
  "Software & IT",
  "Fintech",
  "Manufacturing",
  "Automobile",
  "Textile",
  "Agriculture",
  "Biotech",
  "Aerospace",
  "Consulting"
];

// Mock data for destination suggestions to simulate search engine behavior
const CITIES = [
  "Pune, Maharashtra", "Mumbai, Maharashtra", "Bangalore, Karnataka", "Delhi, India",
  "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Kolkata, West Bengal", 
  "Ahmedabad, Gujarat", "Jaipur, Rajasthan", "Silicon Valley, USA", "Tokyo, Japan",
  "Berlin, Germany", "Singapore", "London, UK", "New York, USA", "Dubai, UAE"
];

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, isLoading, onBack, initialData }) => {
  const [formData, setFormData] = useState<FormData>(initialData || {
    destination: '',
    days: 3,
    budget: BudgetType.MODERATE,
    travelers: TravelerType.STUDENTS,
    travelerCount: 2,
    industry: 'Software & IT'
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({...formData, destination: val});
    
    if (val.length > 0) {
      const filtered = CITIES.filter(city => city.toLowerCase().includes(val.toLowerCase()));
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setFormData({...formData, destination: city});
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 relative">
       {/* Back Button */}
       <button 
        onClick={onBack}
        className="absolute top-8 left-0 lg:-left-16 p-2 text-slate-400 hover:text-white transition-colors group"
        title="Back"
      >
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </div>
            <span className="hidden lg:inline text-sm font-medium opacity-0 lg:group-hover:opacity-100 transition-opacity">Back</span>
         </div>
      </button>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Tell us your travel preferences 🏭 🌴</h2>
        <p className="text-slate-400">Provide basic info, and our AI planner will curate a custom industrial itinerary.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-800/40 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-xl">
        
        {/* Destination with Autocomplete */}
        <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Where do you want to go?</label>
            <input 
                type="text"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="e.g. Pune"
                value={formData.destination}
                onChange={handleDestinationChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
            />
            {showSuggestions && filteredCities.length > 0 && (
              <ul className="absolute z-50 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                {filteredCities.map((city, idx) => (
                  <li 
                    key={idx}
                    onClick={() => selectCity(city)}
                    className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-slate-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {city}
                  </li>
                ))}
              </ul>
            )}
        </div>

        {/* Industry Selection - Free Text with Datalist */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Industry for Visit</label>
            <div className="relative">
                <input 
                    list="industry-options"
                    type="text"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Type or select an industry..."
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                />
                <datalist id="industry-options">
                    {INDUSTRIES.map(ind => <option key={ind} value={ind} />)}
                </datalist>
            </div>
        </div>

        {/* Number of Travelers - Numeric Input Only */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Number of Travelers</label>
            <input 
                type="number"
                min={1}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.travelerCount}
                onChange={(e) => setFormData({...formData, travelerCount: parseInt(e.target.value) || 1})}
            />
        </div>

        {/* Days */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Days)</label>
            <input 
                type="number"
                min={1}
                max={14}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.days}
                onChange={(e) => setFormData({...formData, days: parseInt(e.target.value) || 1})}
            />
        </div>

        {/* Budget */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Budget Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(BudgetType).map((b) => (
                    <button
                        key={b}
                        type="button"
                        onClick={() => setFormData({...formData, budget: b})}
                        className={`p-4 rounded-xl border text-left transition-all ${
                            formData.budget === b 
                            ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                            : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                        }`}
                    >
                        <div className="font-semibold text-lg">{b}</div>
                        <div className="text-xs opacity-70 mt-1">
                            {b === 'Cheap' ? 'Cost conscious' : b === 'Moderate' ? 'Balanced spending' : 'Luxury experience'}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Itinerary...
                </>
            ) : 'Generate Trip Plan'}
        </button>
      </form>
    </div>
  );
};