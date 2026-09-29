import { TrainingProgram, ProgramSession } from '../types/workout';

function buildPrompt(
  answers: Record<string, string | string[]>,
  recentRuns: { distanceMeters: number; durationMs: number; startTime: number }[]
): string {
  const totalKm = recentRuns.reduce((sum, r) => sum + r.distanceMeters / 1000, 0);
  const avgWeeklyKm = recentRuns.length > 0
    ? (totalKm / Math.max(1, Math.ceil(recentRuns.length / 3))).toFixed(1)
    : '0';

  const daysPerWeek = Number(answers.daysPerWeek);
  const weeks = Number(answers.weeks);

  return `You are an expert running coach with deep knowledge of periodization, sports science and injury prevention. Generate a structured training program based on the following information.

RUNNER PROFILE:
- Name: ${answers.name}
- Age: ${answers.age}
- Weight: ${answers.weight} kg
- Experience: ${answers.experience}
- Goal: ${answers.goal}
- Target event: ${answers.hasEvent === 'Yes' ? answers.eventDate : 'No specific event'}
- Program duration: ${weeks} weeks
- Days per week: ${daysPerWeek}
- Preferred session types: ${Array.isArray(answers.sessionTypes) ? answers.sessionTypes.join(', ') : answers.sessionTypes}
- Terrain: ${answers.terrainType}
- Max heart rate: ${answers.maxHeartRate === 'Yes' ? answers.maxHeartRateValue + ' bpm' : 'Unknown'}
- Injuries/limitations: ${answers.injuries || 'None'}
- Preferred rest days: ${Array.isArray(answers.restDays) ? answers.restDays.join(', ') : 'None specified'}
- Current weekly km (average): ${avgWeeklyKm} km

PERIODIZATION RULES:
- Follow the 10% weekly mileage increase rule — never increase total weekly km by more than 10% week over week
- Every 3-4 weeks, include a deload week at 60-70% of the previous week's volume to allow recovery
- Example for 8 weeks: build weeks 1-3, deload week 4, build weeks 5-7, taper week 8
- Example for 12 weeks: build 1-3, deload 4, build 5-7, deload 8, build 9-11, taper 12
- Adjust deload frequency based on runner experience — beginners deload more often
- If runner has a specific event, taper the final 1-2 weeks (reduce volume 40-50%)

SESSION PLACEMENT RULES:
- The runner has chosen to run on specific days. Use ONLY these days for sessions: ${Array.isArray(answers.restDays) 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        .filter(d => !(answers.restDays as string[]).includes(d))
        .join(', ')
    : 'all days'}
- Look at the actual gap between chosen days to determine hard/easy placement:
  * If two consecutive chosen days are adjacent (e.g. Saturday + Sunday, Monday + Tuesday): be cautious about placing two hard sessions back-to-back — only do so if the runner has high experience (${answers.experience}) and it makes sense for the training goal
  * If two chosen days have 1+ rest days between them (e.g. Wednesday + Saturday): back-to-back hard sessions are irrelevant since there is natural recovery time between them
  * If the runner has many sessions per week (6-7), back-to-back hard sessions may be necessary and acceptable — use coaching judgement
- Never place two LONG runs in the same week
- Place the long run on the day with the most recovery time before and after
- On deload weeks, replace hard sessions with easy runs of shorter distance

SESSION DISTRIBUTION (non-deload weeks):
- ${daysPerWeek} running days total
- 1 long run per week
- Intervals/tempo: ${daysPerWeek <= 3 ? '1 session' : daysPerWeek <= 5 ? '1-2 sessions' : '2-3 sessions'} per week depending on experience
- Remaining sessions: easy runs for aerobic base building
- Deload weeks: same session types but 30-40% shorter/easier

PACE GUIDELINES:
- Easy runs: fully conversational pace, low effort
- Long runs: 60-90 seconds per km slower than goal race pace
- Tempo runs: comfortably hard, goal race pace or slightly slower
- Intervals: at or faster than goal race pace
- Base all paces on experience level (${answers.experience}) and goal (${answers.goal})

INSTRUCTIONS:
- Generate a complete ${weeks}-week program starting ${new Date().toISOString().split('T')[0]}
- Be specific with distances, paces and rest periods
- Add coaching notes to each session explaining the purpose
- Return ONLY valid JSON with no markdown, no backticks, no extra text

REQUIRED JSON FORMAT:
{
  "name": "Program name",
  "sessions": [
    {
      "date": "2026-08-11",
      "type": "easy",
      "goal": {
        "type": "distance",
        "distanceKm": 5,
        "targetPaceMinPerKm": 6.0
      },
      "notes": "Easy recovery run — keep heart rate low and conversational"
    },
    {
      "date": "2026-08-13",
      "type": "interval",
      "goal": {
        "type": "intervals",
        "reps": [
          {
            "distanceMeters": 400,
            "targetPaceMinPerKm": 4.5,
            "restSeconds": 90
          }
        ]
      },
      "notes": "Track intervals — focus on consistent pace across all reps"
    },
    {
      "date": "2026-08-14",
      "type": "rest",
      "goal": {
        "type": "duration",
        "durationMinutes": 0
      },
      "notes": "Rest day — light stretching or walking only"
    }
  ]
}`;
}

export async function generateProgram(
  answers: Record<string, string | string[]>,
  recentRuns: { distanceMeters: number; durationMs: number; startTime: number }[]
): Promise<TrainingProgram> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('API key not found. Check your .env file.');
  }

  const prompt = buildPrompt(answers, recentRuns);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  // Jeg renser svaret for eventuelle markdown-backticks Claude måske tilføjer alligevel
  const cleaned = text.replace(/```json|```/g, '').trim();

  let parsed: { name: string; sessions: any[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse AI response as JSON');
  }

  const sessions: ProgramSession[] = parsed.sessions.map((s: any) => ({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    date: s.date,
    type: s.type,
    goal: s.goal,
    notes: s.notes,
    completed: false,
  }));

  const startDate = sessions[0]?.date ?? new Date().toISOString().split('T')[0];
  const endDate = sessions[sessions.length - 1]?.date ?? startDate;

  return {
    id: Date.now().toString(),
    name: parsed.name,
    createdAt: Date.now(),
    startDate,
    endDate,
    weeks: Number(answers.weeks),
    sessions,
    isActive: true,
    generatedByAI: true,
  };
}