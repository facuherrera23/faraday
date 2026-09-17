import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_URL = Deno.env.get("TEAM_WEBHOOK_URL") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json();
    const row = payload.record || payload;

    if (!row?.email) return new Response(JSON.stringify({ error: "invalid" }), { status: 400 });

    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Nueva consulta FARADAY ENERGY: ${row.nombre} (${row.tipo_servicio}) — ${row.email}${row.telefono ? " / " + row.telefono : ""}. Responder en https://faradayenergy.com.ar/admin.html`,
        }),
      });
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.rpc("insert_audit_log", {
        p_at: new Date().toISOString(),
        p_actor: "system:notify-team",
        p_action: "contact_notification_sent",
        p_entity: "contact_submissions",
        p_entity_id: row.id,
        p_meta: JSON.stringify({ telefono: row.telefono || null, tipo_servicio: row.tipo_servicio }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
