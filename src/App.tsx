import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import StepIndicator from '@/components/StepIndicator';
import ImportExportBar from '@/components/ImportExportBar';
import AmapSettings from '@/pages/AmapSettings';
import InfoCollection from '@/pages/InfoCollection';
import TimeStatistics from '@/pages/TimeStatistics';
import LocationStatistics from '@/pages/LocationStatistics';
import Recommendation from '@/pages/Recommendation';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between py-2 gap-2 min-h-[48px]">
              <h1 className="text-base font-bold text-orange-400 shrink-0">聚了没</h1>
              <ImportExportBar />
            </div>
          </div>
        </header>

        <div className="border-b border-zinc-800/50">
          <div className="max-w-2xl mx-auto">
            <StepIndicator />
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<AmapSettings />} />
            <Route path="/info" element={<InfoCollection />} />
            <Route path="/time" element={<TimeStatistics />} />
            <Route path="/location" element={<LocationStatistics />} />
            <Route path="/result" element={<Recommendation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
