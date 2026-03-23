export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), { status: 500 });
  }

  try {
    const { sampleFrames } = await req.json();

    if (!sampleFrames || sampleFrames.length === 0) {
      return new Response(JSON.stringify({ error: "No sample frames provided" }), { status: 400 });
    }

    const imageParts = sampleFrames.map((frame) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: frame.dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
      },
    }));

    const prompt = `You are analyzing frames from a football/soccer match video. These frames are sampled at regular intervals throughout the match.

Your task: Identify every DISTINCT player visible across these frames. For each player, provide:
1. A short unique name/label (e.g., "Red #10", "Blue GK", "White #7")
2. A detailed visual description for identification: jersey color, number (if visible), shorts color, socks, any distinguishing features

Rules:
- Group the same person across frames — don't duplicate
- Include players from both teams
- If you can see a referee, include them too
- Be specific about colors and features so we can re-identify them in other frames

Respond ONLY with valid JSON in this exact format:
{
  "players": [
    {
      "label": "Red #10",
      "description": "Player wearing red jersey with number 10, white shorts, red socks. Appears to play midfield.",
      "team": "red"
    }
  ]
}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...imageParts,
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errText }), { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: "No response from Gemini", raw: data }), { status: 502 });
    }

    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/identify-players",
};
