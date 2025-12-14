import { DailyItinerary, Activity } from '../types';

/**
 * Parses the AI-generated Markdown string into a structured Itinerary object.
 * Assumes the Markdown follows the specified format:
 *
 * **Hari {Day Number}**
 * - **{Place/Activity Name}**: {Opening/Closing Hours} | Estimasi Biaya: {Estimated Cost} | [Cek Harga]({URL})
 *
 * @param markdownString The raw Markdown string from the AI.
 * @returns An array of DailyItinerary objects.
 */
export function parseItineraryMarkdown(markdownString: string): DailyItinerary[] {
  const dailyItineraries: DailyItinerary[] = [];
  const lines = markdownString.split('\n').filter(line => line.trim() !== '');

  let currentDay: DailyItinerary | null = null;

  lines.forEach(line => {
    // Match "Hari {Day Number}"
    const dayMatch = line.match(/^\*\*Hari (\d+)\*\*$/);
    if (dayMatch) {
      if (currentDay) {
        dailyItineraries.push(currentDay);
      }
      currentDay = {
        day: parseInt(dayMatch[1], 10),
        activities: [],
      };
      return; // Continue to the next line
    }

    // Match activity line: "- **{Name}**: {Time} | Estimasi Biaya: {Cost} | [Cek Harga]({URL})"
    const activityMatch = line.match(/^-\s+\*\*(.*?)\*\*\s*:\s*(.*?)\s*\|\s*Estimasi Biaya:\s*(.*?)\s*\|\s*\[Cek Harga\]\((.*?)\)$/);
    if (activityMatch && currentDay) {
      const name = activityMatch[1].trim();
      const time = activityMatch[2].trim();
      const cost = activityMatch[3].trim();
      const link = activityMatch[4].trim();

      const activity: Activity = {
        name,
        time,
        cost,
        link: link === '#' ? '' : link, // Use empty string if link is '#' placeholder
      };
      currentDay.activities.push(activity);
    }
  });

  if (currentDay) {
    dailyItineraries.push(currentDay);
  }

  return dailyItineraries;
}
