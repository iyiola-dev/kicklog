export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500 });
  }

  try {
    const { playerLabel, playerDescription, frameCount, timestamps, frameDataUrls } = await req.json();

    if (!playerLabel) {
      return new Response(JSON.stringify({ error: "No player info provided" }), { status: 400 });
    }

    const imageContent = (frameDataUrls || []).slice(0, 20).map((dataUrl) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
      },
    }));

    const textContent = {
      type: "text",
      text: `You are a football/soccer match analyst. Analyze the performance of this player based on the frames shown.

Player: ${playerLabel}
Description: ${playerDescription}
Total frames tagged: ${frameCount}
Timestamps where they appear: ${timestamps}

Based on these frames, provide a tactical analysis covering:
1. **Position & Role** — Where does this player primarily operate on the pitch?
2. **Movement Patterns** — Do they stay in position, make runs, drift wide, drop deep?
3. **On-ball Actions** — Any visible involvement with the ball (dribbling, passing, shooting)?
4. **Off-ball Behavior** — Positioning when not on the ball, pressing, covering space?
5. **Key Moments** — Any standout frames showing important actions?
6. **Overall Assessment** — Brief summary of their match contribution.

Keep the analysis concise but insightful. Write in a professional coaching tone. If certain aspects aren't clearly visible from the frames, say so rather than guessing.`,
    };

    const content = imageContent.length > 0 ? [...imageContent, textContent] : [textContent];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }), { status: 502 });
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text;

    if (!summary) {
      return new Response(JSON.stringify({ error: "No response from Claude", raw: data }), { status: 502 });
    }

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/generate-summary",
};
