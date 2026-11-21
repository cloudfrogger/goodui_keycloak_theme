#!/usr/bin/env python3
"""Distribute canonical branding assets to all web theme types."""
from pathlib import Path
from shutil import copy2
root = Path(__file__).resolve().parents[1] / 'themes/goodui'
source = root / 'login/resources'
for kind in ['account', 'admin', 'welcome']:
    for folder in ['img', 'js', 'css']:
        for path in (source / folder).iterdir():
            if not path.is_file():
                continue
            target = root / kind / 'resources' / folder / path.name
            target.parent.mkdir(parents=True, exist_ok=True)
            copy2(path, target)
print('Branding resources synchronized to account, admin and welcome.')
