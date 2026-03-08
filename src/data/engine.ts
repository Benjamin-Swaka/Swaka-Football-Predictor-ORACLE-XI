import { Team, Prediction, ScorelineProbability, OutcomeProbability, MatchFactor, Scenario, ValuePick, PatternFlag } from '../types';

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poisson(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function formToPoints(form: ('W' | 'D' | 'L')[]): number {
  return form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
}

function formRating(form: ('W' | 'D' | 'L')[]): number {
  const maxPoints = form.length * 3;
  return Math.round((formToPoints(form) / maxPoints) * 10 * 10) / 10;
}

function calculateDMR(team: Team, opponent: Team, isHome: boolean): number {
  // ELO component (40%)
  const eloNorm = ((team.eloRating - 1500) / 700) * 100;
  const eloScore = clamp(eloNorm, 0, 100) * 0.4;

  // Form xG differential (35%)
  const xgDiff = team.xGFor - team.xGAgainst;
  const formNorm = ((xgDiff + 2) / 4) * 100;
  const formScore = clamp(formNorm, 0, 100) * 0.35;

  // H2H relative strength (15%)
  const relStrength = ((team.attack + team.defense + team.midfield) - (opponent.attack + opponent.defense + opponent.midfield));
  const h2hNorm = ((relStrength + 60) / 120) * 100;
  const h2hScore = clamp(h2hNorm, 0, 100) * 0.15;

  // Squad strength (10%)
  const injuryImpact = team.injuries.reduce((sum, inj) => sum + inj.impact, 0);
  const squadNorm = clamp(100 - injuryImpact * 6, 0, 100);
  const squadScore = squadNorm * 0.10;

  let total = eloScore + formScore + h2hScore + squadScore;

  if (isHome) {
    total += team.homeAdvantage * 1.2;
  }

  return clamp(Math.round(total), 15, 95);
}

function calculateExpectedGoals(team: Team, opponent: Team, isHome: boolean): number {
  const leagueAvgGoals = 1.35;
  const scored = isHome ? team.avgGoalsScoredHome : team.avgGoalsScoredAway;
  const conceded = isHome ? opponent.avgGoalsConcededAway : opponent.avgGoalsConcededHome;

  const attackStrength = scored / leagueAvgGoals;
  const defenseWeakness = conceded / leagueAvgGoals;

  let xG = attackStrength * defenseWeakness * leagueAvgGoals;

  // Adjust with xG data
  const teamXGFactor = team.xGFor / (team.avgGoalsScored || 1);
  xG *= (teamXGFactor * 0.3 + 0.7);

  // Injury impact
  const injuryPenalty = team.injuries.reduce((sum, inj) => sum + inj.impact, 0) * 0.015;
  xG = Math.max(0.3, xG - injuryPenalty);

  // Home boost
  if (isHome) {
    xG *= 1.05;
  }

  return Math.round(xG * 100) / 100;
}

function generateScorelines(homeXG: number, awayXG: number): ScorelineProbability[] {
  const scorelines: ScorelineProbability[] = [];

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const prob = poisson(homeXG, h) * poisson(awayXG, a) * 100;
      scorelines.push({ home: h, away: a, probability: Math.round(prob * 100) / 100 });
    }
  }

  scorelines.sort((a, b) => b.probability - a.probability);
  return scorelines;
}

function calculateOutcomes(scorelines: ScorelineProbability[]): { homeWin: number; draw: number; awayWin: number } {
  let homeWin = 0, draw = 0, awayWin = 0;

  for (const sl of scorelines) {
    if (sl.home > sl.away) homeWin += sl.probability;
    else if (sl.home === sl.away) draw += sl.probability;
    else awayWin += sl.probability;
  }

  // Normalize
  const total = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / total) * 100 * 10) / 10;
  draw = Math.round((draw / total) * 100 * 10) / 10;
  awayWin = Math.round(100 - homeWin - draw, );

  return { homeWin, draw, awayWin };
}

function generateBookmakerOdds(homeWin: number, draw: number, awayWin: number): { homeOdds: number; drawOdds: number; awayOdds: number } {
  // Add margin (overround ~5-8%)
  const margin = 1.06;
  const seed = (homeWin * 7 + draw * 13) % 5;
  const jitter = (val: number) => val + (seed - 2.5) * 0.8;

  return {
    homeOdds: Math.round(jitter(homeWin) * margin * 10) / 10,
    drawOdds: Math.round(jitter(draw) * margin * 10) / 10,
    awayOdds: Math.round(jitter(awayWin) * margin * 10) / 10,
  };
}

