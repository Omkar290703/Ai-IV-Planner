
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, ItineraryResult, BudgetBreakdown, CompanyInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK DATA GENERATORS (Fallback for Quota Exceeded) ---

const getMockItinerary = (destination: string, industry: string): ItineraryResult => ({
  destination: destination,
  overview: `(SIMULATED MODE: API Quota Exceeded) Welcome to ${destination}! This is a generated sample itinerary focusing on the ${industry} sector. Enjoy a curated mix of industrial insights and local culture exploration.`,
  days: [
    {
      day: 1,
      title: "Industry Orientation & City Scoping",
      activities: [
        { 
            time: "09:00 AM", 
            description: `Introduction to ${industry} ecosystem at the Innovation Hub.`, 
            location: `${destination} Tech Park`, 
            type: "visit",
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Tech+Park`,
            coordinates: { lat: 20.5937, lng: 78.9629 } 
        },
        { 
            time: "01:00 PM", 
            description: "Networking Lunch at Business District.", 
            location: "Central Plaza Dining", 
            type: "food",
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Center`,
            coordinates: { lat: 20.6000, lng: 78.9700 }
        },
        { 
            time: "03:30 PM", 
            description: "City Landmark Sightseeing and Cultural Walk.", 
            location: `${destination} City Center`, 
            type: "leisure",
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+City+Center`,
            coordinates: { lat: 20.6100, lng: 78.9800 }
        }
      ]
    },
    {
      day: 2,
      title: "Deep Dive: Manufacturing & Operations",
      activities: [
        { 
            time: "10:00 AM", 
            description: "Guided tour of a leading manufacturing facility.", 
            location: "Industrial Zone Phase 1", 
            type: "visit",
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Industrial+Zone`,
            coordinates: { lat: 20.5800, lng: 78.9500 }
        },
        { 
            time: "02:00 PM", 
            description: "Transit to secondary site.", 
            location: "Highway Route", 
            type: "travel",
            mapsUrl: "",
            coordinates: { lat: 20.5700, lng: 78.9400 }
        },
        { 
            time: "03:00 PM", 
            description: "Workshop on Supply Chain Management.", 
            location: "Logistics Center", 
            type: "visit",
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Logistics`,
            coordinates: { lat: 20.5600, lng: 78.9300 }
        }
      ]
    }
  ]
});

const getMockCompanies = (destination: string, industry: string): CompanyInfo[] => [
    {
        name: "Apex Industries Ltd.",
        description: `A leading player in the ${industry} sector known for automated production lines.`,
        website: "https://example.com",
        distance: "5 km from center",
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Industry`,
        coordinates: { lat: 20.5937, lng: 78.9629 }
    },
    {
        name: "Global Tech Solutions",
        description: "Innovative hub focusing on R&D and sustainable practices.",
        website: "https://example.com",
        distance: "8 km from center",
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Tech`,
        coordinates: { lat: 20.6100, lng: 78.9800 }
    },
    {
        name: "Future Systems Corp",
        description: "Specializes in export-quality goods and large-scale operations.",
        website: "https://example.com",
        distance: "12 km from center",
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${destination}+Systems`,
        coordinates: { lat: 20.5500, lng: 78.9200 }
    }
];

const getMockBudget = (): BudgetBreakdown => ({
    travel: 1200,
    accommodation: 2500,
    food: 1500,
    activities: 500,
    buffer: 1000,
    total: 6700,
    currency: "INR",
    tips: [
        "Book industrial visits in advance to save on entry fees.",
        "Use local public transport for commuting between zones.",
        "Look for corporate discounts at business hotels.",
        "Eat at factory canteens if permitted for subsidized meals."
    ]
});

// --- HELPER FUNCTIONS ---

// Robust JSON Extractor
const extractJson = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '');
  
  // Find first '{' or '['
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  
  let start = -1;
  if (startObj !== -1 && startArr !== -1) {
    start = Math.min(startObj, startArr);
  } else if (startObj !== -1) {
    start = startObj;
  } else if (startArr !== -1) {
    start = startArr;
  }

  // Find last '}' or ']'
  const endObj = cleaned.lastIndexOf('}');
  const endArr = cleaned.lastIndexOf(']');
  
  let end = -1;
  if (endObj !== -1 && endArr !== -1) {
    end = Math.max(endObj, endArr);
  } else if (endObj !== -1) {
    end = endObj;
  } else if (endArr !== -1) {
    end = endArr;
  }

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  
  return cleaned.trim(); // Fallback to trimmed text
};

const isQuotaExceeded = (error: any): boolean => {
  // Check standard status
  if (error.status === 429) return true;
  
  // Check nested error object (Common in Google GenAI errors)
  if (error.error && error.error.code === 429) return true;
  if (error.error && error.error.status === "RESOURCE_EXHAUSTED") return true;

  // Check message strings
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("exhausted");
};

// 1. Generate Structured Itinerary with Maps Grounding
export const generateItinerary = async (data: FormData): Promise<ItineraryResult> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `Plan a ${data.days}-day industrial visit trip to ${data.destination} for a ${data.travelers} group. 
  The focus industry is ${data.industry}. The budget level is ${data.budget}.
  
  You are an expert travel planner with access to Google Maps and Google Search.
  Use Google Maps to find REAL and EXISTING locations for industrial visits, restaurants, and sightseeing.
  
  Return a VALID JSON object (no markdown formatting) with the following structure:
  {
    "destination": "City Name",
    "overview": "Brief summary",
    "days": [
      {
        "day": 1,
        "title": "Day Title",
        "activities": [
          {
            "time": "09:00 AM",
            "description": "Activity details",
            "location": "Real Place Name found on Maps",
            "mapsUrl": "The Google Maps link for the location",
            "coordinates": { "lat": 12.34, "lng": 56.78 },
            "type": "visit" | "food" | "travel" | "leisure"
          }
        ]
      }
    ]
  }
  
  IMPORTANT: You MUST provide 'coordinates' (lat/lng) for every activity so they can be plotted on a map.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {}, googleSearch: {} }],
      }
    });

    if (!response.text) {
      console.warn("Gemini returned empty text for itinerary.");
      throw new Error("Empty response");
    }
    
    const text = extractJson(response.text);
    const parsed = JSON.parse(text);
    
    // Validation
    if (!parsed.days || !Array.isArray(parsed.days)) parsed.days = [];
    parsed.days.forEach((day: any) => {
        if (!day.activities) day.activities = [];
    });

    return parsed;

  } catch (error: any) {
    console.error("Itinerary Generation/Parsing Error:", error);
    
    if (isQuotaExceeded(error)) {
        console.warn("Quota exceeded. Returning mock itinerary.");
        return getMockItinerary(data.destination, data.industry);
    }

    // Default Fallback
    return getMockItinerary(data.destination, data.industry);
  }
};

// 2. Find Real Companies (Grounding with Maps)
export const findCompanies = async (data: FormData): Promise<CompanyInfo[]> => {
  const model = "gemini-2.5-flash"; 
  
  const prompt = `Find top 3 real companies or factories in the ${data.industry} sector located in or very near ${data.destination} that allow industrial visits.
  Use Google Maps and Google Search to verify their existence, location, and details.
  
  Return a VALID JSON array (no markdown) where each object has:
  - "name": Company Name
  - "description": Brief description
  - "website": Website URL (if available)
  - "distance": Distance from city center
  - "mapsUrl": Google Maps Link
  - "coordinates": { "lat": number, "lng": number }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {}, googleSearch: {} }],
      }
    });

    if (!response.text) return getMockCompanies(data.destination, data.industry);

    const text = extractJson(response.text);
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];

  } catch (error: any) {
    console.error("Failed to parse companies JSON", error);
    if (isQuotaExceeded(error)) {
        return getMockCompanies(data.destination, data.industry);
    }
    return getMockCompanies(data.destination, data.industry);
  }
};

