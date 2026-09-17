# FARADAY ENERGY - Setup del Backend (Supabase) y APK

Todo el código ya está escrito y con la identidad visual de la web. Este documento es la guía paso a paso para poner a funcionar TODO con costo cero. Solo necesitas crear una cuenta gratuita de Supabase (no se cobra nada hasta que agotás el tier gratuito, que es enorme para este caso).

---

## Paso 1 — Crear el proyecto Supabase (2 minutos)

1. Entrá a https://supabase.com y creá una cuenta (con GitHub o email, gratis).
2. Click en **New Project**.
3. Elegí el nombre que quieras (sugerido: `faraday-energy-production`).
4. Elegí una región cercana a Argentina: **South America (Sao Paulo)**.
5. Contraseña de base de datos: generá una FUERTE y guardala en una nota (no la vas a necesitar después).

El proyecto tarda 30 segundos en crearse.

---

## Paso 2 — Configurar la base de datos (1 minuto)

1. En el menú izquierdo, **SQL Editor**.
2. Click en **New query**.
3. Copiá y pegá **TODO** el contenido del archivo `supabase/setup.sql` que está en esta carpeta.
4. Click en **Run** (o ctrl+enter).
5. Deberías ver: "Success. No rows returned". Listo la base de datos.

Esto crea:
- Tabla `contact_submissions` (donde van a caer TODOS los formularios del contacto, ahí se van a ir acumulando con fecha, nombre, empresa, email, teléfono, tipo de servicio, mensaje, estado).
- Tabla `admin_profiles` (lista de usuarios autorizados a ver el panel).
- Función + trigger que detecta usuarios nuevos automáticamente.
- Todas las reglas de seguridad (RLS) para que nadie externo pueda leer nada y cualquiera pueda enviar un formulario.

---

## Paso 3 — Copiar las 2 claves (30 segundos)

1. En el menú izquierdo, **Settings** > **API**.
2. Copiá:
   - **Project URL** (empieza con `https://`)
   - **anon public** (la clave larga, empieza con `eyJ...`)
3. Editá el archivo `js/supabase-config.js` que está en la raíz y reemplazá:

```js
url: 'TU_SUPABASE_URL',        // pegá la Project URL
anonKey: 'TU_SUPABASE_ANON_KEY' // pegá la anon key
```

**IMPORTANTE:** la anon key es PÚBLICA — es la intención. La seguridad sale de las reglas RLS que ya creaste. La SERVICE_ROLE key NO la pegues nunca.

4. Guardás y ya el formulario está conectado.

---

## Paso 4 — Crear tu primer usuario admin (1 minuto)

1. En Supabase, menú **Authentication** > **Users**.
2. Click en **Add User** > **Create new user**.
3. Poné tu email real y una contraseña fuerte.
4. **Importante**: habilitá el checkbox **Auto Confirm User**.

### Autorizá tu usuario desde SQL (10 segundos)

1. Menu **SQL Editor** > **New query**.
2. Ejecutá (cambiando el email por el tuyo):

```sql
UPDATE public.admin_profiles
SET role = 'super_admin', nombre = 'Noelia'
WHERE email = 'tu-email-aqui@ejemplo.com';
```

3. Ya sos **super admin**.

---

## Paso 5 — Habilitar el login con Google (opcional, gratis, 5 minutos)

Si querés que el equipo entre con su Google (además de email+contraseña):

1. En Supabase: **Authentication** > **Providers**
2. Habilitá **Google**
3. Necesitás crear credenciales en https://console.cloud.google.com:
   - Crear proyecto
   - APIs & Services > Credentials > Create Credentials > OAuth Client ID
   - Tipo: Web application
   - Authorized redirect URIs: lo copiás del callback que Supabase te muestra en ese panel (`https://TU-PROYECTO.supabase.co/auth/v1/callback`)
4. Pegás el Client ID y Client Secret en Supabase, y listo.

Sino, que entren con email+contraseña (que ya funciona).

---

## Paso 6 — Probar la app web (el admin panel)

Abrile en el navegador del celular o la PC:

```
https://TU-DOMINIO/admin.html
```

(o en local: `http://127.0.0.1:8123/admin.html`)

1. Te logueás con el email que creaste en el Paso 4.
2. Entrás a la pestaña **CONSULTAS** (todas las entradas del formulario aparecen ahí, actualizándose en tiempo real).
3. Y si pieras super_admin, la pestaña **EQUIPO** muestra a los demás usuarios con sus roles (super_admin, admin, pending).

