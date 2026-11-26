// Supabase Edge Function: explain-question
// Deploy with: supabase functions deploy explain-question
// Set secret: supabase secrets set GEMINI_API_KEY=your_key_here

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY secret is not set in Supabase project.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const body = await req.json();
    const {
      questionText,
      choices = [],
      userChoiceText = "",
      correctChoiceText = "",
      chapter = "General",
      existingExplanation = "",
    } = body;

    const choicesFormatted = choices
      .map((c: { choice_text: string }, i: number) => `${String.fromCharCode(65 + i)}) ${c.choice_text}`)
      .join("\n");

    const prompt = `You are a friendly, encouraging, and expert Philippine Civil Service Examination (CSC) tutor.
Analyze the following exam question and explain it so the examinee thoroughly understands the concept for their upcoming Civil Service Exam.

Topic/Chapter: ${chapter}
Question: ${questionText}

Choices:
${choicesFormatted}

Correct Answer: ${correctChoiceText || "Not specified"}
User Selected: ${userChoiceText || "Skipped"}
${existingExplanation ? `Existing Brief Notes: ${existingExplanation}` : ""}

Return a strictly valid JSON object with EXACTLY these four keys (no additional text outside JSON):
{
  "summary": "A concise 1-sentence bottom-line explaining the core takeaway.",
  "whyCorrect": "Clear, step-by-step logic demonstrating why the correct answer is right.",
  "userTrap": "Why the user's chosen answer (or the most tempting wrong option) is a common CSC trap and why it is wrong.",
  "examTip": "A memorable rule of thumb, shortcut, formula, or mnemonic specifically useful for this type of CSC question."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: errText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: geminiRes.status,
      });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "");
    }

    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
