import {
  calculateAdjustedXp,
  calculatePartyThresholds,
  estimateDifficulty,
  getTargetRange,
} from "../utils/encounterRules.js";

const DND_API_BASE_URL = "https://www.dnd5eapi.co";
const MONSTER_SAMPLE_SIZE = 60;
const MAX_ATTEMPTS = 100;

let cachedMonsterList = null;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("D&D 5e API request failed");
  }

  return response.json();
}

async function getMonsterList() {
  if (cachedMonsterList) {
    return cachedMonsterList;
  }

  const data = await fetchJson(`${DND_API_BASE_URL}/api/monsters`);
  cachedMonsterList = Array.isArray(data.results) ? data.results : [];

  return cachedMonsterList;
}

function getArmorClassValue(armorClass) {
  if (Array.isArray(armorClass)) {
    const firstArmorClass = armorClass[0];

    if (typeof firstArmorClass === "number") {
      return firstArmorClass;
    }

    if (typeof firstArmorClass?.value === "number") {
      return firstArmorClass.value;
    }

    return "Not available";
  }

  if (typeof armorClass === "number") {
    return armorClass;
  }

  return "Not available";
}

function getArrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function getObjectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getNumberValue(value) {
  return typeof value === "number" ? value : "Not available";
}

function normalizeMonster(monster) {
  return {
    index: monster.index || "Not available",
    name: monster.name || "Not available",
    quantity: 1,
    size: monster.size || "Not available",
    type: monster.type || "Not available",
    subtype: monster.subtype || "Not available",
    alignment: monster.alignment || "Not available",
    armorClass: getArmorClassValue(monster.armor_class),
    hitPoints: getNumberValue(monster.hit_points),
    hitDice: monster.hit_dice || "Not available",
    speed: getObjectValue(monster.speed),
    strength: getNumberValue(monster.strength),
    dexterity: getNumberValue(monster.dexterity),
    constitution: getNumberValue(monster.constitution),
    intelligence: getNumberValue(monster.intelligence),
    wisdom: getNumberValue(monster.wisdom),
    charisma: getNumberValue(monster.charisma),
    proficiencies: getArrayValue(monster.proficiencies),
    damageVulnerabilities: getArrayValue(monster.damage_vulnerabilities),
    damageResistances: getArrayValue(monster.damage_resistances),
    damageImmunities: getArrayValue(monster.damage_immunities),
    conditionImmunities: getArrayValue(monster.condition_immunities),
    senses: getObjectValue(monster.senses),
    languages: monster.languages || "Not available",
    challengeRating: getNumberValue(monster.challenge_rating),
    xp: typeof monster.xp === "number" ? monster.xp : 0,
    specialAbilities: getArrayValue(monster.special_abilities),
    actions: getArrayValue(monster.actions),
    legendaryActions: getArrayValue(monster.legendary_actions),
  };
}

function isValidMonster(monster, level) {
  const maxChallengeRating = level <= 2 ? level : level + 1;

  return (
    typeof monster.xp === "number" &&
    monster.xp > 0 &&
    typeof monster.challenge_rating === "number" &&
    monster.challenge_rating <= maxChallengeRating
  );
}

async function getValidMonsterPool(level) {
  const monsterList = await getMonsterList();
  const sample = shuffle(monsterList).slice(0, MONSTER_SAMPLE_SIZE);
  const monsterDetailResults = await Promise.allSettled(
    sample.map((monster) => fetchJson(`${DND_API_BASE_URL}${monster.url}`))
  );

  return monsterDetailResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((monster) => isValidMonster(monster, level))
    .map(normalizeMonster);
}

function groupMonsters(monsters) {
  const groupedMonsters = new Map();

  for (const monster of monsters) {
    const existingMonster = groupedMonsters.get(monster.name);

    if (existingMonster) {
      existingMonster.quantity += 1;
    } else {
      groupedMonsters.set(monster.name, { ...monster, quantity: 1 });
    }
  }

  return Array.from(groupedMonsters.values());
}

function buildEncounter(monsters, players, thresholds) {
  const xpSummary = calculateAdjustedXp(monsters, players);

  return {
    estimatedDifficulty: estimateDifficulty(xpSummary.adjustedXp, thresholds),
    ...xpSummary,
    monsters,
  };
}

function getDistanceFromTargetCenter(adjustedXp, targetRange) {
  const center = (targetRange.min + targetRange.max) / 2;
  return Math.abs(adjustedXp - center);
}

export async function generateRandomEncounter({ players, level, difficulty }) {
  const thresholds = calculatePartyThresholds(players, level);
  const targetRange = getTargetRange(thresholds, difficulty);
  const monsterPool = await getValidMonsterPool(level);

  if (monsterPool.length === 0) {
    throw new Error("No valid monsters found for this party level");
  }

  let closestEncounter = null;
  let closestDistance = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const creatureCount = getRandomInt(1, 6);
    const selectedMonsters = Array.from({ length: creatureCount }, () => {
      return monsterPool[getRandomInt(0, monsterPool.length - 1)];
    });
    const groupedMonsters = groupMonsters(selectedMonsters);
    const encounter = buildEncounter(groupedMonsters, players, thresholds);
    const distance = getDistanceFromTargetCenter(encounter.adjustedXp, targetRange);

    if (distance < closestDistance) {
      closestEncounter = encounter;
      closestDistance = distance;
    }

    if (
      encounter.adjustedXp >= targetRange.min &&
      encounter.adjustedXp <= targetRange.max
    ) {
      return {
        party: {
          players,
          level,
          desiredDifficulty: difficulty,
          thresholds,
          targetRange,
        },
        encounter,
      };
    }
  }

  return {
    party: {
      players,
      level,
      desiredDifficulty: difficulty,
      thresholds,
      targetRange,
    },
    encounter: closestEncounter,
  };
}
