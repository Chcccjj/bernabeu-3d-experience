"""Inline the verified Vite production bundle for a portable offline edition."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
html = (dist / 'index.html').read_text()

def inline_script(match):
    path = dist / match.group(1).removeprefix('./')
    source = path.read_text().replace('</script', r'<\/script')
    return '<script type="module">\n' + source + '\n</script>'

def inline_css(match):
    path = dist / match.group(1).removeprefix('./')
    return '<style>\n' + path.read_text() + '\n</style>'

html = re.sub(r'<script type="module" crossorigin src="([^"]+)"></script>', inline_script, html)
html = re.sub(r'<link rel="stylesheet" crossorigin href="([^"]+)">', inline_css, html)
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"', html)
assert 'data:application/octet-stream;base64,' in html or 'data:image/vnd.radiance;base64,' in html
notices = '\n'.join(p.read_text() for p in sorted((root / 'public/licenses').glob('*.txt')))
html = html.replace('</head>', '<!-- Third-party notices\n' + notices + '\n-->\n</head>')
for target in [root / '伯纳乌球场.html', dist / '伯纳乌球场.html']:
    target.write_text(html)
print(f'Portable offline edition: {len(html.encode()):,} bytes; no external runtime dependencies.')
