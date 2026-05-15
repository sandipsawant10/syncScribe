import OpenAI from "openai";

const getClient = () => {
  const apiKey =  process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY in the environment.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
};

const generateAISummary = async (title, content) => {
  const client = getClient();

  const prompt = `
You are a helpful assistant that analyzes notes and extracts useful information.

Here is a note titled "${title}":

---
${content}
---

Please analyze this note and return a JSON response with exactly these fields:
- "summary": A concise 2-3 sentence summary of what this note is about
- "action_items": An array of specific action items or tasks mentioned (empty array if none)
- "suggested_title": A clear, descriptive title for this note (5-8 words max)

Return ONLY valid JSON, no extra text or markdown.
`;

  const response = await client.chat.completions.create({
    model: "openai/gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 600,
    temperature: 0.3,
    response_format: {
      type: "json_object",
    },
  });

  const responseText = response.choices[0].message.content.trim();

  let parsed;

  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    throw new Error("Invalid JSON response from AI");
  }

  return {
    summary: parsed.summary || "",
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
    suggested_title: parsed.suggested_title || "",
  };
};

export { generateAISummary };
