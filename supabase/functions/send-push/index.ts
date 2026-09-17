// FARADAY ENERGY - send-push
//
// Deploy (Supabase Dashboard > Edge Functions > New function > "send-push"):
//   1. Pegar este archivo como index.ts y hacer Deploy.
//   2. Secrets  (Edge Functions > send-push > Secrets):
//        VAPID_PUBLIC_KEY   = BIKsum_eQdwtSSyWtPrQeEZxT6UvRlVhc1S0Twdg426Y8D6fCU2fGjWOO__DlEaxCRu42o7lfFW0mmSQh6Flj64
//        VAPID_PRIVATE_KEY  = (en .pwa-signing/vapid-keys.txt, nunca en el repo)
//        VAPID_SUBJECT      = mailto:noelia@faradayenergy.com
//   3. Database > Webhooks > Add:
//        Nombre: "notify push admins", Tabla: contact_submissions, Evento: INSERT
//        URL: https://<TU_REF>.supabase.co/functions/v1/send-push
//        Headers: Content-Type: application/json
//                 Authorization: Bearer <tu anon key de Settings > API>
//
// Recibe un DB webhook ({ record: row }) o un POST manual { title, body, url }.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:noelia@faradayenergy.com";
const APP_URL = "https://faraday-energy-landing.vercel.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return new Response(JSON.stringify({ error: "VAPID secrets not configured" }), { status: 500 });
    }

    const body = await req.json();
    const row = (body && body.record) || body;

    let title = row.title || "FARADAY ENERGY";
    let msg = row.body || "";
    if (row.nombre && !msg) {
      title = row.tipo_servicio ? "Nueva consulta: " + row.tipo_servicio : "Nueva consulta";
      msg = (String(row.nombre).split(" ")[0] || "Cliente") + " — " + String(row.mensaje || "").slice(0, 120);
    }
    if (!msg) msg = "Actividad nueva en el panel.";

    const payload = JSON.stringify({
      title,
      body: msg,
      url: row.url || APP_URL + "/admin.html",
      tag: "faraday",
      icon: APP_URL + "/assets/img/icon-192.png",
      badge: APP_URL + "/assets/img/icon-192.png",
    });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: subs, error } = await sb.from("push_subscriptions").select("subscription");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sent = 0;
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(s.subscription, payload);
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 410 || e.statusCode === 404)) {
          const ep = s.subscription && s.subscription.endpoint;
          if (ep) {
            await sb.from("push_subscriptions").delete().eq("endpoint", ep).catch(() => {});
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});