// 3. Smart Budget Calculator (Kept on Flash, pure text/json generation)
export const calculateBudget = async (data: FormData): Promise<BudgetBreakdown> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `Create a detailed estimated budget breakdown for a ${data.days}-day trip to ${data.destination} for ${data.travelerCount} people (${data.travelers} group type).
  Budget Level: ${data.budget}.
  Industry Focus: ${data.industry}.
  
  Calculate the estimated cost *per person* in Indian Rupees (INR).
  IMPORTANT: Since there are ${data.travelerCount} travelers, consider shared costs (like hotel rooms, taxi fare splitting) to give a realistic per-person estimate.
  
  Return the PER PERSON costs for:
  - travel (local transport/fuel)
  - accommodation (share per person)
  - food
  - activities (entry fees)
  - buffer (emergency funds)
  - total (sum of above)
  
  Also provide a list of budget saving tips specific to this destination.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            travel: { type: Type.NUMBER },
            accommodation: { type: Type.NUMBER },
            food: { type: Type.NUMBER },
            activities: { type: Type.NUMBER },
            buffer: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (!response.text) throw new Error("No budget data returned");
    
    const parsed = JSON.parse(response.text);
    if (!parsed.currency) parsed.currency = 'INR';
    if (!parsed.tips || !Array.isArray(parsed.tips)) parsed.tips = [];
    
    return parsed;
  } catch (error: any) {
      console.error("Budget Parsing Error", error);
      if (isQuotaExceeded(error)) {
        return getMockBudget();
      }
      return getMockBudget();
  }
};

// 4. Generate Visualization Image (Photo Album)
export const generateTripImage = async (prompt: string): Promise<string | null> => {
  try {
    const model = "gemini-2.5-flash-image";
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    // Find image part
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    // Images are optional, return null gracefully
    return null;
  }
};