function identifyKeyFactors(home: Team, away: Team, homeXG: number, awayXG: number): MatchFactor[] {
  const factors: MatchFactor[] = [];

  // Injuries
  home.injuries.forEach(inj => {
    if (inj.impact >= 6) {
      factors.push({
        factor: `${home.shortName} missing ${inj.player} (${inj.impact}/10 impact)`,
        impact: inj.impact,
        favorsSide: 'away'
      });
    }
  });
  away.injuries.forEach(inj => {
    if (inj.impact >= 6) {
      factors.push({
        factor: `${away.shortName} missing ${inj.player} (${inj.impact}/10 impact)`,
        impact: inj.impact,
        favorsSide: 'home'
      });
    }
  });

  // Home advantage
  if (home.homeAdvantage >= 9) {
    factors.push({
      factor: `${home.stadium} is a fortress (${home.homeAdvantage}/10 home advantage)`,
      impact: home.homeAdvantage,
      favorsSide: 'home'
    });
  }

  // Form momentum
  const homeFormPts = formToPoints(home.form);
  const awayFormPts = formToPoints(away.form);
  if (homeFormPts >= 14) {
    factors.push({ factor: `${home.shortName} in excellent form (${homeFormPts}/18 pts last 6)`, impact: 8, favorsSide: 'home' });
  }
  if (awayFormPts >= 14) {
    factors.push({ factor: `${away.shortName} in excellent form (${awayFormPts}/18 pts last 6)`, impact: 8, favorsSide: 'away' });
  }
  if (homeFormPts <= 7) {
    factors.push({ factor: `${home.shortName} in poor form (${homeFormPts}/18 pts last 6)`, impact: 7, favorsSide: 'away' });
  }
  if (awayFormPts <= 7) {
    factors.push({ factor: `${away.shortName} in poor form (${awayFormPts}/18 pts last 6)`, impact: 7, favorsSide: 'home' });
  }

  // Tactical matchup
  if (home.style === 'High Press' && away.style === 'Low Block') {
    factors.push({ factor: `Tactical mismatch: ${home.shortName}'s high press vs ${away.shortName}'s low block — likely tight game`, impact: 7, favorsSide: 'away' });
  }
  if (home.style === 'Possession' && away.style === 'Counter-Attack') {
    factors.push({ factor: `${away.shortName}'s counter-attack could exploit ${home.shortName}'s high line`, impact: 6, favorsSide: 'away' });
  }

  // Set piece threat
  if (home.setPieceThreat >= 8) {
    factors.push({ factor: `${home.shortName} set-piece threat (${home.setPieceThreat}/10) — danger from corners/free kicks`, impact: 6, favorsSide: 'home' });
  }
  if (away.setPieceThreat >= 8) {
    factors.push({ factor: `${away.shortName} set-piece threat (${away.setPieceThreat}/10) — danger from corners/free kicks`, impact: 6, favorsSide: 'away' });
  }

  // xG dominance
  if (homeXG - awayXG > 0.8) {
    factors.push({ factor: `Expected goals heavily favor ${home.shortName} (${homeXG} vs ${awayXG})`, impact: 8, favorsSide: 'home' });
  } else if (awayXG - homeXG > 0.5) {
    factors.push({ factor: `Expected goals favor ${away.shortName} despite being away (${awayXG} vs ${homeXG})`, impact: 7, favorsSide: 'away' });
  }

  // League position context
  if (home.leaguePosition <= 2 && away.leaguePosition <= 2) {
    factors.push({ factor: 'Title clash — both teams in top 2, maximum motivation', impact: 9, favorsSide: 'neutral' });
  }
  if (home.leaguePosition <= 3) {
    factors.push({ factor: `${home.shortName} fighting for title (${home.leaguePosition}${getOrdinal(home.leaguePosition)})`, impact: 7, favorsSide: 'home' });
  }

  factors.sort((a, b) => b.impact - a.impact);
  return factors.slice(0, 5);
}

function getOrdinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

