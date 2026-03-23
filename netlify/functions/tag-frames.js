export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), { status: 500 });
  }

  try {
    const { batch, playerDescriptions } = await req.json();

    if (!batch || batch.length === 0) {
      return new Response(JSON.stringify({ error: "No frames provided" }), { status: 400 });
    }

    const playerList = playerDescriptions
      .map((p, i) => `${i + 1}. "${p.label}" — ${p.description}`)
      .join("\n");

    const imageParts = batch.map((frame) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: frame.dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
      },
    }));

    const frameLabels = batch.map((f) => `"${f.id}"`).join(", ");

    const prompt = `You are tagging football/soccer match frames with player identities.

Known players:
${playerList}

I'm showing you ${batch.length} frames in order. Their IDs are: ${frameLabels}

For EACH frame, identify which of the known players are visible. Match players by their jersey color, number, and description.

Rules:
- Only tag a player if you are reasonably confident they appear in that frame
- A frame can have multiple players tagged
- A frame can have zero players if none are clearly identifiable
- Use the exact player labels from the list above

Respond ONLY with valid JSON in this exact format:
{
  "tags": {
    "frame_0": ["Red #10", "Blue GK"],
    "frame_1": ["Red #10"],
    "frame_2": []
  }
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
        temperature: 0.1,
        maxOutputTokens: 8192,
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
  path: "/.netlify/functions/tag-frames",
};
