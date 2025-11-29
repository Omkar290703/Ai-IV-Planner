
export enum BudgetType {
  CHEAP = 'Cheap',
  MODERATE = 'Moderate',
  LUXURY = 'Luxury'
}

export enum TravelerType {
  SOLO = 'Solo',
  COUPLE = 'Couple',
  FAMILY = 'Family',
  FRIENDS = 'Friends',
  STUDENTS = 'Students'
}

export interface FormData {
  destination: string;
  days: number;
  budget: BudgetType;
  travelers: TravelerType;
  travelerCount: number;
  industry: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: {
    time: string;
    description: string;
    location: string;
    type: 'visit' | 'food' | 'travel' | 'leisure';
    mapsUrl?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }[];
}

export interface CompanyInfo {
  name: string;
  description: string;
  website?: string;
  distance?: string;
  mapsUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BudgetBreakdown {
  travel: number;
  accommodation: number;
  food: number;
  activities: number;
  buffer: number;
  total: number;
  currency: string;
  tips: string[];
}

export interface ItineraryResult {
  destination: string;
  overview: string;
  days: DayPlan[];
}

export interface PhotoItem {
  id: string;
  url: string;
  date: string; // ISO string
  location: string;
  tags: string[];
}

// For state management
export type AppView = 'landing' | 'form' | 'loading' | 'results' | 'myTrips';

// New interface for saving to Firestore
export interface SavedTrip {
  id?: string;
  userId: string;
  destination: string;
  createdAt: any; // Timestamp
  formData: FormData;
  itinerary: ItineraryResult;
  companies: CompanyInfo[];
  budget: BudgetBreakdown | null;
  photos: PhotoItem[];
}
