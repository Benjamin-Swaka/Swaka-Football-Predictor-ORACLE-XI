export interface Injury {
  player: string;
  impact: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  stadium: string;
  city: string;
  color: string;
  attack: number;
  defense: number;
  midfield: number;
  homeAdvantage: number;
  form: ('W' | 'D' | 'L')[];
  xGFor: number;
  xGAgainst: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  avgGoalsScoredHome: number;
  avgGoalsConcededHome: number;
  avgGoalsScoredAway: number;
  avgGoalsConcededAway: number;
  setPieceThreat: number;
  style: string;
  keyPlayers: string[];
  injuries: Injury[];
  eloRating: number;
  leaguePosition: number;
  pointsPerGame: number;
}

export interface ScorelineProbability {
  home: number;
  away: number;
  probability: number;
}

export interface OutcomeProbability {
  outcome: string;
  modelPct: number;
  bookmakerPct: number;
  edge: number;
}

export interface Scenario {
  name: string;
  result: string;
  confidence: number;
}

export interface MatchFactor {
  factor: string;
  impact: number;
  favorsSide: 'home' | 'away' | 'neutral';
}

export interface ValuePick {
  bet: string;
  valueEdge: number;
  recommendedOdds: number;
  stakeRecommendation: 'Low' | 'Medium' | 'High';
}

export interface PatternFlag {
  pattern: string;
  active: boolean;
  description: string;
}

export interface Prediction {
  homeTeam: Team;
  awayTeam: Team;
  homeDMR: number;
  awayDMR: number;
  homeFormRating: number;
  awayFormRating: number;
  homeSquadStrength: number;
  awaySquadStrength: number;
  homeTacticalEdge: number;
  awayTacticalEdge: number;
  overallEdge: 'HOME' | 'AWAY' | 'EVEN';
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  scorelines: ScorelineProbability[];
  outcomes: OutcomeProbability[];
  over25Prob: number;
  under25Prob: number;
  bttsProb: number;
  cleanSheetHome: number;
  cleanSheetAway: number;
  keyFactors: MatchFactor[];
  scenarios: Scenario[];
  primaryResult: string;
  primaryScoreline: string;
  confidenceTier: 'ELITE' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number;
  reasoning: string;
  valuePick: ValuePick;
  riskFlags: string[];
  patternFlags: PatternFlag[];
}
