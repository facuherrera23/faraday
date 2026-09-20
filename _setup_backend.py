# -*- coding: utf-8 -*-
# _setup_backend.py <SUPABASE_URL> <SUPABASE_ANON_KEY>
# Conecta el proyecto Supabase nuevo: parchea supabase-config.js y bumpea el SW.
# Uso: python _setup_backend.py "https://xxxx.supabase.co" "eyJ..."
import io, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
CFG = os.path.join(BASE, 'js', 'supabase-config.js')
SW = os.path.join(BASE, 'sw.js')

def load(p):
    with io.open(p, encoding='utf-8') as f: return f.read()
def save(p, t):
    with io.open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(t)

if len(sys.argv) != 3:
    print('Uso: python _setup_backend.py "https://TU-PROYECTO.supabase.co" "eyJ...anon..."')
    sys.exit(1)

url, key = sys.argv[1], sys.argv[2]
assert url.startswith('https://') and url.endswith('.supabase.co'), 'URL invalida: debe ser https://xxxx.supabase.co'
assert key.startswith('eyJ'), 'La anon key empieza con eyJ (si empieza con sb_secret_ es la WRONG key: NUNCA la service_role)'
assert '"' not in url and "'" not in url and '"' not in key and "'" not in key, 'caracteres invalidos'

c = load(CFG)
assert "url: 'SUPABASE_URL_AQUI'" in c and "anonKey: 'SUPABASE_ANON_KEY_AQUI'" in c, 'config ya estaba parcheado?'
c = c.replace("url: 'SUPABASE_URL_AQUI'", "url: '" + url + "'", 1)
c = c.replace("anonKey: 'SUPABASE_ANON_KEY_AQUI'", "anonKey: '" + key + "'", 1)
import re as _re
assert _re.search(r"url: '([^']+)'", c).group(1) == url, 'url no quedo parcheada'
assert _re.search(r"anonKey: '([^']+)'", c).group(1) == key, 'anonKey no quedo parcheada'
save(CFG, c)
print('OK supabase-config.js conectado a', url)

s = load(SW)
m = re.search(r"var VERSION = 'v(\d+)';", s)
assert m, 'VERSION no encontrada en sw.js'
nueva = 'v' + str(int(m.group(1)) + 1)
s = s.replace(m.group(0), "var VERSION = '" + nueva + "';", 1)
save(SW, s)
print('OK sw.js bump ->', nueva)
print('LISTO. Ahora: npx vercel deploy --prod --yes  (y el admin conectara de verdad)')
