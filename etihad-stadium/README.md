# Etihad Stadium

Manchester City’s 2026 Etihad Stadium architectural experience — **V14**.

[Open the public experience](https://etihad-architecture-atlas.chenvance.chatgpt.site/?lang=en) · [中文说明](README.zh-CN.md) · [Single-file experience](../Etihad%20Stadium.html)

This companion project sits alongside Santiago Bernabéu in the same repository. The Bernabéu application remains independent.

## Included

- Procedural stadium architecture, seats, fixed roof, masts/cables, lighting and editable floor shells.
- Manchester city context, daily parking, vehicles/drivers and distributed nearby pedestrians.
- Matchday spectators, two football teams and a visitor-triggered City goal: the score begins at 0:0; after 15 unpaused seconds inside the stadium, City scores once and the score stays at 1:0.
- Chinese, English, Spanish, French and Japanese primary UI; photo/video export, virtual seats, saved viewpoints and sharing.
- Editable source, vendored Three.js, a self-contained web build, reference assets, validation records and the compressed editable GLB models.

## Open or develop

The root **Etihad Stadium.html** is the V14 single-file release. Download and open it in a modern WebGL browser. Research/model download links in that file use the public Site.

For the editable version, from this directory:

```sh
python3 scripts/serve.py --port 8774
```

Open `http://127.0.0.1:8774/` for source development, or `http://127.0.0.1:8774/dist/index.html` for the exported build. No package installation is required. Rebuild with:

```sh
python3 scripts/export-html.py --output dist/index.html
```

Node.js 22+ can run the source checks with the local loader, for example:

```sh
node --experimental-loader ./scripts/local-loader.mjs scripts/check-visit-i18n.mjs
node --experimental-loader ./scripts/local-loader.mjs scripts/check-matchday-life.mjs
```

The architectural models are in `models/Etihad-2026-editable-models.zip` (also available in `dist/models/`). Extract into `models/` before running checks that reopen the raw GLB files. Historical geometry-comparison checks refer to the original source history; their saved reports are provided for provenance.

## Scope and evidence

The pitch is 105 × 68 metres. The model uses metres, but fitted building/stand dimensions are **not a survey-certified full-stadium 1:1 reconstruction**. Distant city blocks, crowd routes, parking operations and football are illustrative. The research archive retains its original Chinese commentary. See [sources.md](sources.md), [model notes](models/README.md) and [validation](validation/).

Three.js licensing/provenance is retained under `vendor/three/`. Reference image rights remain with their photographers, Manchester City and the design organisations identified in the research archive. The Bernabéu functional reference and adapted components are credited in `sources.md` and source comments.

## Version provenance

- V14 source commit: `18714a6b9bc4a7a831b6895226ab6c57581543ba` (original Site source history).
- Public Site: https://etihad-architecture-atlas.chenvance.chatgpt.site/
- The existing Site identity and private local runtime files are deliberately excluded from this GitHub copy.
