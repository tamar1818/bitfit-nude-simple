// AI meal suggestions endpoint — returns 4 meal ideas tailored to remaining calories
// and target macros, using Lovable AI Gateway (Gemini Flash).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SuggestRequest {
  remainingCalories: number;
  goal: "lose" | "gain" | "maintain";
  lang: "ka" | "en";
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { remainingCalories, goal, lang, mealType }: SuggestRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys =
      lang === "ka"
        ? `შენ ხარ ბიტფიტ - ქართული ფიტნეს კოულჩი. შესთავაზე ჯანსაღი კერძები ქართული სამზარეულოს გათვალისწინებით. პასუხი მხოლოდ JSON ფორმატში.`
        : `You are Bitfit — a friendly Georgian fitness coach. Suggest healthy meals familiar to a Georgian audience (lobio, mchadi, khinkali variations, salads, grilled meats, etc.). Respond ONLY via the suggest_meals tool.`;

    const userMsg =
      lang === "ka"
        ? `შემომთავაზე 4 კერძი ${mealType ?? "ნებისმიერი"} დროისთვის. დარჩენილი კალორია დღეს: ${remainingCalories}. მიზანი: ${goal}. თითოეული კერძი დაახლოებით ${Math.round(remainingCalories / 4)} კალორია.`
        : `Suggest 4 meals for ${mealType ?? "any"} time. Remaining calories today: ${remainingCalories}. Goal: ${goal}. Each meal should be roughly ${Math.round(remainingCalories / 4)} calories.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_meals",
              description: "Return 4 meal suggestions",
              parameters: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Meal name in target language" },
                        emoji: { type: "string", description: "Single emoji representing the meal" },
                        calories: { type: "number" },
                        protein_g: { type: "number" },
                        carbs_g: { type: "number" },
                        fats_g: { type: "number" },
                        why: { type: "string", description: "1-sentence reason this fits the goal" },
                      },
                      required: ["name", "emoji", "calories", "protein_g", "carbs_g", "fats_g", "why"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["meals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_meals" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "no_credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error:", response.status, txt);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { meals: [] };

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meal-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
