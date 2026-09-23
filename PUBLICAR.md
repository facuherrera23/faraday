# PUBLICAR.md — Checklist maestro de lanzamiento

Estado del proyecto: **listo**. Todo el codigo esta construido, probado y deployado.
Este documento te lleva de cero a produccion real. Cada paso dice si necesita cuenta o no.

**Sitio actual:** https://faraday-energy-landing.vercel.app (sw v16)

---

## Lo que funciona HOY, sin ninguna cuenta nueva

- Sitio completo ES/EN (30 paginas), cotizador con salida WhatsApp, blog, privacidad
- Formulario de contacto -> llega por EMAIL via formsubmit.co (cuando hagas el PASO 0)
- Si ambos canales fallan, el lead se guarda en el navegador del visitante y se reenvia solo
- SEO tecnico completo (Lighthouse SEO 100), PWA instalable, 404 custom, CI verde

---

## PASO 0 — Activar el email de leads (30 segundos, NO necesita cuentas)

Sin esto el formulario no envia emails. Solo se hace una vez en la vida.

1. Abri **faradayenergycfc@gmail.com** (web o celular)
2. Busca un mail de **FormSubmit** con asunto tipo "Activate Form" (revisa spam/promociones;
   si no esta, envia una prueba desde el formulario del sitio y llega de nuevo)
3. Clickea el boton **Activate Form** del mail
4. Listo: desde ese momento cada formulario del sitio llega a esa casilla,
   y cualquier lead encolado se reenvia automaticamente

**Verificacion:** envia una consulta de prueba desde https://faraday-energy-landing.vercel.app/pages/contacto.html
y confirma que llega al Gmail.

---

## PASO 1 — Crear el proyecto Supabase (30-45 minutos, necesita cuenta)

El proyecto anterior fue eliminado. Guia detallada con capturas de contexto: `supabase/SETUP.md`.
Resumen operativo:

### 1a. Crear proyecto
- https://supabase.com -> New Project -> region **South America (Sao Paulo)** -> clave fuerte
- Guarda el "Project URL" y la "anon public" key (Settings > API)

### 1b. Base de datos (SQL Editor > New query > pegar > Run)
1. Todo el contenido de `supabase/setup.sql` (tablas, RLS, usuarios, testimonios)
2. Todo el contenido de `supabase/push-subscriptions.sql`

### 1c. Tu usuario admin
- Authentication > Users > Add User -> tu email + clave + Auto Confirm User activado
- SQL Editor: `UPDATE public.admin_profiles SET role='super_admin' WHERE email='tu-email';`

### 1d. Conectar el sitio (el paso de codigo, 1 linea)
Opcion A (recomendada), en la raiz del proyecto:
```
python _setup_backend.py "https://TU-PROYECTO.supabase.co" "eyJ...anon..."
npx vercel deploy --prod --yes
```
Opcion B: edita `js/supabase-config.js` y reemplaza `SUPABASE_URL_AQUI` y `SUPABASE_ANON_KEY_AQUI`.

Con eso reviven solos: panel admin con leads reales (reemplaza el MODO DEMO),
guardado en base de datos, contador de leads en tiempo real.

Tambien revive la pestana IMAGENES del panel: subi una foto para cualquier
pagina (inicio, cada servicio, contacto...) y reemplaza su imagen default
de portada al instante. El SQL del bucket ya viene en setup.sql.

### 1e. Edge Functions (para notificaciones y auto-reply)
- Edge Functions > New function -> `send-push` -> pegar `supabase/functions/send-push/index.ts` -> Deploy
- Secrets de la funcion (pestaña Secrets), los valores estan en `.pwa-signing/vapid-keys.txt`:
  - `VAPID_PUBLIC_KEY` = BEzVRS3-OOt... (la publica completa esta en el archivo)
  - `VAPID_PRIVATE_KEY` = (la privada del archivo vapid-keys.txt)
  - `VAPID_SUBJECT` = mailto:noelia@faradayenergy.com
