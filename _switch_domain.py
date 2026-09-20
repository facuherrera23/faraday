# -*- coding: utf-8 -*-
# _switch_domain.py <dominio> [--apply]
# Cuando tengas dominio propio: pasa todo el SEO (canonicals, og:url, hreflang,
# sitemap, robots, JSON-LD) del dominio viejo de Vercel al nuevo.
# Sin --apply: SOLO DRY-RUN (cuenta y muestra, no escribe nada).
import io, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
OLD = 'faraday-energy-landing.vercel.app'
SKIP = {'.git', '.vercel', '.pwa-signing', '.claude', '.agents', '.playwright-mcp',
        '.codegraph', '.omo', '__pycache__', 'node_modules', 'screenshots',
        'data', 'skills', 'agent', '.github'}

if len(sys.argv) < 2:
    print('Uso: python _switch_domain.py "faradayenergy.com.ar" [--apply]')
    sys.exit(1)

new = sys.argv[1].strip().rstrip('/').replace('https://', '')
assert re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', new), 'dominio invalido: ' + new
APPLY = '--apply' in sys.argv

def load(p):
    with io.open(p, encoding='utf-8') as f: return f.read()

total = 0
files_touched = 0
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in files:
        if not f.endswith(('.html', '.xml', '.txt', '.json', '.md')):
            continue
        if f.startswith('skills-lock') or f == 'PUBLICAR.md' or f == 'README.txt':
            continue
        p = os.path.join(root, f)
        d = load(p)
        n = d.count(OLD)
        if not n:
            continue
        files_touched += 1
        total += n
        print('%-46s %d ocurrencias' % (os.path.relpath(p, BASE), n))
        if APPLY:
            with io.open(p, 'w', encoding='utf-8', newline='\n') as fh:
                fh.write(d.replace(OLD, new))

print()
print('TOTAL: %d ocurrencias en %d archivos' % (total, files_touched))
if not APPLY:
    print('DRY-RUN (no se escribio nada). Corre de nuevo con --apply para aplicar.')
else:
    print('APLICADO. Recordar:')
    print('  1. sw.js -> bump VERSION')
    print('  2. npx vercel deploy --prod --yes')
    print('  3. Vercel dashboard: Project > Domains > agregar', new, '(DNS segun Vercel)')
    print('  4. assetlinks.json ya no depende del dominio; el APK TWA apunta al')
    print('     dominio que tenga la app: si cambiaste domino, re-generar TWA.')
    print('  5. Google Search Console: verificar dominio + sitemap.xml')