function generateScenarios(home: Team, away: Team, baseHomeWin: number, baseDraw: number, baseAwayWin: number): Scenario[] {
  const baseResult = baseHomeWin > baseAwayWin
    ? (baseHomeWin > baseDraw ? `${home.shortName} Win` : 'Draw')
    : (baseAwayWin > baseDraw ? `${away.shortName} Win` : 'Draw');

  const baseConf = Math.max(baseHomeWin, baseDraw, baseAwayWin);

  // Bear case: injuries worsen, away team motivated
  const bearHomeWin = Math.max(15, baseHomeWin - 12);
  const bearDraw = Math.min(40, baseDraw + 5);
  const bearAwayWin = 100 - bearHomeWin - bearDraw;
  const bearResult = bearHomeWin > bearAwayWin
    ? (bearHomeWin > bearDraw ? `${home.shortName} Win` : 'Draw')
    : (bearAwayWin > bearDraw ? `${away.shortName} Win` : 'Draw');

  // Bull case: home team fully fit, crowd factor
  const bullHomeWin = Math.min(85, baseHomeWin + 10);
  const bullDraw = Math.max(10, baseDraw - 5);
  const bullAwayWin = 100 - bullHomeWin - bullDraw;
  const bullResult = bullHomeWin > bullAwayWin
    ? (bullHomeWin > bullDraw ? `${home.shortName} Win` : 'Draw')
    : (bullAwayWin > bullDraw ? `${away.shortName} Win` : 'Draw');

  return [
    { name: 'Base Case', result: baseResult, confidence: Math.round(baseConf) },
    { name: `Bear Case (${home.shortName})`, result: bearResult, confidence: Math.round(Math.max(bearHomeWin, bearDraw, bearAwayWin)) },
    { name: `Bull Case (${home.shortName})`, result: bullResult, confidence: Math.round(Math.max(bullHomeWin, bullDraw, bullAwayWin)) },
  ];
}

function identifyPatterns(home: Team, away: Team): PatternFlag[] {
  const flags: PatternFlag[] = [];

  // Bounce-back pattern
  const homeLastResult = home.form[home.form.length - 1];
  const homeBounceBack = homeLastResult === 'L' && home.form.filter(r => r === 'W').length >= 3;
  flags.push({
    pattern: 'Bounce-Back',
    active: homeBounceBack,
    description: homeBounceBack
      ? `${home.shortName} typically rebounds after a loss — form cluster suggests momentum recovery`
      : `${home.shortName} not in a bounce-back pattern`
  });

  // Form cluster
  const homeWinStreak = home.form.filter(r => r === 'W').length;
  const awayWinStreak = away.form.filter(r => r === 'W').length;
  flags.push({
    pattern: 'Form Cluster',
    active: homeWinStreak >= 4 || awayWinStreak >= 4,
    description: homeWinStreak >= 4
      ? `${home.shortName} in a ${homeWinStreak}-win cluster — momentum is carrying`
      : awayWinStreak >= 4
        ? `${away.shortName} in a ${awayWinStreak}-win cluster — momentum is carrying`
        : 'Neither team in a significant win cluster'
  });

  // High-scoring fixture likelihood
  const totalXG = home.xGFor + away.xGFor;
  flags.push({
    pattern: 'High-Scoring Fixture',
    active: totalXG > 4.0,
    description: totalXG > 4.0
      ? `Combined xG of ${totalXG.toFixed(2)} suggests a high-scoring encounter`
      : `Combined xG of ${totalXG.toFixed(2)} — moderate goal expectation`
  });

  // Defensive mismatch
  const defMismatch = Math.abs(home.defense - away.defense) > 10;
  flags.push({
    pattern: 'Defensive Mismatch',
    active: defMismatch,
    description: defMismatch
      ? `Significant defensive gap: ${home.shortName} (${home.defense}) vs ${away.shortName} (${away.defense})`
      : 'Defensive ratings are competitive'
  });

  // Late goal risk
  const awayLateRisk = away.avgGoalsConcededAway > 1.4;
  flags.push({
    pattern: 'Late Goal Risk',
    active: awayLateRisk,
    description: awayLateRisk
      ? `${away.shortName} concede ${away.avgGoalsConcededAway} goals/game away — vulnerable to late goals`
      : 'No significant late-goal vulnerability detected'
  });

  return flags;
}

