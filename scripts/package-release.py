"""Package local unsigned build outputs and a reproducible source handoff."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'artifacts'
version = json.loads((root / 'package.json').read_text())['version']
for platform in ('android', 'ios', 'web'):
    (out / platform).mkdir(parents=True, exist_ok=True)

outputs = {
    'android/app/build/outputs/apk/debug/app-debug.apk': f'android/PackLight-{version}-debug.apk',
    'android/app/build/outputs/apk/release/app-release-unsigned.apk': f'android/PackLight-{version}-release-unsigned.apk',
    'android/app/build/outputs/bundle/release/app-release.aab': f'android/PackLight-{version}-release-unsigned.aab',
    'android/app/build/reports/lint-results-debug.html': 'android/lint-results.html',
}
for source, destination in outputs.items():
    shutil.copyfile(root / source, out / destination)

# Include the actual working tree, including new native projects and docs, but
# respect gitignore so build caches, signing secrets, and personal files stay out.
files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode().split('\0')
source_archive = out / 'ios' / f'PackLight-{version}-ios-source.zip'
with zipfile.ZipFile(source_archive, 'w', zipfile.ZIP_DEFLATED) as archive:
    for filename in sorted(set(files)):
        path = root / filename
        if filename and path.is_file():
            archive.write(path, f'PackLight/{filename}')

web_archive = out / 'web' / f'PackLight-{version}-web.zip'
with zipfile.ZipFile(web_archive, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in (root / 'dist').rglob('*'):
        if path.is_file(): archive.write(path, path.relative_to(root / 'dist'))

shutil.copyfile(root / 'docs/RELEASE_REVIEW.md', out / 'RELEASE_REVIEW.md')
shutil.copyfile(root / 'docs/MOBILE_RELEASE.md', out / 'MOBILE_RELEASE.md')
artifacts = [out / destination for destination in outputs.values()] + [source_archive, web_archive]
lines = [f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.relative_to(out).as_posix()}' for path in artifacts]
(out / 'SHA256SUMS.txt').write_text('\n'.join(lines) + '\n')
for path in artifacts:
    print(f'{path.relative_to(root)} ({path.stat().st_size:,} bytes)')
