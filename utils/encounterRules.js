export const XP_THRESHOLDS = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const MULTIPLIER_STEPS = [1, 1.5, 2, 2.5, 3, 4];

export function calculatePartyThresholds(players, level) {
  const thresholds = XP_THRESHOLDS[level];

  return {
    easy: thresholds.easy * players,
    medium: thresholds.medium * players,
    hard: thresholds.hard * players,
    deadly: thresholds.deadly * players,
  };
}

export function getTargetRange(thresholds, difficulty) {
  if (difficulty === "easy") {
    return { min: thresholds.easy, max: thresholds.medium - 1 };
  }

  if (difficulty === "medium") {
    return { min: thresholds.medium, max: thresholds.hard - 1 };
  }

  if (difficulty === "hard") {
    return { min: thresholds.hard, max: thresholds.deadly - 1 };
  }

  return {
    min: thresholds.deadly,
    max: Math.floor(thresholds.deadly * 1.4),
  };
}

function getBaseMultiplier(monsterCount) {
  if (monsterCount <= 1) {
    return 1;
  }

  if (monsterCount === 2) {
    return 1.5;
  }

  if (monsterCount <= 6) {
    return 2;
  }

  if (monsterCount <= 10) {
    return 2.5;
  }

  if (monsterCount <= 14) {
    return 3;
  }

  return 4;
}

export function getEncounterMultiplier(monsterCount, players) {
  if (players >= 6 && monsterCount === 1) {
    return 0.5;
  }

  const baseMultiplier = getBaseMultiplier(monsterCount);
  const baseIndex = MULTIPLIER_STEPS.indexOf(baseMultiplier);

  if (players < 3) {
    return MULTIPLIER_STEPS[Math.min(baseIndex + 1, MULTIPLIER_STEPS.length - 1)];
  }

  if (players >= 6) {
    return MULTIPLIER_STEPS[Math.max(baseIndex - 1, 0)];
  }

  return baseMultiplier;
}

export function calculateAdjustedXp(monsters, players) {
  const baseXp = monsters.reduce((total, monster) => {
    return total + monster.xp * monster.quantity;
  }, 0);
  const monsterCount = monsters.reduce((total, monster) => total + monster.quantity, 0);
  const multiplier = getEncounterMultiplier(monsterCount, players);

  return {
    baseXp,
    monsterCount,
    multiplier,
    adjustedXp: Math.floor(baseXp * multiplier),
  };
}

export function estimateDifficulty(adjustedXp, thresholds) {
  if (adjustedXp < thresholds.easy) {
    return "trivial";
  }

  if (adjustedXp < thresholds.medium) {
    return "easy";
  }

  if (adjustedXp < thresholds.hard) {
    return "medium";
  }

  if (adjustedXp < thresholds.deadly) {
    return "hard";
  }

  return "deadly";
}