function identifyValuePick(
  outcomes: OutcomeProbability[],
  over25: number,
  under25: number,
  btts: number,
  home: Team,
  _away: Team
): ValuePick {
  // Find the best value across all markets
  const markets: { bet: string; edge: number; odds: number }[] = [];

  // Outcome markets
  outcomes.forEach(o => {
    if (o.edge > 3) {
      const fairOdds = Math.round((100 / o.modelPct) * 100) / 100;
      markets.push({ bet: o.outcome, edge: o.edge, odds: fairOdds });
    }
  });

  // O/U 2.5
  const overImplied = 52; // typical market
  if (over25 - overImplied > 3) {
    markets.push({ bet: 'Over 2.5 Goals', edge: over25 - overImplied, odds: Math.round((100 / over25) * 100) / 100 });
  }
  const underImplied = 48;
  if (under25 - underImplied > 3) {
    markets.push({ bet: 'Under 2.5 Goals', edge: under25 - underImplied, odds: Math.round((100 / under25) * 100) / 100 });
  }

  // BTTS
  const bttsImplied = 55;
  if (btts - bttsImplied > 3) {
    markets.push({ bet: 'BTTS Yes', edge: btts - bttsImplied, odds: Math.round((100 / btts) * 100) / 100 });
  }
  if ((100 - btts) - (100 - bttsImplied) > 3) {
    markets.push({ bet: 'BTTS No', edge: (100 - btts) - (100 - bttsImplied), odds: Math.round((100 / (100 - btts)) * 100) / 100 });
  }

  markets.sort((a, b) => b.edge - a.edge);

  if (markets.length > 0) {
    const best = markets[0];
    return {
      bet: best.bet,
      valueEdge: Math.round(best.edge * 10) / 10,
      recommendedOdds: best.odds,
      stakeRecommendation: best.edge > 8 ? 'High' : best.edge > 5 ? 'Medium' : 'Low',
    };
  }

  // Default
  return {
    bet: `${home.shortName} Win or Draw (Double Chance)`,
    valueEdge: 2.5,
    recommendedOdds: 1.35,
    stakeRecommendation: 'Low',
  };
}

function generateRiskFlags(home: Team, away: Team): string[] {
  const flags: string[] = [];

  flags.push('Lineup not confirmed — verify 1 hour before kickoff for late changes');

  if (home.injuries.length > 0 || away.injuries.length > 0) {
    flags.push('Injury list may change — monitor team news for last-minute updates');
  }

  if (home.league !== away.league) {
    flags.push('Cross-league fixture — historical H2H data limited, higher variance expected');
  }

  const homeFormPts = formToPoints(home.form);
  const awayFormPts = formToPoints(away.form);
  if (Math.abs(homeFormPts - awayFormPts) <= 3) {
    flags.push('Both teams in similar form — tight match expected, variance is elevated');
  }

  flags.push('Weather conditions not verified — check for wind/rain impact on match day');

  return flags;
}

