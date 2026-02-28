// deepseek.js — DeepSeek API service for dream reconstruction + interpretation

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

const RECONSTRUCT_PROMPT = `You are Somnus, a dream memory specialist. The user will provide fragmented dream notes — keywords, phrases, or short sentences. Your job is to:

1. **Reconstruct** the dream into a coherent first-person narrative (3-6 sentences). Fill in natural transitions between fragments, but stay faithful to what was given. Don't invent major new elements.
2. **Extract keywords** — pick out the 5-10 most symbolically important nouns/concepts from the dream.

Respond in STRICT JSON format:
{
  "narrative": "I was standing in... (first-person dream narrative)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Rules:
- Respond in the SAME LANGUAGE as the input (Chinese input → Chinese response)
- Keep the narrative dreamlike and slightly surreal
- Keywords should be single words or very short phrases
- Output ONLY valid JSON, nothing else`;

const INTERPRET_PROMPT = `You are Somnus, a dream interpreter drawing from Freudian psychoanalysis, Jungian archetypes, and modern dream psychology.

Given a dream narrative, provide:
1. **Symbolic Analysis** — Interpret key symbols through a psychoanalytic lens (unconscious desires, repressed emotions, archetypes, shadow self, anima/animus, etc.)
2. **Emotional Insight** — 1-2 sentences connecting the dream to the dreamer's inner emotional state

Style guidelines:
- Be insightful and slightly mysterious
- Use Freudian and Jungian concepts naturally (id/ego/superego, the Shadow, collective unconscious)
- Don't be afraid to suggest deeper meanings
- Be poetic but psychologically grounded
- Total response: 150-250 words
- Respond in the same language as the narrative
- Use markdown: **bold** for key symbols and concepts`;

/**
 * Step 1: Reconstruct dream from fragments + extract keywords
 * @returns {Promise<{narrative: string, keywords: string[]}>}
 */
export async function reconstructDream(fragments, mood, apiKey, dreamContext) {
    if (!apiKey) throw new Error('NO_API_KEY');

    const moodMap = {
        '😊': 'Happy', '😌': 'Calm', '😨': 'Scared', '😢': 'Sad',
        '🤔': 'Confused', '😴': 'Hazy', '🥰': 'Loved', '😤': 'Intense',
    };

    const userMsg = `Dream fragments:\n${fragments}\n\nMood upon waking: ${moodMap[mood] || mood}`;

    let systemPrompt = RECONSTRUCT_PROMPT;
    if (dreamContext) {
        systemPrompt += `\n\nDreamer's personal context (use this to understand codenames, relationships, and recurring people):\n${dreamContext}`;
    }

    const response = await fetch(DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMsg },
            ],
            temperature: 0.7,
            max_tokens: 512,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('INVALID_API_KEY');
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
        const parsed = JSON.parse(content);
        return {
            narrative: parsed.narrative || 'The dream slips through my fingers...',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        };
    } catch {
        return { narrative: content, keywords: [] };
    }
}

/**
 * Step 2: Interpret the confirmed dream narrative
 * @returns {Promise<string>}
 */
export async function interpretDream(narrative, keywords, mood, apiKey, dreamContext) {
    if (!apiKey) throw new Error('NO_API_KEY');

    const moodMap = {
        '😊': 'Happy', '😌': 'Calm', '😨': 'Scared', '😢': 'Sad',
        '🤔': 'Confused', '😴': 'Hazy', '🥰': 'Loved', '😤': 'Intense',
    };

    const userMsg = `Dream narrative:\n${narrative}\n\nKey symbols: ${keywords.join(', ')}\nMood upon waking: ${moodMap[mood] || mood}`;

    let systemPrompt = INTERPRET_PROMPT;
    if (dreamContext) {
        systemPrompt += `\n\nDreamer's personal context (use this to understand codenames, relationships, and recurring people):\n${dreamContext}`;
    }

    const response = await fetch(DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMsg },
            ],
            temperature: 0.85,
            max_tokens: 512,
        }),
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('INVALID_API_KEY');
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'The dream fades into silence...';
}
