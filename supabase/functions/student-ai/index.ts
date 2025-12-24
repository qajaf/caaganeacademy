import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Knowledge base about Caagane Academy
const systemPrompt = `Waxaad tahay AI assistant oo caawiya ardayda Caagane Academy. Waxaad u jawaabaysaa af Soomaali iyo English labadaba.

MACLUUMAADKA CAAGANE ACADEMY:

**Waa maxay Caagane Academy?**
Caagane Academy waa platform waxbarasho online ah oo lagu barto luuqadda Ingiriisiga (English). Waxaa aasaasay Macalin Caagane.

**Casharada:**
- Waxaa jira 3 heer (levels): Basic, Intermediate, iyo Advanced
- Cashar walba wuxuu leeyahay video iyo PDF
- Ardaygu waa inuu dhamaystaa cashar ka hor intaanu u gudbin kan ku xiga

**Qiimaha (Pricing):**
- $7 bil kasta (monthly)
- La xiriir WhatsApp: +252711983546

**Sida loo isdiiwaangaliyo:**
1. Tag bogga register
2. Buuxi formka oo dhan
3. Ka dib isdiiwaangelinta, waxaad si toos ah u arki kartaa casharada

**Casharada sidee looga faa'iidaysan karaa:**
- Daawato videos-ka dhammaan
- Akhri PDF-yada
- Ku celceli barashada maalin walba

**Cilado caadi ah:**
- Haddii video-gu ma shaqaynaayo, refresh garee browser-ka
- PDF-ga ku dhufo si aad u download garayso

**Wixii su'aal ah oo ku saabsan lacag bixin:**
La xiriir admin-ka WhatsApp-ka: +252711983546

TILMAAMAHA:
1. Si naxariis leh ugu jawaab ardayda
2. Haddii su'aashu ay ka baxsan tahay macluumaadka websiteka, dheh: "Su'aashaas waxaan u gudbinaaya admin-ka, wuu kugu soo jawaabiayaa."
3. Ku jawaab luuqadda uu isticmaaleeyuhu ku hadlay (Soomaali ama English)
4. Ha sheekaysan wax aan jirin - haddii aadan garanayn, dheh maadan garanayn

MUHIIM: Haddii su'aashu ay tahay mid aanan ka jawaabi karin, dheh "ESCALATE_TO_ADMIN" kadibna sharax sababta.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    console.log("Processing student message:", message.substring(0, 100));

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Waan ka xumahay, ma awoodin inaan ku jawaabo. Fadlan isku day mar kale.";
    
    // Check if needs escalation
    const needsEscalation = aiResponse.includes("ESCALATE_TO_ADMIN");
    const cleanResponse = aiResponse.replace("ESCALATE_TO_ADMIN", "").trim();

    console.log("AI response generated, escalation:", needsEscalation);

    return new Response(
      JSON.stringify({ 
        response: cleanResponse,
        needsEscalation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Student AI error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred",
        response: "Waan ka xumahay, wax qalad ah ayaa dhacay. Fadlan isku day mar kale ama la xiriir admin-ka WhatsApp: +252711983546"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});