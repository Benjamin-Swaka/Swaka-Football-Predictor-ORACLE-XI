import { useState, useCallback, useRef } from 'react';
import { Team, Prediction } from './types';
import { generatePrediction } from './data/engine';
import MatchSelector from './components/MatchSelector';
import PredictionDashboard from './components/PredictionDashboard';

function Header() {
  return (
    <header className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-oracle-green/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-oracle-green/5 rounded-full blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-oracle-green/20 to-oracle-blue/20 border border-oracle-green/30 flex items-center justify-center animate-float">
              <span className="text-4xl">⚽</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-oracle-green animate-pulse flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-oracle-green/80" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3">
          <span className="gradient-text">ORACLE</span>
          <span className="text-oracle-text-dim">-</span>
          <span className="text-white">XI</span>
        </h1>
        <p className="text-oracle-text-dim text-sm md:text-base font-medium tracking-wide uppercase mb-2">
          Elite Football Match Predictor
        </p>
        <p className="text-oracle-text-dim/60 text-xs max-w-lg mx-auto leading-relaxed">
          Multi-layered prediction engine combining ELO ratings, Poisson distribution, xG analytics,
          and tactical analysis for evidence-based match forecasting.
        </p>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
          {[
            { label: 'Analytical Frameworks', value: '6' },
            { label: 'Data Points', value: '50+' },
            { label: 'Prediction Layers', value: '12' },
            { label: 'Confidence Tiers', value: '4' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <span className="text-lg md:text-2xl font-black text-oracle-green font-mono">{stat.value}</span>
              <span className="text-xs text-oracle-text-dim block mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handlePredict = useCallback((home: Team, away: Team) => {
    setIsLoading(true);
    setPrediction(null);

    // Simulate analysis time for UX
    setTimeout(() => {
      const result = generatePrediction(home, away);
      setPrediction(result);
      setIsLoading(false);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen bg-oracle-darker">
      <Header />

      {/* Match Selector */}
      <section className="py-8">
        <MatchSelector onPredict={handlePredict} isLoading={isLoading} />
      </section>

      {/* Loading state */}
      {isLoading && (
        <section className="py-12">
          <div className="max-w-md mx-auto text-center px-4">
            <div className="glass-card rounded-2xl p-8 animate-pulse-glow">
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-10 w-10 text-oracle-green" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-oracle-green font-semibold text-sm mb-2">🔍 Analyzing match data...</p>
              <div className="space-y-2 text-xs text-oracle-text-dim">
                <p className="animate-fade-in" style={{ animationDelay: '0ms' }}>▸ Computing Dynamic Match Ratings...</p>
                <p className="animate-fade-in" style={{ animationDelay: '300ms' }}>▸ Running Poisson Distribution Model...</p>
                <p className="animate-fade-in" style={{ animationDelay: '600ms' }}>▸ Calculating Expected Goals...</p>
                <p className="animate-fade-in" style={{ animationDelay: '900ms' }}>▸ Identifying value edges...</p>
                <p className="animate-fade-in" style={{ animationDelay: '1200ms' }}>▸ Stress testing scenarios...</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Prediction Results */}
      {prediction && !isLoading && (
        <section ref={resultsRef} className="py-8">
          <div className="max-w-5xl mx-auto px-4 mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-oracle-green/10 border border-oracle-green/30">
              <div className="w-2 h-2 rounded-full bg-oracle-green animate-pulse" />
              <span className="text-xs text-oracle-green font-semibold uppercase tracking-wider">Analysis Complete</span>
            </div>
          </div>
          <PredictionDashboard prediction={prediction} />
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-oracle-border/30">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-oracle-text-dim/40 text-xs">
            © {new Date().getFullYear()} ORACLE-XI | Precision. Probability. Profit.
          </p>
        </div>
      </footer>
    </div>
  );
}
