import { Prediction } from '../types';

function Section({ title, icon, children, delay = 0 }: { title: string; icon: string; children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="px-6 py-4 border-b border-oracle-border/60 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-oracle-text">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = '#00ff88' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function ConfidenceBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    'ELITE': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    'HIGH': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'MODERATE': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    'LOW': 'bg-red-500/20 text-red-400 border-red-500/40',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[tier] || styles['LOW']}`}>
      {tier}
    </span>
  );
}

function TeamBadgeSmall({ shortName, color }: { shortName: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs tracking-wide"
      style={{ backgroundColor: color + '22', border: `2px solid ${color}`, color }}
    >
      {shortName}
    </div>
  );
}

export default function PredictionDashboard({ prediction: p }: { prediction: Prediction }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 space-y-6 pb-12">
      {/* Match Header */}
      <div className="prediction-hero rounded-2xl p-6 md:p-8 animate-slide-up">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <TeamBadgeSmall shortName={p.homeTeam.shortName} color={p.homeTeam.color} />
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-black text-white">{p.homeTeam.name}</h2>
              <p className="text-oracle-text-dim text-xs">{p.homeTeam.stadium}, {p.homeTeam.city}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black gradient-text">VS</span>
            <span className="text-oracle-text-dim text-xs mt-1">{p.homeTeam.league}</span>
          </div>
          <div className="flex items-center gap-4 flex-row-reverse md:flex-row">
            <div className="text-center md:text-right">
              <h2 className="text-xl md:text-2xl font-black text-white">{p.awayTeam.name}</h2>
              <p className="text-oracle-text-dim text-xs">{p.awayTeam.league}</p>
            </div>
            <TeamBadgeSmall shortName={p.awayTeam.shortName} color={p.awayTeam.color} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-oracle-border/40 flex flex-wrap justify-center gap-4 md:gap-8 text-xs text-oracle-text-dim">
          <span>📅 {today}</span>
          <span>🏟️ {p.homeTeam.stadium}</span>
          <span>🕐 Analysis generated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Primary Prediction Hero */}
      <div
        className="rounded-2xl p-6 md:p-8 animate-slide-up animate-pulse-glow"
        style={{
          animationDelay: '100ms', animationFillMode: 'both',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(59,130,246,0.06))',
          border: '1px solid rgba(0,255,136,0.3)',
        }}
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-oracle-green mb-3 font-semibold">🏆 Oracle-XI Primary Prediction</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-3xl md:text-4xl font-black text-white">{p.primaryResult}</h2>
            <ConfidenceBadge tier={p.confidenceTier} />
          </div>
          <p className="text-5xl md:text-6xl font-black gradient-text mb-4 font-mono">{p.primaryScoreline}</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-oracle-text-dim text-sm">Confidence:</span>
            <span className="text-oracle-green font-bold text-lg font-mono">{p.confidenceScore}%</span>
          </div>
          <div className="max-w-xl mx-auto mb-4">
            <ProgressBar value={p.confidenceScore} color={
              p.confidenceTier === 'ELITE' ? '#10b981' :
              p.confidenceTier === 'HIGH' ? '#3b82f6' :
              p.confidenceTier === 'MODERATE' ? '#f59e0b' : '#ef4444'
            } />
          </div>
          <p className="text-oracle-text-dim text-sm max-w-2xl mx-auto leading-relaxed">{p.reasoning}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DMR Ratings */}
        <Section title="Dynamic Match Ratings" icon="📊" delay={200}>
          <div className="overflow-x-auto">
            <table className="w-full stat-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-center">{p.homeTeam.shortName} (H)</th>
                  <th className="text-center">{p.awayTeam.shortName} (A)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-white">DMR Score</td>
                  <td className="text-center">
                    <span className="font-mono font-bold text-oracle-green text-lg">{p.homeDMR}</span>
                    <span className="text-oracle-text-dim text-xs">/100</span>
                  </td>
                  <td className="text-center">
                    <span className="font-mono font-bold text-oracle-blue text-lg">{p.awayDMR}</span>
                    <span className="text-oracle-text-dim text-xs">/100</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold text-white">Form Rating</td>
                  <td className="text-center font-mono">{p.homeFormRating}/10</td>
                  <td className="text-center font-mono">{p.awayFormRating}/10</td>
                </tr>
                <tr>
                  <td className="font-semibold text-white">Squad Strength</td>
                  <td className="text-center font-mono">{p.homeSquadStrength}/10</td>
                  <td className="text-center font-mono">{p.awaySquadStrength}/10</td>
                </tr>
                <tr>
                  <td className="font-semibold text-white">Tactical Edge</td>
                  <td className="text-center font-mono">{p.homeTacticalEdge}/10</td>
                  <td className="text-center font-mono">{p.awayTacticalEdge}/10</td>
                </tr>
                <tr>
                  <td className="font-semibold text-white">Overall Edge</td>
                  <td colSpan={2} className="text-center">
                    <span className={`font-bold text-lg ${
                      p.overallEdge === 'HOME' ? 'text-oracle-green' :
                      p.overallEdge === 'AWAY' ? 'text-oracle-blue' : 'text-oracle-amber'
                    }`}>
                      {p.overallEdge === 'HOME' ? `⬅ ${p.homeTeam.shortName}` :
                       p.overallEdge === 'AWAY' ? `${p.awayTeam.shortName} ➡` : '⚖ EVEN'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* DMR Visual Bar */}
          <div className="mt-4 pt-4 border-t border-oracle-border/40">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-oracle-green w-8">{p.homeDMR}</span>
              <div className="flex-1 h-4 rounded-full bg-oracle-card overflow-hidden flex">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${(p.homeDMR / (p.homeDMR + p.awayDMR)) * 100}%`,
                    background: `linear-gradient(90deg, ${p.homeTeam.color}, ${p.homeTeam.color}88)`,
                  }}
                />
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${(p.awayDMR / (p.homeDMR + p.awayDMR)) * 100}%`,
                    background: `linear-gradient(90deg, ${p.awayTeam.color}88, ${p.awayTeam.color})`,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-oracle-blue w-8 text-right">{p.awayDMR}</span>
            </div>
          </div>
        </Section>

        {/* Scoreline Probabilities */}
        <Section title="Predicted Scoreline Probabilities (Top 6)" icon="🎯" delay={300}>
          <div className="space-y-3">
            {p.scorelines.map((sl, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-oracle-text-dim text-xs font-mono w-4">{i + 1}.</span>
                <div className="flex items-center gap-2 w-20">
                  <span className="text-white font-bold font-mono text-lg">{sl.home}</span>
                  <span className="text-oracle-text-dim">-</span>
                  <span className="text-white font-bold font-mono text-lg">{sl.away}</span>
                </div>
                <div className="flex-1">
                  <ProgressBar
                    value={sl.probability}
                    max={p.scorelines[0].probability * 1.2}
                    color={i === 0 ? '#00ff88' : i === 1 ? '#3b82f6' : '#94a3b8'}
                  />
                </div>
                <span className={`font-mono font-bold text-sm w-14 text-right ${
                  i === 0 ? 'text-oracle-green' : i === 1 ? 'text-oracle-blue' : 'text-oracle-text-dim'
                }`}>
                  {sl.probability.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Outcome Probabilities */}
      <Section title="Outcome Probabilities" icon="📈" delay={400}>
        <div className="overflow-x-auto">
          <table className="w-full stat-table">
            <thead>
              <tr>
                <th>Outcome</th>
                <th className="text-center">My Model %</th>
                <th className="text-center">Bookmaker Implied %</th>
                <th className="text-center">Edge</th>
                <th className="text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              {p.outcomes.map((o, i) => (
                <tr key={i}>
                  <td className="font-semibold text-white">{o.outcome}</td>
                  <td className="text-center">
                    <span className="font-mono font-bold text-oracle-green">{o.modelPct.toFixed(1)}%</span>
                  </td>
                  <td className="text-center">
                    <span className="font-mono text-oracle-text-dim">{o.bookmakerPct.toFixed(1)}%</span>
                  </td>
                  <td className="text-center">
                    <span className={`font-mono font-bold ${o.edge > 0 ? 'text-emerald-400' : o.edge < -2 ? 'text-red-400' : 'text-oracle-text-dim'}`}>
                      {o.edge > 0 ? '+' : ''}{o.edge.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    {o.edge > 5 ? (
                      <span className="text-emerald-400 text-xs font-bold">✅ VALUE</span>
                    ) : o.edge < -3 ? (
                      <span className="text-red-400 text-xs font-bold">❌ AVOID</span>
                    ) : (
                      <span className="text-oracle-text-dim text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Visual outcome bars */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {p.outcomes.map((o, i) => {
            const colors = ['#00ff88', '#f59e0b', '#3b82f6'];
            const labels = [p.homeTeam.shortName + ' Win', 'Draw', p.awayTeam.shortName + ' Win'];
            return (
              <div key={i} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e2a3a" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke={colors[i]}
                      strokeWidth="3"
                      strokeDasharray={`${o.modelPct} ${100 - o.modelPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono font-bold text-sm text-white">{o.modelPct.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-xs text-oracle-text-dim">{labels[i]}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Market Analysis */}
        <Section title="Goals Market Analysis" icon="⚡" delay={500}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-oracle-card/50 rounded-lg">
              <span className="text-sm text-oracle-text-dim">Expected Goals</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold" style={{ color: p.homeTeam.color }}>{p.expectedGoalsHome}</span>
                <span className="text-oracle-text-dim text-xs">—</span>
                <span className="font-mono font-bold" style={{ color: p.awayTeam.color }}>{p.expectedGoalsAway}</span>
                <span className="text-oracle-text-dim text-xs ml-1">(Total: {(p.expectedGoalsHome + p.expectedGoalsAway).toFixed(2)})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-oracle-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-oracle-text-dim">Over 2.5</span>
                  <span className="font-mono font-bold text-oracle-green text-sm">{p.over25Prob}%</span>
                </div>
                <ProgressBar value={p.over25Prob} color="#00ff88" />
              </div>
              <div className="p-3 bg-oracle-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-oracle-text-dim">Under 2.5</span>
                  <span className="font-mono font-bold text-oracle-blue text-sm">{p.under25Prob}%</span>
                </div>
                <ProgressBar value={p.under25Prob} color="#3b82f6" />
              </div>
              <div className="p-3 bg-oracle-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-oracle-text-dim">BTTS Yes</span>
                  <span className="font-mono font-bold text-oracle-purple text-sm">{p.bttsProb}%</span>
                </div>
                <ProgressBar value={p.bttsProb} color="#a855f7" />
              </div>
              <div className="p-3 bg-oracle-card/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-oracle-text-dim">BTTS No</span>
                  <span className="font-mono font-bold text-oracle-amber text-sm">{(100 - p.bttsProb).toFixed(1)}%</span>
                </div>
                <ProgressBar value={100 - p.bttsProb} color="#f59e0b" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-oracle-card/50 rounded-lg text-center">
                <span className="text-xs text-oracle-text-dim block mb-1">Clean Sheet {p.homeTeam.shortName}</span>
                <span className="font-mono font-bold text-lg text-white">{p.cleanSheetHome}%</span>
              </div>
              <div className="flex-1 p-3 bg-oracle-card/50 rounded-lg text-center">
                <span className="text-xs text-oracle-text-dim block mb-1">Clean Sheet {p.awayTeam.shortName}</span>
                <span className="font-mono font-bold text-lg text-white">{p.cleanSheetAway}%</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Key Match Factors */}
        <Section title="Key Match Factors (Ranked by Impact)" icon="🔑" delay={600}>
          <div className="space-y-3">
            {p.keyFactors.map((factor, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-oracle-card/50 rounded-lg">
                <span className="text-oracle-green font-bold font-mono text-sm mt-0.5 w-5 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm text-white leading-relaxed">{factor.factor}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-oracle-text-dim">Impact:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div
                          key={j}
                          className="w-2 h-3 rounded-sm"
                          style={{
                            backgroundColor: j < factor.impact
                              ? (factor.favorsSide === 'home' ? '#00ff88' : factor.favorsSide === 'away' ? '#3b82f6' : '#f59e0b')
                              : '#1e2a3a'
                          }}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold ${
                      factor.favorsSide === 'home' ? 'text-oracle-green' :
                      factor.favorsSide === 'away' ? 'text-oracle-blue' : 'text-oracle-amber'
                    }`}>
                      {factor.favorsSide === 'home' ? `↑ ${p.homeTeam.shortName}` :
                       factor.favorsSide === 'away' ? `↑ ${p.awayTeam.shortName}` : '⚖ Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Analysis */}
        <Section title="Scenario Analysis" icon="📋" delay={700}>
          <div className="space-y-3">
            {p.scenarios.map((scenario, i) => {
              const icons = ['🎯', '🐻', '🐂'];
              const colors = ['#00ff88', '#ef4444', '#3b82f6'];
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-oracle-card/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icons[i]}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{scenario.name}</p>
                      <p className="text-xs text-oracle-text-dim">Most likely result</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{scenario.result}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-16">
                        <ProgressBar value={scenario.confidence} color={colors[i]} />
                      </div>
                      <span className="font-mono text-xs" style={{ color: colors[i] }}>{scenario.confidence}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Pattern Recognition */}
        <Section title="Pattern Recognition Flags" icon="🔍" delay={800}>
          <div className="space-y-3">
            {p.patternFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-oracle-card/50 rounded-lg">
                <span className={`text-lg ${flag.active ? '' : 'opacity-40'}`}>
                  {flag.active ? '✅' : '⬜'}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${flag.active ? 'text-oracle-green' : 'text-oracle-text-dim'}`}>
                    {flag.pattern}
                  </p>
                  <p className="text-xs text-oracle-text-dim mt-0.5">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Value Prediction */}
      <div
        className="rounded-2xl p-6 md:p-8 animate-slide-up"
        style={{
          animationDelay: '900ms', animationFillMode: 'both',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.06))',
          border: '1px solid rgba(245,158,11,0.25)',
        }}
      >
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-oracle-amber mb-2 font-semibold">💰 Value Prediction (Highest EV Pick)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-oracle-card/50 rounded-lg">
            <span className="text-xs text-oracle-text-dim block mb-1">Bet</span>
            <span className="text-lg font-bold text-white">{p.valuePick.bet}</span>
          </div>
          <div className="text-center p-4 bg-oracle-card/50 rounded-lg">
            <span className="text-xs text-oracle-text-dim block mb-1">Value Edge</span>
            <span className="text-lg font-bold text-emerald-400">+{p.valuePick.valueEdge}%</span>
          </div>
          <div className="text-center p-4 bg-oracle-card/50 rounded-lg">
            <span className="text-xs text-oracle-text-dim block mb-1">Recommended Odds</span>
            <span className="text-lg font-bold font-mono text-oracle-amber">{p.valuePick.recommendedOdds.toFixed(2)}</span>
            <span className="text-xs text-oracle-text-dim"> or better</span>
          </div>
          <div className="text-center p-4 bg-oracle-card/50 rounded-lg">
            <span className="text-xs text-oracle-text-dim block mb-1">Stake</span>
            <span className={`text-lg font-bold ${
              p.valuePick.stakeRecommendation === 'High' ? 'text-emerald-400' :
              p.valuePick.stakeRecommendation === 'Medium' ? 'text-oracle-amber' : 'text-oracle-text-dim'
            }`}>
              {p.valuePick.stakeRecommendation}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      <Section title="Risk Flags" icon="⚠️" delay={1000}>
        <div className="space-y-2">
          {p.riskFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-oracle-amber">⚠️</span>
              <span className="text-oracle-text-dim">{flag}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Disclaimer */}
      <div
        className="text-center py-6 animate-slide-up"
        style={{ animationDelay: '1100ms', animationFillMode: 'both' }}
      >
        <p className="text-xs text-oracle-text-dim/60 italic max-w-2xl mx-auto leading-relaxed">
          This prediction is probabilistic. Upsets are part of football. Never stake more than you can afford to lose.
          ORACLE-XI provides analytical insights for educational purposes. Past performance does not guarantee future results.
        </p>
        <p className="text-xs text-oracle-text-dim/40 mt-2 font-mono">
          ORACLE-XI — Precision. Probability. Profit.
        </p>
      </div>
    </div>
  );
}
