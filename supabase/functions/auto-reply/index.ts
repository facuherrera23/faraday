import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("REPLY_FROM_EMAIL") || "no-reply@faradayenergy.com.ar";
const BRAND = "FARADAY ENERGY";

const COMPANY_LINES: Record<string, string> = {
  "ASESORAMIENTO ENERGETICO": "Analisis integral de consumo y ahorro para tu instalacion",
  "OBRAS ELECTRICAS": "Diseno, ejecucion y puesta en marcha de obras electricas",
  "MANTENIMIENTO PREVENTIVO": "Planes periodicos para evitar fallas y paradas",
  "ENERGIA SOLAR": "Sistemas fotovoltaicos a medida para reducir tu costo",
  "RESPALDO DE ENERGIA": "Proteccion ante cortes para operaciones criticas",
  "CLIMATIZACION CONFORT TERMICO": "Climatizacion profesional industrial y comercial",
  "OBRA CIVIL": "Estructuras y cimentaciones para proyectos industriales",
  "SOLUCIONES LLAVE EN MANO": "Proyectos completos de A a Z con un solo responsable",
  "TECNOLOGIA INTEGRAL": "Automatizacion, monitoreo y datos para tu operacion",
  "SEGURIDAD FISICA": "Instalaciones de vigilancia y control de accesos",
};

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json();
    const row = payload.record || payload;

    if (!row?.email || !row?.nombre) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), { status: 400 });
    }

    const to = row.email;
    const subject = "Recibimos tu consulta - " + BRAND;
    const svcInfo = COMPANY_LINES[row.tipo_servicio] || COMPANY_LINES["OTRA CONSULTA"] || "Soluciones de ingenieria energetica";
    const human = (row.nombre as string).split(" ")[0];

    const html = [
      `<div style="font-family:monospace;background:#0a0a0f;color:#f5f5f0;padding:2rem;border:1px solid #2a2a28">`,
      `<div style="font-size:0.65rem;letter-spacing:0.2em;color:#888;margin-bottom:0.75rem;text-transform:uppercase">INFORME DE RECEPCION</div>`,
      `<h2 style="font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:-0.02em;font-size:1.6rem;margin:0 0 1rem;color:#f5f5f0">GRACIAS POR CONTACTARTE</h2>`,
      `<div style="width:40px;height:2px;background:#ecb121;margin-bottom:1rem"></div>`,
      `<p style="color:#d0d0c8;line-height:1.7;margin:0 0 1rem">Hola ${human},</p>`,
      `<p style="color:#d0d0c8;line-height:1.7;margin:0 0 1rem">Recibimos tu mensaje sobre <strong style="color:#ecb121">${row.tipo_servicio}</strong>.</p>`,
      `<p style="color:#d0d0c8;line-height:1.7;margin:0 0 1rem">${svcInfo}.</p>`,
      `<p style="font-size:0.7rem;color:#888;letter-spacing:0.1em;margin:1.5rem 0 0">Respondemos en 24 hs habiles. Si es urgente: <a href="tel:+543875151179" style="color:#ecb121;text-decoration:none">+54 387 515 1179</a></p>`,
      `</div>`,
    ].join("");

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });
    } else {
      console.warn("RESEND_API_KEY no configurada, email no enviado");
    }

    return new Response(JSON.stringify({ ok: true, sent: Boolean(RESEND_API_KEY) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
