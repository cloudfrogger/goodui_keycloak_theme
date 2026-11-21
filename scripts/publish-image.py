#!/usr/bin/env python3
"""Push the already tested local image; registry login is handled by CI."""
import os
import re
import subprocess
from pathlib import Path

image = os.environ.get('DOCKERHUB_IMAGE', 'cloudfrogger/goodui-keycloak-theme')
source = os.environ.get('GOODUI_IMAGE', 'goodui-keycloak-theme:test')
commit = os.environ['GITHUB_SHA']
ref = os.environ['GITHUB_REF']
if not re.fullmatch(r'[a-z0-9][a-z0-9_./-]*', image):
    raise SystemExit('Invalid destination image')
if not re.fullmatch(r'[0-9a-f]{40}', commit):
    raise SystemExit('Expected full Git commit SHA')
# Derive the moving Keycloak tag from the actual Dockerfile base image.
dockerfile = (Path(__file__).resolve().parents[1] / 'Dockerfile').read_text()
version = re.search(r'^FROM quay.io/keycloak/keycloak:([0-9.]+)', dockerfile, re.M).group(1)
tags = ['sha-' + commit]
if ref == 'refs/heads/main':
    tags.extend([version, 'latest'])
elif re.fullmatch(r'refs/tags/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', ref):
    tags.append(ref.removeprefix('refs/tags/v'))
else:
    raise SystemExit('Publishing is only allowed from main or a version tag')
for tag in tags:
    destination = f'{image}:{tag}'
    subprocess.run(['docker', 'tag', source, destination], check=True)
    subprocess.run(['docker', 'push', destination], check=True)
summary = os.environ.get('GITHUB_STEP_SUMMARY')
if summary:
    with open(summary, 'a') as out:
        out.write('Published the tested image:\n\n' + '\n'.join(f'- `{image}:{tag}`' for tag in tags) + '\n')
print('Published tags: ' + ', '.join(tags))
