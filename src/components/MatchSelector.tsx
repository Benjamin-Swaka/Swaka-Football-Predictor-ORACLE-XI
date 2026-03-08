import { useState, useMemo } from 'react';
import { Team } from '../types';
import { teams, leagues } from '../data/teams';

interface MatchSelectorProps {
  onPredict: (home: Team, away: Team) => void;
  isLoading: boolean;
}

function TeamBadge({ team, size = 'md' }: { team: Team | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
  if (!team) {
    return (
      <div className={`${sizes[size]} rounded-full bg-oracle-card border border-oracle-border flex items-center justify-center text-oracle-text-dim`}>
        ?
      </div>
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold tracking-wide shadow-lg`}
      style={{ backgroundColor: team.color + '22', border: `2px solid ${team.color}`, color: team.color }}
    >
      {team.shortName}
    </div>
  );
}

function TeamCard({ team, label }: { team: Team | null; label: string }) {
  if (!team) {
    return (
      <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-3 min-h-[180px] justify-center">
        <div className="w-16 h-16 rounded-full bg-oracle-card border-2 border-dashed border-oracle-border flex items-center justify-center">
          <span className="text-oracle-text-dim text-2xl">⚽</span>
        </div>
        <p className="text-oracle-text-dim text-sm">Select {label} Team</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center gap-3 animate-fade-in">
      <TeamBadge team={team} size="lg" />
      <h3 className="text-lg font-bold text-white text-center">{team.name}</h3>
      <p className="text-oracle-text-dim text-xs uppercase tracking-wider">{team.league}</p>
      <div className="flex gap-1 mt-1">
        {team.form.map((r, i) => (
          <span
            key={i}
            className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
              r === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
              r === 'D' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}
          >
            {r}
          </span>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <div className="text-center">
          <span className="text-oracle-text-dim block">ATK</span>
          <span className="text-oracle-green font-mono font-bold">{team.attack}</span>
        </div>
        <div className="text-center">
          <span className="text-oracle-text-dim block">DEF</span>
          <span className="text-oracle-blue font-mono font-bold">{team.defense}</span>
        </div>
        <div className="text-center">
          <span className="text-oracle-text-dim block">MID</span>
          <span className="text-oracle-purple font-mono font-bold">{team.midfield}</span>
        </div>
      </div>
      {team.injuries.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 justify-center">
          {team.injuries.map((inj, i) => (
            <span key={i} className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
              🚑 {inj.player}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchSelector({ onPredict, isLoading }: MatchSelectorProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [homeSearch, setHomeSearch] = useState('');
  const [awaySearch, setAwaySearch] = useState('');
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const [awayDropdownOpen, setAwayDropdownOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    return selectedLeague === 'All' ? teams : teams.filter(t => t.league === selectedLeague);
  }, [selectedLeague]);

  const homeOptions = useMemo(() => {
    return filteredTeams.filter(t =>
      t.id !== awayTeam?.id &&
      t.name.toLowerCase().includes(homeSearch.toLowerCase())
    );
  }, [filteredTeams, awayTeam, homeSearch]);

  const awayOptions = useMemo(() => {
    return filteredTeams.filter(t =>
      t.id !== homeTeam?.id &&
      t.name.toLowerCase().includes(awaySearch.toLowerCase())
    );
  }, [filteredTeams, homeTeam, awaySearch]);

  const canPredict = homeTeam && awayTeam && !isLoading;

  const handlePredict = () => {
    if (homeTeam && awayTeam) {
      onPredict(homeTeam, awayTeam);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* League filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setSelectedLeague('All')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
            selectedLeague === 'All'
              ? 'bg-oracle-green/20 text-oracle-green border border-oracle-green/40'
              : 'bg-oracle-card text-oracle-text-dim border border-oracle-border hover:border-oracle-green/30'
          }`}
        >
          ALL LEAGUES
        </button>
        {leagues.map(league => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all ${
              selectedLeague === league
                ? 'bg-oracle-green/20 text-oracle-green border border-oracle-green/40'
                : 'bg-oracle-card text-oracle-text-dim border border-oracle-border hover:border-oracle-green/30'
            }`}
          >
            {league.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Team selection */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">
        {/* Home team */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-oracle-green font-semibold block text-center">
            🏠 Home Team
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={homeSearch}
              onChange={(e) => { setHomeSearch(e.target.value); setHomeDropdownOpen(true); }}
              onFocus={() => setHomeDropdownOpen(true)}
              onBlur={() => setTimeout(() => setHomeDropdownOpen(false), 200)}
              className="w-full bg-oracle-card border border-oracle-border rounded-lg px-4 py-3 text-white placeholder-oracle-text-dim focus:outline-none focus:border-oracle-green/50 transition-colors text-sm"
            />
            {homeDropdownOpen && homeOptions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-oracle-card border border-oracle-border rounded-lg shadow-2xl max-h-52 overflow-y-auto">
                {homeOptions.map(team => (
                  <button
                    key={team.id}
                    onMouseDown={() => {
                      setHomeTeam(team);
                      setHomeSearch('');
                      setHomeDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-oracle-green/10 transition-colors text-left"
                  >
                    <TeamBadge team={team} size="sm" />
                    <div>
                      <span className="text-sm text-white">{team.name}</span>
                      <span className="text-xs text-oracle-text-dim block">{team.league}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <TeamCard team={homeTeam} label="Home" />
        </div>

        {/* VS divider */}
        <div className="hidden md:flex flex-col items-center justify-center pt-10">
          <div className="w-16 h-16 rounded-full bg-oracle-card border-2 border-oracle-green/30 flex items-center justify-center animate-pulse-glow">
            <span className="text-oracle-green font-black text-lg">VS</span>
          </div>
        </div>
        <div className="md:hidden flex justify-center">
          <div className="w-12 h-12 rounded-full bg-oracle-card border-2 border-oracle-green/30 flex items-center justify-center">
            <span className="text-oracle-green font-black text-sm">VS</span>
          </div>
        </div>

        {/* Away team */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-oracle-blue font-semibold block text-center">
            ✈️ Away Team
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search teams..."
              value={awaySearch}
              onChange={(e) => { setAwaySearch(e.target.value); setAwayDropdownOpen(true); }}
              onFocus={() => setAwayDropdownOpen(true)}
              onBlur={() => setTimeout(() => setAwayDropdownOpen(false), 200)}
              className="w-full bg-oracle-card border border-oracle-border rounded-lg px-4 py-3 text-white placeholder-oracle-text-dim focus:outline-none focus:border-oracle-blue/50 transition-colors text-sm"
            />
            {awayDropdownOpen && awayOptions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-oracle-card border border-oracle-border rounded-lg shadow-2xl max-h-52 overflow-y-auto">
                {awayOptions.map(team => (
                  <button
                    key={team.id}
                    onMouseDown={() => {
                      setAwayTeam(team);
                      setAwaySearch('');
                      setAwayDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-oracle-blue/10 transition-colors text-left"
                  >
                    <TeamBadge team={team} size="sm" />
                    <div>
                      <span className="text-sm text-white">{team.name}</span>
                      <span className="text-xs text-oracle-text-dim block">{team.league}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <TeamCard team={awayTeam} label="Away" />
        </div>
      </div>

      {/* Predict button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handlePredict}
          disabled={!canPredict}
          className={`relative px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
            canPredict
              ? 'bg-gradient-to-r from-oracle-green/80 to-oracle-blue/80 text-white hover:from-oracle-green hover:to-oracle-blue shadow-lg shadow-oracle-green/20 hover:shadow-oracle-green/40 hover:scale-105 active:scale-95'
              : 'bg-oracle-card text-oracle-text-dim border border-oracle-border cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing Match...
            </span>
          ) : (
            <>🔮 Generate ORACLE-XI Prediction</>
          )}
        </button>
      </div>
    </div>
  );
}
