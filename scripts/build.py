#!/usr/bin/env python3
"""Build a reproducible Keycloak provider JAR and a directory-install ZIP."""
from pathlib import Path
import json
import runpy
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
runpy.run_path(str(root / 'scripts/sync-resources.py'), run_name='__main__')
files = sorted((root / 'themes/goodui').rglob('*'))
(root / 'dist').mkdir(exist_ok=True)
def add(archive, name, data):
    info = ZipInfo(name, (2026, 1, 1, 0, 0, 0))
    info.compress_type = ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)
for kind in ['jar', 'zip']:
    target = root / f'dist/goodui-keycloak-theme.{kind}'
    with ZipFile(target, 'w') as archive:
        for path in files:
            if path.is_file():
                name = path.relative_to(root / 'themes').as_posix()
                add(archive, ('theme/' if kind == 'jar' else '') + name, path.read_bytes())
        if kind == 'jar':
            types = sorted(p.name for p in (root / 'themes/goodui').iterdir() if p.is_dir())
            add(archive, 'META-INF/keycloak-themes.json', json.dumps({'themes': [{'name': 'goodui', 'types': types}]}).encode())
        add(archive, 'META-INF/LICENSE' if kind == 'jar' else 'LICENSE', (root / 'LICENSE').read_bytes())
        add(archive, 'META-INF/GoodUI-MIT.txt' if kind == 'jar' else 'GoodUI-MIT.txt', (root / 'licenses/GoodUI-MIT.txt').read_bytes())
        add(archive, 'META-INF/NOTICE' if kind == 'jar' else 'NOTICE', (root / 'NOTICE').read_bytes())
    print(target.relative_to(root))
