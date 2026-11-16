// Panggilan ke Groq (API kompatibel OpenAI)
export async function groqChat(messages, { maxTokens = 4000, temperature = 0.3 } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY belum diatur");
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const body = { model, messages, max_tokens: maxTokens, temperature };
  if (model.includes("gpt-oss")) body.reasoning_effort = "low"; // jawaban cepat, token penalaran hemat
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (r.status === 429) throw new Error("AI sedang sibuk karena batas kuota per menit. Coba lagi sekitar 1 menit lagi.");
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Groq ${r.status}: ${t.slice(0, 200)}`);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}
