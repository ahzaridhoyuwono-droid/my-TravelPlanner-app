import React, { useState, useCallback, useMemo } from 'react';
import { generateItinerary } from './services/geminiService';
import { Itinerary, DailyItinerary, Activity } from './types';
import { parseItineraryMarkdown } from './utils/markdownParser';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { ItineraryCard } from './components/ItineraryCard';
import { Loader } from './components/Loader';
import { parseCostString } from './utils/costParser';

function App() {
  const [destination, setDestination] = useState<string>('');
  const [duration, setDuration] = useState<number>(3);
  const [interests, setInterests] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState<number | ''>(''); // Optional total budget
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<boolean>(false);

  // Map to store actual costs: Map<dayNumber, Map<activityIndex, actualCost>>
  const [actualCostsData, setActualCostsData] = useState<Map<number, Map<number, number>>>(new Map());

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setSelectedApiKey(hasKey);
    } else {
      // If aistudio is not available, assume API key is handled externally or not required for some models.
      setSelectedApiKey(true);
    }
  }, []);

  // Check API key status on mount
  React.useEffect(() => {
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setSelectedApiKey(true); // Assume success after opening dialog, to mitigate race condition
    }
  }, []);

  const handleActualCostChange = useCallback((day: number, activityIndex: number, cost: number | undefined) => {
    setActualCostsData(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(day)) {
        newMap.set(day, new Map());
      }
      const dayActivities = newMap.get(day)!;
      if (cost !== undefined && !isNaN(cost)) {
        dayActivities.set(activityIndex, cost);
      } else {
        dayActivities.delete(activityIndex);
      }
      return newMap;
    });
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destination || !duration || !interests) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setItinerary(null);
    setActualCostsData(new Map()); // Reset actual costs for new itinerary

    try {
      const rawMarkdown = await generateItinerary(destination, duration, interests);
      const parsedItinerary = parseItineraryMarkdown(rawMarkdown);
      setItinerary({ dailyItineraries: parsedItinerary, rawMarkdown });
    } catch (err: any) {
      console.error("Error generating itinerary:", err);
      if (err.message && err.message.includes("Requested entity was not found.")) {
        // Specific error for API key issues
        setError("Kunci API tidak ditemukan atau tidak valid. Silakan pilih kunci API yang valid dari proyek GCP berbayar.");
        setSelectedApiKey(false); // Reset API key status
      } else {
        setError(`Gagal membuat rencana perjalanan. Silakan coba lagi. Detail: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [destination, duration, interests]);

  const calculateBudgetSummary = useMemo(() => {
    if (!itinerary || itinerary.dailyItineraries.length === 0) {
      return null;
    }

    let totalEstimatedCost = 0;
    let totalActualCost = 0;
    let currency = '';

    itinerary.dailyItineraries.forEach(dayPlan => {
      dayPlan.activities.forEach((activity, activityIndex) => {
        const parsedEstimatedCost = parseCostString(activity.cost);
        if (parsedEstimatedCost) {
          totalEstimatedCost += parsedEstimatedCost.amount;
          currency = parsedEstimatedCost.currency; // Assume single currency for the trip
        }

        const actualCost = actualCostsData.get(dayPlan.day)?.get(activityIndex);
        if (actualCost !== undefined) {
          totalActualCost += actualCost;
        } else if (parsedEstimatedCost) {
          // If no actual cost, use estimated for total actual calculation
          totalActualCost += parsedEstimatedCost.amount;
        }
      });
    });

    const parsedDuration = duration || 1; // Prevent division by zero if duration is 0
    const remainingBudget = (totalBudget !== '' ? totalBudget : totalActualCost) - totalActualCost;
    const averageDailyRemainingBudget = remainingBudget / parsedDuration;


    return {
      totalEstimatedCost: `${currency} ${totalEstimatedCost.toLocaleString()}`,
      totalActualCost: `${currency} ${totalActualCost.toLocaleString()}`,
      remainingBudget: `${currency} ${remainingBudget.toLocaleString()}`,
      averageDailyRemainingBudget: `${currency} ${averageDailyRemainingBudget.toLocaleString()}`,
      currency: currency,
    };
  }, [itinerary, actualCostsData, totalBudget, duration]);


  const ItineraryDisplay: React.FC<{ itinerary: Itinerary }> = ({ itinerary }) => (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {itinerary.dailyItineraries.map((dayPlan: DailyItinerary) => (
        <ItineraryCard
          key={dayPlan.day}
          dayPlan={dayPlan}
          actualCostsForDay={actualCostsData.get(dayPlan.day) || new Map()}
          onActualCostChange={handleActualCostChange}
        />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center text-indigo-700 mb-8 drop-shadow-lg">
        AI Travel Planner
      </h1>

      <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl mb-8 border border-indigo-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Tujuan Wisata"
            type="text"
            placeholder="e.g., Kyoto, Japan"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
          <Input
            label="Durasi (Hari)"
            type="number"
            placeholder="e.g., 5"
            value={duration.toString()}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            min="1"
            max="30"
            required
          />
          <Input
            label="Minat Khusus"
            type="text"
            placeholder="e.g., Kuliner dan Sejarah"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            required
          />
          <Input
            label="Total Budget (Opsional)"
            type="number"
            placeholder="e.g., 1000000 (IDR)"
            value={totalBudget === '' ? '' : totalBudget.toString()}
            onChange={(e) => setTotalBudget(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            min="0"
          />

          {!selectedApiKey && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-800 rounded-md">
              <p className="font-semibold mb-2">Penting: Pilih Kunci API Berbayar</p>
              <p className="mb-3">Untuk mengakses fitur AI ini, Anda perlu memilih kunci API dari proyek Google Cloud Platform (GCP) berbayar. Pastikan akun GCP Anda memiliki informasi penagihan yang aktif.</p>
              <Button
                onClick={handleSelectApiKey}
                type="button"
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
              >
                Pilih Kunci API
              </Button>
              <p className="mt-2">Pelajari lebih lanjut tentang penagihan: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-yellow-700 underline hover:text-yellow-900">ai.google.dev/gemini-api/docs/billing</a></p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !selectedApiKey}
            className={`w-full py-3 text-lg font-semibold rounded-lg shadow-lg transition duration-300
              ${loading || !selectedApiKey
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {loading ? 'Merencanakan...' : 'Rencanakan Perjalanan'}
          </Button>
        </form>

        {loading && (
          <div className="mt-8 flex justify-center">
            <Loader />
            <p className="ml-3 text-indigo-600 text-lg font-medium">Menganalisis data real-time...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {itinerary && itinerary.dailyItineraries.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-indigo-700 mb-8">
            Rencana Perjalanan Anda
          </h2>
          <ItineraryDisplay itinerary={itinerary} />

          {calculateBudgetSummary && (
            <div className="mt-12 bg-white p-6 md:p-8 rounded-xl shadow-2xl border border-indigo-200">
              <h3 className="text-2xl font-bold text-indigo-700 mb-6 border-b-2 border-indigo-200 pb-3">
                Ringkasan Budget
              </h3>
              <div className="space-y-3 text-lg text-gray-700">
                <p className="flex justify-between items-center">
                  <span className="font-semibold">Total Estimasi Biaya Seluruh Perjalanan (Subtotal):</span>
                  <span className="text-indigo-600 font-bold">{calculateBudgetSummary.totalEstimatedCost}</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="font-semibold">Total Biaya Aktual Seluruh Perjalanan:</span>
                  <span className="text-green-600 font-bold">{calculateBudgetSummary.totalActualCost}</span>
                </p>
                {totalBudget !== '' && (
                  <>
                    <p className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                      <span className="font-semibold">Total Budget Anda:</span>
                      <span className="text-purple-600 font-bold">{calculateBudgetSummary.currency} {(totalBudget as number).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-semibold">Sisa Budget:</span>
                      <span className={`font-bold ${parseFloat(calculateBudgetSummary.remainingBudget.replace(calculateBudgetSummary.currency, '').trim().replace(/,/g, '')) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {calculateBudgetSummary.remainingBudget}
                      </span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-semibold">Sisa Budget Harian Rata-rata:</span>
                      <span className={`font-bold ${parseFloat(calculateBudgetSummary.averageDailyRemainingBudget.replace(calculateBudgetSummary.currency, '').trim().replace(/,/g, '')) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {calculateBudgetSummary.averageDailyRemainingBudget}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;