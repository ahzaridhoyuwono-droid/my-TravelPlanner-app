export interface Activity {
  name: string;
  time: string; // e.g., "09:00 - 17:00" or "Sepanjang hari"
  cost: string; // e.g., "JPY 400" (estimated cost from AI)
  actualCost?: number; // User-inputted actual cost
  link: string; // URL for checking price, currently a placeholder
  sources?: { uri: string; title: string }[]; // Optional: URLs from grounding
}

export interface DailyItinerary {
  day: number;
  activities: Activity[];
}

export interface Itinerary {
  dailyItineraries: DailyItinerary[];
  rawMarkdown: string; // Keep the raw markdown for debugging if needed
}

// The `window.aistudio` interface is assumed to be pre-configured and globally available
// by the execution environment or the Google AI Studio SDK.
// Therefore, explicitly declaring it here is unnecessary and can cause type conflicts.
// The existing declaration will be removed to resolve the error.