export function generatePrediction(homeTeam: Team, awayTeam: Team): Prediction {
  // DMR
  const homeDMR = calculateDMR(homeTeam, awayTeam, true);
  const awayDMR = calculateDMR(awayTeam, homeTeam, false);

  // Form ratings
  const homeFormRating = formRating(homeTeam.form);
  const awayFormRating = formRating(awayTeam.form);

  // Squad strength
  const homeInjuryImpact = homeTeam.injuries.reduce((s, i) => s + i.impact, 0);
  const awayInjuryImpact = awayTeam.injuries.reduce((s, i) => s + i.impact, 0);
  const homeSquadStrength = Math.round(clamp(10 - homeInjuryImpact * 0.5, 3, 10) * 10) / 10;
  const awaySquadStrength = Math.round(clamp(10 - awayInjuryImpact * 0.5, 3, 10) * 10) / 10;

  // Tactical edge
  const homeTacticalEdge = Math.round(((homeTeam.midfield + homeTeam.attack * 0.5) / (awayTeam.midfield + awayTeam.defense * 0.5)) * 5 * 10) / 10;
  const awayTacticalEdge = Math.round(((awayTeam.midfield + awayTeam.attack * 0.5) / (homeTeam.midfield + homeTeam.defense * 0.5)) * 5 * 10) / 10;

  // Overall edge
  const dmrGap = homeDMR - awayDMR;
  const overallEdge: 'HOME' | 'AWAY' | 'EVEN' = dmrGap > 8 ? 'HOME' : dmrGap < -8 ? 'AWAY' : 'EVEN';

  // Expected goals
  const expectedGoalsHome = calculateExpectedGoals(homeTeam, awayTeam, true);
  const expectedGoalsAway = calculateExpectedGoals(awayTeam, homeTeam, false);

  // Scorelines
  const scorelines = generateScorelines(expectedGoalsHome, expectedGoalsAway);

  // Outcomes
  const { homeWin, draw, awayWin } = calculateOutcomes(scorelines);

  // Bookmaker odds (simulated)
  const bookmaker = generateBookmakerOdds(homeWin, draw, awayWin);

  const outcomes: OutcomeProbability[] = [
    {
      outcome: 'Home Win',
      modelPct: homeWin,
      bookmakerPct: bookmaker.homeOdds,
      edge: Math.round((homeWin - bookmaker.homeOdds) * 10) / 10,
    },
    {
      outcome: 'Draw',
      modelPct: draw,
      bookmakerPct: bookmaker.drawOdds,
      edge: Math.round((draw - bookmaker.drawOdds) * 10) / 10,
    },
    {
      outcome: 'Away Win',
      modelPct: awayWin,
      bookmakerPct: bookmaker.awayOdds,
      edge: Math.round((awayWin - bookmaker.awayOdds) * 10) / 10,
    },
  ];

  // Goals markets
  let over25 = 0, under25 = 0, bttsYes = 0, csHome = 0, csAway = 0;
  for (const sl of scorelines) {
    if (sl.home + sl.away > 2.5) over25 += sl.probability;
    else under25 += sl.probability;
    if (sl.home > 0 && sl.away > 0) bttsYes += sl.probability;
    if (sl.away === 0) csHome += sl.probability;
    if (sl.home === 0) csAway += sl.probability;
  }
  const totalProb = over25 + under25;
  over25 = Math.round((over25 / totalProb) * 100 * 10) / 10;
  under25 = Math.round((under25 / totalProb) * 100 * 10) / 10;
  bttsYes = Math.round((bttsYes / totalProb) * 100 * 10) / 10;
  csHome = Math.round((csHome / totalProb) * 100 * 10) / 10;
  csAway = Math.round((csAway / totalProb) * 100 * 10) / 10;

  // Key factors
  const keyFactors = identifyKeyFactors(homeTeam, awayTeam, expectedGoalsHome, expectedGoalsAway);

  // Scenarios
  const scenarios = generateScenarios(homeTeam, awayTeam, homeWin, draw, awayWin);

  // Primary prediction
  const topScoreline = scorelines[0];
  let primaryResult: string;
  if (homeWin > awayWin && homeWin > draw) primaryResult = `${homeTeam.shortName} Win`;
  else if (awayWin > homeWin && awayWin > draw) primaryResult = `${awayTeam.shortName} Win`;
  else primaryResult = 'Draw';

  const primaryScoreline = `${topScoreline.home} – ${topScoreline.away}`;

  // Confidence
  const maxProb = Math.max(homeWin, draw, awayWin);
  let confidenceTier: 'ELITE' | 'HIGH' | 'MODERATE' | 'LOW';
  let confidenceScore = Math.round(maxProb);

  // Adjust confidence
  if (Math.abs(dmrGap) > 15 && maxProb > 55) confidenceScore = Math.min(89, confidenceScore + 8);
  if (homeInjuryImpact > 8 || awayInjuryImpact > 8) confidenceScore = Math.max(40, confidenceScore - 5);

  confidenceScore = clamp(confidenceScore, 35, 89);

  if (confidenceScore >= 80) confidenceTier = 'ELITE';
  else if (confidenceScore >= 65) confidenceTier = 'HIGH';
  else if (confidenceScore >= 50) confidenceTier = 'MODERATE';
  else confidenceTier = 'LOW';

  // Reasoning
  const topFactor = keyFactors[0]?.factor || 'Overall team quality differential';
  const secondFactor = keyFactors[1]?.factor || 'Recent form trajectory';
  const reasoning = `${primaryResult} is favored by the model at ${maxProb.toFixed(1)}% probability, driven primarily by ${topFactor.toLowerCase()}. ${secondFactor} further supports this projection. The Poisson model's most likely scoreline of ${primaryScoreline} reflects the expected goals balance of ${expectedGoalsHome} vs ${expectedGoalsAway}.`;

  // Value pick
  const valuePick = identifyValuePick(outcomes, over25, under25, bttsYes, homeTeam, awayTeam);

  // Risk flags
  const riskFlags = generateRiskFlags(homeTeam, awayTeam);

  // Pattern flags
  const patternFlags = identifyPatterns(homeTeam, awayTeam);

  return {
    homeTeam,
    awayTeam,
    homeDMR,
    awayDMR,
    homeFormRating,
    awayFormRating,
    homeSquadStrength,
    awaySquadStrength,
    homeTacticalEdge: clamp(homeTacticalEdge, 3, 10),
    awayTacticalEdge: clamp(awayTacticalEdge, 3, 10),
    overallEdge,
    expectedGoalsHome,
    expectedGoalsAway,
    scorelines: scorelines.slice(0, 6),
    outcomes,
    over25Prob: over25,
    under25Prob: under25,
    bttsProb: bttsYes,
    cleanSheetHome: csHome,
    cleanSheetAway: csAway,
    keyFactors,
    scenarios,
    primaryResult,
    primaryScoreline,
    confidenceTier,
    confidenceScore,
    reasoning,
    valuePick,
    riskFlags,
    patternFlags,
  };
}
