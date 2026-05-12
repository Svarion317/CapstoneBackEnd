import "dotenv/config";
import Groq from "groq-sdk";

const getLevelContext = (level) => {
  const n = parseInt(level);

  if (Number.isNaN(n)) {
    return "unknown power level";
  }

  if (n <= 4) {
    return "novice adventurers (low level, limited resources, fragile, danger should feel immediate and grounded)";
  }

  if (n <= 8) {
    return "seasoned adventurers (mid level, established class abilities, some magic items, able to face organized threats)";
  }

  if (n <= 12) {
    return "veteran adventurers (high level, powerful spells, strong reputations, threats can affect cities or regions)";
  }

  if (n <= 16) {
    return "elite adventurers (very high level, legendary items, world-shaping power, threats can involve nations or planes)";
  }

  return "legendary heroes (near-mythical power, gods, ancient powers, and planar forces may take notice)";
};

const normalizeBoolean = (value) => {
  return value === true || value === "true";
};

const hasText = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const hasCompleteNpc = (npc) => {
  return (
    npc &&
    typeof npc === "object" &&
    hasText(npc.name) &&
    hasText(npc.role) &&
    hasText(npc.personality) &&
    hasText(npc.secret)
  );
};

export const generateContent = async (req, res) => {
  try {
    const {
      players,
      level,
      classes,
      missionType,
      tone,
      generateNpc,
      includeTwist,
    } = req.body;

    if (!players || !level || !missionType || !tone) {
      return res.status(400).json({
        message: "Missing required quest fields",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "GROQ_API_KEY mancante nel file .env",
      });
    }

    const client = new Groq({ apiKey });

    const wantsNpc = normalizeBoolean(generateNpc);
    const wantsTwist = normalizeBoolean(includeTwist);

    const selectedClasses =
      Array.isArray(classes) && classes.filter(Boolean).length > 0
        ? classes.filter(Boolean).join(", ")
        : "not specified";

    const levelContext = getLevelContext(level);
    const baseTopLevelFields = [
      "title",
      "hook",
      "introduction",
      "objective",
      "locations",
      "encounters",
      "obstacle",
      "reward",
    ];
    const allowedTopLevelFields = [
      ...baseTopLevelFields,
      ...(wantsNpc ? ["npc"] : []),
      ...(wantsTwist ? ["twist"] : []),
    ];
    const allowedFieldList = allowedTopLevelFields
      .map((field) => `"${field}"`)
      .join(", ");

    const toggleRules = `
TOGGLE CONTRACT:
- Treat toggle values as hard output constraints, not creative suggestions.
- The final JSON must contain only these top-level keys: ${allowedFieldList}.
- Do not add top-level keys outside that list.
- Do not satisfy required fields with null, empty strings, placeholder text, or generic filler.
- NPC generation: ${wantsNpc ? `ON - include exactly one top-level "npc" object and connect that NPC to the quest hook, one encounter, and the reward or obstacle.` : `OFF - omit the top-level "npc" key completely. Do not add a dedicated NPC section, "npcs" array, or named supporting-character dossier.`}
- Narrative twist: ${wantsTwist ? `ON - include exactly one top-level "twist" string and seed it with clues in earlier quest sections.` : `OFF - omit the top-level "twist" key completely. Do not add a dedicated reveal, betrayal, hidden-truth, or plot-twist section.`}

FIELD RULES:
${wantsNpc ? `- The "npc" field is REQUIRED and MUST appear in the final JSON.` : `- The "npc" field is FORBIDDEN and MUST NOT appear in the final JSON.`}
${wantsTwist ? `- The "twist" field is REQUIRED and MUST appear in the final JSON.` : `- The "twist" field is FORBIDDEN and MUST NOT appear in the final JSON.`}
`.trim();

    const optionalSchemaFields = [
      wantsNpc &&
        `"npc": {
    "name": "string",
    "role": "string",
    "personality": "string",
    "secret": "string"
  }`,
      wantsTwist && `"twist": "string"`,
    ]
      .filter(Boolean)
      .join(",\n  ");

    const optionalFieldInstructions = [
      wantsNpc &&
        `NPC FIELD REQUIREMENTS:
- Create one memorable NPC who is directly useful to the DM during the quest.
- The NPC must not feel generic.
- The NPC must have a clear function in the quest.
- The "personality" field must include 2-3 roleplay traits or mannerisms.
- The "secret" field must reveal something hidden that can affect player choices.
- The NPC must be woven into the quest, not appended as an isolated extra.`,

      wantsTwist &&
        `TWIST FIELD REQUIREMENTS:
- The twist must be a late-quest revelation, not a random surprise.
- It must recontextualize at least one earlier clue, location, objective, or NPC if the NPC toggle is enabled.
- Seed at least two fair clues before the reveal, using the hook, locations, encounters, obstacle, or NPC.
- It must include practical DM guidance on when and how to reveal it.
- It must create a meaningful choice, complication, or moral tension for the party.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const systemInstruction = `
You are an expert Dungeons & Dragons Dungeon Master advisor and professional adventure module writer.

Your task is to generate a DM-facing quest guide.
The output must be practical, playable, specific, and ready to use at the table.

CRITICAL OUTPUT RULES:
- Return valid JSON only.
- Do not use markdown.
- Do not wrap the JSON in code fences.
- Do not write prose outside the JSON.
- Do not include comments in the JSON.
- Every JSON value must be a real string, array, or object.
- Never write placeholder values like "string", "TBD", "unknown", "a dark dungeon", "evil villain", or "mysterious figure".
- If a field is marked REQUIRED, it MUST appear.
- If a field is marked FORBIDDEN, it MUST NOT appear.
- The final JSON must match exactly the requested schema.
- The final JSON must use exactly the allowed top-level keys for the current toggle state.

WRITING RULES:
- Write in third person as DM guidance.
- Use phrases like "The party arrives...", "The DM should...", "This encounter works best if...".
- The tone is "${tone}". This affects atmosphere, scenes, NPC behavior, and imagery, but the writing must remain clear DM guidance.
- Use specific proper nouns for people, places, factions, objects, and threats.
- Make the quest original. Do not copy the example.
- Make the mission type central to the quest structure.
- Tailor danger, enemies, obstacles, and rewards to the party's level.
- Consider class composition when designing challenges.
- Mention party strengths, weaknesses, or synergies indirectly through encounter design.
- Each encounter must include actionable advice for the DM.
- Avoid generic fantasy filler.
- Optional toggle content must affect the playable quest structure, not appear as detached flavor text.
`.trim();

    const prompt = `
Generate a rich, detailed Dungeons & Dragons quest guide for a Dungeon Master.

PARTY INPUT:
- Party size: ${players} players
- Character level: ${level}
- Power context: ${levelContext}
- Classes: ${selectedClasses}
- Mission type: ${missionType}
- Tone: ${tone}

${toggleRules}

DESIGN PROCESS:
Before writing the final JSON, silently consider:
- What this party is good at.
- What this party may struggle with.
- How the mission type can shape the objective, locations, encounters, antagonist, and reward.
- How the tone should affect atmosphere and NPC behavior.
- How to make the quest playable, not just descriptive.

Do not reveal this reasoning. Return only the final JSON.

CONTENT REQUIREMENTS:
- The quest must feel like a playable adventure outline, not a short story.
- The hook must give the DM a concrete opening scene.
- The objective must include a measurable success condition.
- Locations must be usable at the table.
- Encounters must be varied and must include DM tips.
- The obstacle must have motivation, tactics, and roleplay guidance.
- The reward must include both mechanical and narrative consequences.
- Gold, items, danger, and stakes must fit the party level.
- Respect the toggle contract before all other style preferences.

${optionalFieldInstructions}

Return ONLY this JSON shape:

{
  "title": "string",
  "hook": "string",
  "introduction": "string",
  "objective": "string",
  "locations": [
    {
      "name": "string",
      "description": "string",
      "dm_note": "string"
    },
    {
      "name": "string",
      "description": "string",
      "dm_note": "string"
    },
    {
      "name": "string",
      "description": "string",
      "dm_note": "string"
    }
  ],
  "encounters": [
    {
      "type": "combat",
      "title": "string",
      "description": "string",
      "dm_tip": "string"
    },
    {
      "type": "social",
      "title": "string",
      "description": "string",
      "dm_tip": "string"
    },
    {
      "type": "exploration",
      "title": "string",
      "description": "string",
      "dm_tip": "string"
    }
  ],
  "obstacle": "string",
  "reward": "string"${optionalSchemaFields ? `,\n  ${optionalSchemaFields}` : ""}
}

FIELD LENGTH GUIDE:
- "title": 5-7 words, evocative and specific.
- "hook": 3-4 sentences. Inciting incident, opening scene, and a concrete NPC, object, rumor, or handout.
- "introduction": 4-5 sentences. Context, atmosphere, stakes, and what the DM should emphasize.
- "objective": 2-3 sentences. Primary goal and measurable success condition.
- "locations": exactly 3 key locations.
- Each location "description": 2-3 sensory sentences.
- Each location "dm_note": 1-2 practical DM advice sentences.
- "encounters": exactly 3 encounters, one for each act of the quest.
- Each encounter "description": 3-4 sentences.
- Each encounter "dm_tip": 2-3 sentences with pacing, fallback options, or difficulty adjustment.
- "obstacle": 3-4 sentences. Main antagonist, faction, curse, monster, environment, or moral challenge.
- "reward": 2-3 sentences. Include level-appropriate gold, item/reward, and narrative consequence.
${wantsNpc ? `- "npc": must contain name, role, personality, and secret.` : ""}
${wantsTwist ? `- "twist": 3-4 sentences with reveal timing and dramatic impact.` : ""}

QUALITY BAR:
The result should feel like a polished DM prep document for an actual session.
It must be specific enough that the DM could run the quest with minimal extra preparation.
`.trim();

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.75,
    });

    const content = completion?.choices?.[0]?.message?.content;

    let parsed;

    try {
      const clean = String(content || "")
        .replace(/```json|```/gi, "")
        .trim();

      parsed = JSON.parse(clean);
    } catch {
      return res.status(502).json({
        message: "Invalid response format from AI model",
        raw: content,
      });
    }

    // Final backend enforcement.
    // Il prompt guida il modello, ma il backend decide cosa passa al frontend.
    const allowedFields = new Set(allowedTopLevelFields);
    Object.keys(parsed).forEach((key) => {
      if (!allowedFields.has(key)) {
        delete parsed[key];
      }
    });

    if (!wantsNpc) {
      delete parsed.npc;
    }

    if (!wantsTwist) {
      delete parsed.twist;
    }

    if (wantsNpc && !hasCompleteNpc(parsed.npc)) {
      return res.status(502).json({
        message: "AI response missing required npc field",
        raw: parsed,
      });
    }

    if (wantsTwist && !hasText(parsed.twist)) {
      return res.status(502).json({
        message: "AI response missing required twist field",
        raw: parsed,
      });
    }

    return res.status(200).json({
      result: parsed,
    });
  } catch (error) {
    console.error("Errore Groq:", error);

    const msg = typeof error?.message === "string" ? error.message : "";
    const lower = msg.toLowerCase();

    if (lower.includes("api key") || lower.includes("authentication")) {
      return res.status(401).json({
        message: "GROQ_API_KEY invalid",
      });
    }

    if (lower.includes("rate limit") || lower.includes("429")) {
      return res.status(429).json({
        message: "Rate limit reached, please try again in a moment",
      });
    }

    return res.status(500).json({
      message: "Internal server error, please try again later",
    });
  }
};