**Cómo agregar equipo:**
1. Que cada quien se vaya a `admin.html` y cree una cuenta (email + contraseña o Google).
2. Cuando entran, verán "ACCESO PENDIENTE".
3. Vos (como super admin) entrás a la pestaña **EQUIPO**, les cambiás el dropdown de "PENDIENTE" a "ADMIN".
4. Se les habilita todo el panel.

---

## Paso 7 — Generar el APK gratis con PWABuilder (10 minutos)

1. Tenés que tener la web **publicada** en internet primero (la que ya tenés). Si no la publicaste, PWABuilder no funciona — avisame y te ayudo a subirla gratis a Vercel/Netlify/GitHub Pages.
2. Entrá a https://www.pwabuilder.com
3. Pegá la URL completa: `https://TU-DOMINIO/admin.html`
4. PWABuilder analiza y te muestra una scorecard. Si falta algo (icono, service worker), ya está todo incluido en este repo.
5. Click en **Package For Stores** > **Android**.
6. Elegí **TWA APK** (Trusted Web Activity) > **Download**.
7. Te descarga un `.apk` file.

### Instalar en tu celular
1. Pasás el `.apk` al celular (por USB, por WhatsApp, por Drive, lo que quieras).
2. Lo abrís. Te va a pedir permiso de "instalar apps desconocidas" — aceptás.
3. Se va a ver como cualquier app en tu menú, con el ícono dorado de FARADAY.

---

## Quién tiene qué permiso

| Rol | Ver consultas | Cambiar estado de consulta | Ver/gestionar equipo | Borrar consultas |
|---|---|---|---|---|
| **pending** (recién creada) | ❌ (ve "acceso pendiente") | ❌ | ❌ | ❌ |
| **admin** | ✅ | ✅ | ❌ | ❌ |
| **super_admin** (vos) | ✅ | ✅ | ✅ | ✅ |

---

## Estructura de los datos

```
contact_submissions
├── id (uuid, auto)
├── created_at (fecha y hora automática)
├── nombre
├── empresa
├── email
├── telefono              ← NUEVO
├── tipo_servicio         ← NUEVO (dropdown con las 10 líneas de servicio)
├── mensaje
└── estado                (nuevo / leido / contactado / cerrado)

admin_profiles
├── user_id (uuid, vinculado al usuario de Supabase Auth)
├── email
├── nombre
├── role (pending / admin / super_admin)
└── created_at
```

---

## Si algo falla

- **Formulario no envía**: abrí dev tools > Network > buscá el request a `supabase.co/rest/v1/...`, fijate qué código devuelve. Probablemente es la key mal copiada.
- **Login no funciona**: fijate que el usuario exista en Authentication > Users. Si se registro por si solo, aprobálos desde EQUIPO (tiene que estar como `admin` o `super_admin`, no `pending`).
- **RLS error 403**: verificá que ejecutaste TODO el setup.sql, en especial la parte del DROP y re-create de políticas.
- **Google login falla**: habilitaste el provider en Supabase? Pegaste bien la redirect URI?

Mandame el error y lo arreglamos.

## Edge Functions (notificación instantánea del equipo)

Los dos Edge Functions del proyecto avisan al equipo cuando alguien completa el formulario:

- `supabase/functions/auto-reply/index.ts` — auto-reply al cliente por email vía Resend (gratis hasta 100 emails/día)
- `supabase/functions/notify-team/index.ts` — POST a un webhook del equipo (Slack/Discord/n8n/Telegram)

### Deploy (5 min, gratis)

1. Instalá la CLI: `npm install -g supabase`
2. `supabase login` (te abre el browser)
3. `supabase link --project-ref TU_PROJECT_REF` (está en Settings > General)
4. `supabase functions deploy auto-reply && supabase functions deploy notify-team`
5. Seteá las env vars: `supabase secrets set RESEND_API_KEY=re_xxx TEAM_WEBHOOK_URL=https://discord.com/api/webhooks/...`

### Trigger automatico

Supabase Dashboard > Database > Webhooks > Create webhook:
- Table: `contact_submissions` / Events: `INSERT` / HTTP: POST a `https://TU-PROYECTO.supabase.co/functions/v1/auto-reply`
- Repetí lo mismo para `notify-team`.

Si no querés configurar esto ahora, el form guarda en DB igual y accedés a las consultas desde `admin.html`.