- Opcional: `auto-reply` y `notify-team` con `supabase/functions/auto-reply/index.ts`
  y `supabase/functions/notify-team/index.ts` (necesitan RESEND_API_KEY / TEAM_WEBHOOK_URL)

### 1f. Webhook de notificacion
- Database > Webhooks > Add: tabla `contact_submissions`, evento INSERT,
  URL `https://TU-PROYECTO.supabase.co/functions/v1/send-push`,
  headers `Content-Type: application/json` + `Authorization: Bearer <anon key>`
- Cada admin activa "ACTIVAR NOTIFICACIONES" desde el panel y le llega al celular

---

## PASO 2 — Login con Google (opcional, 10 minutos, necesita cuenta Google Cloud)

Para que el equipo entre con su Gmail en el admin (ya esta codificado):

1. https://console.cloud.google.com -> crear proyecto -> Credentials -> Create Credentials -> OAuth Client ID (Web application)
2. Authorized redirect URI: la que muestra Supabase en Authentication > Providers > Google (`https://TU-PROYECTO.supabase.co/auth/v1/callback`)
3. En Supabase: Authentication > Providers > Google -> pegar Client ID + Client Secret -> Save

Con email+contrasena ya funciona sin este paso.

---

## PASO 3 — Dominio propio (opcional pero recomendado, 15 minutos)

El SEO hoy apunta al subdominio de Vercel. Cuando compres el dominio:

1. Vercel dashboard > Project > Settings > Domains -> agregar el dominio -> configurar DNS como indica
2. En la raiz del proyecto:
```
python _switch_domain.py "tudominio.com.ar"        (dry-run: muestra lo que va a cambiar)
python _switch_domain.py "tudominio.com.ar" --apply (aplica: canonicals, sitemap, robots, OG, schemas)
npx vercel deploy --prod --yes
```
3. Google Search Console: agregar y verificar el dominio -> enviar `https://tudominio.com.ar/sitemap.xml`
4. Si cambiaste de dominio y distribuis la app Android: la TWA apunta al dominio
   que tenia cuando se genero el APK. Con dominio nuevo, re-generarla (PWABuilder o bubblewrap).

---

## Checklist final de verificacion (5 minutos)

- [ ] `/pages/contacto.html`: enviar consulta de prueba -> llega el email (PASO 0 ok)
- [ ] `/admin.html`: login con tu usuario real -> leads reales (PASO 1 ok)
- [ ] `/admin.html`: boton ACTIVAR NOTIFICACIONES -> notificacion de prueba
- [ ] `/pages/clientes.html`: testimonios aprobados aparecen solos (los cargas desde el panel)
- [ ] Celular: menu hamburguesa abre, cotizador envia por WhatsApp
- [ ] Google Search Console: dominio verificado y sitemap enviado
- [ ] (con dominio) `https://tudominio.com.ar` responde y el formulario sigue llegando

---

## Opcionales post-lanzamiento

- **Turnstile (anti-spam fuerte)**: https://dash.cloudflare.com -> Turnstile -> new site ->
  edita `js/turnstile-config.js` (`enabled: true` + siteKey) -> deploy. El form lo respeta solo.
- **Analytics**: crea la cuenta en plausible.io y define `window.PL_CONFIG = { domain: 'tudominio.com.ar' }`
  en el `<head>` antes de cargar `js/analytics.js`
- **Sentry (monitoreo de errores)**: define `window.SENTRY_DSN = 'https://...'` igual que PL_CONFIG
- **Google Analytics/Search Console**: ya cubierto en PASO 3.4

---

## Cuentas que necesitas crear (resumen)

| Cuenta | Para | Costo |
|---|---|---|
| Supabase | Base de datos + login + push + funciones | Gratis (tier free alcanza) |
| FormSubmit | Email de leads | Gratis (solo activar, PASO 0) |
| Google Cloud (opcional) | Login con Google | Gratis |
| Plausible (opcional) | Analytics | Gratis/USD 9 por mes |
| Vercel | Hosting | Gratis (ya configurada) |
| Dominio | Marca propia | ~USD 10-20/anio |
