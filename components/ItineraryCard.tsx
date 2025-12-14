import React from 'react';
import { DailyItinerary, Activity } from '../types';
import { GlobeAltIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'; // Using heroicons for better visual appeal
import { Input } from './Input'; // Import the Input component

interface ItineraryCardProps {
  dayPlan: DailyItinerary;
  actualCostsForDay: Map<number, number>; // Map<activityIndex, actualCost>
  onActualCostChange: (day: number, activityIndex: number, cost: number | undefined) => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ dayPlan, actualCostsForDay, onActualCostChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-indigo-100 flex flex-col h-full hover:shadow-2xl transition-all duration-300 ease-in-out">
      <h3 className="text-2xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
        Hari {dayPlan.day}
      </h3>
      <ul className="space-y-6 flex-grow">
        {dayPlan.activities.map((activity: Activity, index: number) => (
          <li key={index} className="flex flex-col p-4 bg-indigo-50 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-indigo-500 mr-2" title="Data diverifikasi real-time" />
              {activity.name}
            </h4>
            <div className="ml-8 space-y-2 text-gray-600">
              <p className="flex items-center text-base">
                <ClockIcon className="h-5 w-5 text-indigo-400 mr-2" />
                Jam: {activity.time}
              </p>
              <p className="flex items-center text-base">
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-400 mr-2" />
                Biaya Estimasi: {activity.cost}
              </p>
              <div className="flex items-center text-base">
                <Input
                  label="Biaya Aktual"
                  type="number"
                  placeholder="e.g., 50000"
                  value={actualCostsForDay.has(index) ? actualCostsForDay.get(index)!.toString() : ''}
                  onChange={(e) => onActualCostChange(dayPlan.day, index, e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  min="0"
                  className="w-full text-base py-1 px-2 mt-1"
                  id={`actual-cost-${dayPlan.day}-${index}`}
                />
              </div>

              {activity.link && (
                <a
                  href={activity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-full shadow-md hover:bg-indigo-700 transition duration-300 text-sm mt-3"
                >
                  Cek Harga
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
            </div>
            {activity.sources && activity.sources.length > 0 && (
              <div className="mt-3 ml-8 text-xs text-gray-500">
                <p className="font-semibold">Sumber:</p>
                <ul className="list-disc list-inside">
                  {activity.sources.map((source, srcIndex) => (
                    <li key={srcIndex}>
                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
                        {source.title || source.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};