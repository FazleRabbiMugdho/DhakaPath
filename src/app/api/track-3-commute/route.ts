// ==============================================================================
// src/app/api/track-3-commute/route.ts
// Sandboxed LLM Intent Parser, SAT Grounding Verifier & Vision OCR Server API
// INIF 2026 DhakaPath — Track 3 (Dev 3: AI, NLP & Vision Engineer)
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  parseBanglishQueryDeterministic,
  safeExtractJson,
  BanglishParseResult,
} from "../../../features/feature-1-commute/banglishParser";
import {
  verifySubgraphTrajectory,
} from "../../../features/feature-1-commute/subgraphVerifier";
import {
  digitizeSignboardImage,
} from "../../../features/feature-1-commute/signboardVision";
import { ParetoRouteOption } from "../../../contracts/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await req.json();
    const action = body.action || "parse_intent";

    // --------------------------------------------------------------------------
    // ACTION 1: PARSE BANGLISH COMMUTER INTENT (Groq / Gemini / Deterministic)
    // --------------------------------------------------------------------------
    if (action === "parse_intent") {
      const rawQuery = String(body.query || "");

      // Immediately run deterministic lexer as baseline
      const deterministicResult = parseBanglishQueryDeterministic(rawQuery);

      // If adversarial hallucination detected, return immediately without wasting LLM calls
      if (deterministicResult.adversarialHallucinationDetected) {
        return NextResponse.json({
          ...deterministicResult,
          latency_ms: Number((performance.now() - startTime).toFixed(2)),
        });
      }

      // Check if external Groq API key is configured
      const groqApiKey = process.env.GROQ_API_KEY;

      if (groqApiKey) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 750);

          const systemPrompt = `You are a strict transit intent parser for Dhaka, Bangladesh.
Return ONLY valid JSON with keys:
"origin_hub_id" (one of: H_UTTARA, H_MIRPUR10, H_AGARGAON, H_MOHAKHALI, H_BADDA, H_BANASREE, H_MALIBAGH, H_FARMGATE, H_MOHAMMADPUR, H_DHANMONDI, H_SCIENCELAB, H_SHAHBAGH, H_MOTIJHEEL, H_JATRABARI, H_GULISTAN),
"dest_hub_id" (same hub enum),
"is_student" (boolean),
"max_budget_bdt" (number),
"avoid_hub_ids" (array of hub enum strings),
"adversarialHallucinationDetected" (boolean: true if user asks for ferry on land, underground boat, helicopter, etc.)`;

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: rawQuery },
              ],
              temperature: 0.1,
              response_format: { type: "json_object" },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const content = groqData.choices?.[0]?.message?.content || "";
            const parsedJson = safeExtractJson<Partial<BanglishParseResult>>(content, {});

            if (parsedJson.origin_hub_id && parsedJson.dest_hub_id) {
              const latency_ms = Number((performance.now() - startTime).toFixed(2));
              return NextResponse.json({
                origin_hub_id: parsedJson.origin_hub_id,
                dest_hub_id: parsedJson.dest_hub_id,
                is_student: Boolean(parsedJson.is_student),
                max_budget_bdt: parsedJson.max_budget_bdt || deterministicResult.max_budget_bdt,
                avoid_hub_ids: parsedJson.avoid_hub_ids || deterministicResult.avoid_hub_ids,
                adversarialHallucinationDetected: Boolean(parsedJson.adversarialHallucinationDetected),
                origin_resolved: true,
                dest_resolved: true,
                parser_source: "LLM_SANDBOX",
                latency_ms,
              });
            }
          }
        } catch {
          // If Groq fails or times out, seamlessly return deterministic fallback
        }
      }

      // Seamless deterministic regex fallback (< 0.2ms)
      const latency_ms = Number((performance.now() - startTime).toFixed(2));
      return NextResponse.json({
        ...deterministicResult,
        latency_ms,
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 2: DIGITIZE SIGNBOARD VISION OCR
    // --------------------------------------------------------------------------
    if (action === "digitize_signboard") {
      const result = await digitizeSignboardImage({
        base64Image: body.base64Image,
        presetId: body.presetId,
        rawOcrText: body.rawOcrText,
      });
      return NextResponse.json(result);
    }

    // --------------------------------------------------------------------------
    // ACTION 3: SAT SUBGRAPH GROUNDING VERIFIER V(P) = 1
    // --------------------------------------------------------------------------
    if (action === "verify_grounding") {
      const route = body.route as ParetoRouteOption;
      const isStudent = Boolean(body.is_student);

      const verifierResult = verifySubgraphTrajectory(route, isStudent);
      return NextResponse.json({
        ...verifierResult,
        latency_ms: Number((performance.now() - startTime).toFixed(2)),
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 4: SIGNBOARD PHOTO -> TEXT (Gemini free-tier vision). The client then
    // runs the deterministic digitizer on the transcript, so grounding still applies.
    // --------------------------------------------------------------------------
    if (action === "ocr_image") {
      const geminiKey = process.env.GEMINI_API_KEY;
      const dataUrl = String(body.base64Image || "");
      const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
      if (!geminiKey || !match) return NextResponse.json({ ok: false, reason: "vision unavailable" });
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text:
                        "This is a Dhaka bus signboard, printed fare chart or handwritten route note. " +
                        "Transcribe every route as one line in the exact form: <Origin> -> <Destination> : <fare> BDT. " +
                        "Add the word metro if it is a metro rail fare. Output only those lines, no commentary.",
                    },
                    { inline_data: { mime_type: match[1], data: match[2] } },
                  ],
                },
              ],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return NextResponse.json({ ok: false, reason: "vision error" });
        const data = await res.json();
        const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return NextResponse.json({ ok: text.trim().length > 0, rawOcrText: text.trim() });
      } catch {
        return NextResponse.json({ ok: false, reason: "vision timeout" });
      }
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal API Error", details: message },
      { status: 500 }
    );
  }
}
