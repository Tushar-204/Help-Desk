// Gemini chat completions. Returns null when unavailable so routes can fall back.
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM = `You are the friendly IT support assistant inside an employee helpdesk app.
Answer in 1-3 short sentences of plain text. No markdown, no lists, no ticket numbers.
Ask one clarifying question when the problem is unclear.
If troubleshooting steps are supplied, acknowledge them and tell the user to try them.
Never invent policy, prices, or account details.`;

async function askGemini({ message, history = [], steps = [] }) {
  if (!KEY) return null;

  const turns = history
    .filter((m) => m && m.text)
    .slice(-12)
    .map((m) => ({
      role: m.from === 'bot' ? 'model' : 'user',
      parts: [{ text: String(m.text).slice(0, 500) }],
    }));

  let context = '';
  if (steps && steps.list?.length) {
    const list = steps.list.map((s, i) => `${i + 1}. ${s}`).join('\n');
    context = steps.tried
      ? `Detected topic: ${steps.topic}. The user already tried these steps:\n${list}\nDo not repeat them. Ask what happened when they tried them.`
      : `Detected topic: ${steps.topic}. Suggested steps shown to the user:\n${list}`;
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [
      ...turns,
      { role: 'user', parts: [{ text: `${message}${context ? `\n\n[${context}]` : ''}` }] },
    ],
    // Thinking would consume the small answer budget and return empty texts.
    generationConfig: { temperature: 0.6, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } },
  };

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .join('')
      .trim();
    return text || null;
  } catch (err) {
    console.error('Gemini request failed:', err.message);
    return null;
  }
}

module.exports = { askGemini };
