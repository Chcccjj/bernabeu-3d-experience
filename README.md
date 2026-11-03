**English** | [简体中文](README.zh-CN.md)

<div align="center">

![Santiago Bernabéu — A New Perspective](docs/showcase/bernabeu-header.svg)

**An architectural experience you can step inside.**  
Santiago Bernabéu · Real-time 3D · Architecture &amp; interaction

[![Open the experience](docs/showcase/open-experience.svg)](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en)

[English](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en) · [中文](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=zh) · [Español](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=es)

</div>

> **Public website:** [Santiago Bernabéu — A New Perspective](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en)  
> Open directly in your browser. No download or local server needed.

[![Actual application screenshot](docs/images/exterior-en.png)](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en)

| Explore | Transform | Create |
| :--- | :--- | :--- |
| Orbit the silver façade, enter the stands, walk the pitch or take a cinematic tour. | Operate the retractable roof and watch six turf trays travel into underground storage. | Switch day, night and match settings; choose virtual seats, export photos and video, and share viewpoints. |

Built with Three.js / WebGL. Architecture, seating, turf and mechanisms are generated in code. Available in English, Chinese and Spanish.

### Find your way

| Resource | What you will find |
| :--- | :--- |
| [Live experience](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en) | Launch the interactive stadium |
| [User guide](docs/USER_GUIDE.md) | Controls, photography, recording, seating and sharing |
| [Development process](docs/DEVELOPMENT.md) | Research, modeling, lighting and interaction |
| [Validation scope](docs/VALIDATION.md) | Verified behavior and remaining limits |
| [Downloads](https://github.com/Chcccjj/bernabeu-3d-experience/releases) | Releases and offline files |
| [Maintenance](docs/MAINTENANCE.md) | Ongoing development and releases |

An independent procedural architectural interpretation, not affiliated with Real Madrid. Mechanisms, virtual seats and the surrounding city are simplified.

<details>
<summary><strong>Developer notes: local setup, features, source and deployment</strong></summary>

## Quick start

Requires **Node.js 24+ (or 22.x starting at 22.13)**.

```sh
git clone https://github.com/Chcccjj/bernabeu-3d-experience.git
cd bernabeu-3d-experience
npm ci
npm run dev
```

Open the address printed by Vite, normally `http://127.0.0.1:5173/`. Installing dependencies initially requires a network connection; development and production previews can then run offline.

The included **[伯纳乌球场.html](伯纳乌球场.html)** is a self-contained offline edition containing JavaScript, CSS and the HDR environment. Download the raw file to use it. If your browser restricts local files, serve it over HTTP. The project's `index.html` needs a development or preview server; GitHub's file preview does not execute the application.

```sh
npm test          # 55 engineering, lifecycle, DOM and localization checks
npm run check     # lint, scoped types, tests, build and artifact/HTTP checks
npm run build     # dist/ plus the self-contained offline HTML edition
npm run preview   # production preview, normally on port 4173
```

## Explore and create

- **Camera views:** Exterior orbit, Interior, Pitch view, a continuous 36-second cinematic tour, and Free explore. View changes use smooth camera transitions.
- **Controls:** Left-drag to orbit or look, wheel to zoom, right-drag to pan. Touch screens support one-finger rotation and two-finger pan/zoom. Free explore uses W/A/S/D or arrows, Q/E for height and Shift for speed, with shell and fixed-roof boundaries.
- **Day / Night / Match day:** Change environmental light, façade lighting, floodlights, screen content and crowds. The displayed score is demonstration content.
- **Retractable roof:** Operate reversible membrane-roof movement along the tracks. Camera journeys into the stadium open the roof first.
- **Pitch transformation:** Six 105 m-long trays move one at a time into a side transfer corridor, then descend to different underground levels. Restoring the pitch follows the same path in reverse; movement can reverse partway through.
- **High-resolution photos:** Six 3D presets, 16:9 / 9:16 / 3:4 / 1:1 composition, field-of-view and exposure controls, PNG/JPEG export without the interface. Desktop long-edge size reaches 3840 px; narrow screens reach 2048 px, subject to GPU texture limits. Browsing resolution is restored after export.
- **Camera-motion recording:** A 15-second exterior orbit, a 36-second cinematic tour or a 15-second roof sequence. Actual canvas recording, preview, early stop and download are supported. Desktop video long edge is 1920 px; narrow screens use 1280 px. Target frame rate is 30 fps, with actual performance depending on the device. MP4 or WebM is selected from real browser support, and the extension matches the container. Moving the page into the background ends and preserves the current clip.
- **Virtual seats:** Choose among 64 rows, four directions and three seating tiers, then move to the eye position of a seat in the model. Click a 3D seat to change position. These virtual identifiers do not correspond to official ticketing.
- **Walking routes:** Follow the player tunnel or walk freely around the pitch using W/A/S/D, Shift or a touch direction pad. Walking boundaries avoid the stands and goals. Optional ambience and footsteps are synthesized without microphone access.
- **Architectural details and cutaway:** Inspect six hotspots with camera transitions and explanatory text. The underground cutaway shows the same six moving turf trays and their supporting racks.
- **Sharing and bookmarks:** Links encode the camera, field of view, lighting, roof, pitch and cutaway states. Recipients can restore viewpoints on the public site. Up to eight bookmarks are stored in the current browser and can be deleted individually.
- **Three-language interface:** Menus, descriptions, controls, progress, export results and accessibility labels update without reloading the scene. User-entered viewpoint names retain their original text. Language precedence is URL parameter, saved selection, a supported browser language, then Chinese fallback. Shared viewpoints include the selected language.
- **Display controls:** Quality selection, camera reset, fullscreen and interface hiding work directly. Use **H** to hide/show the UI, **F** for fullscreen and **Home** to reset. Recording requires `captureStream` and `MediaRecorder`; unsupported browsers receive a clear message.

## Model and rendering

- A perspective scene in meters, with a 105 × 68 m pitch and an approximately 240 × 220 m rounded-rectangle building envelope.
- 48 curved metal louver courses with closed cross-sections, varying contours, panel joints, ground-floor glazing and entrances.
- 64 rows and 53,318 instanced seats across three primary seating tiers, with two VIP glazing bands, stairs, railings and blue/white seat lettering. These are parameters of this model, not official capacity or construction figures.
- Radial roof trusses, an inner ring, suspension elements, tracks, folding membrane sections and a continuous video display.
- Goals, nets, corner flags, benches, pitch-side LEDs, turf trays and their supporting structures.
- Physically based metal, HDR reflections, sun shadows, ACES tone mapping, multisampling and restrained Bloom. High quality enables half-resolution SSAO.
- Curtain-wall mullions, door handles, entrance canopies, plaza seating and planters; the walking tunnel has a geometric opening, ramp, walls and ceiling.
- Instanced seats, crowds, steel members, vehicles, trees and city buildings. Louvers, seats, city geometry and crowd sections use LOD. Reduced-motion preferences disable crowd movement. Automatic quality adjusts pixel ratio based on sustained frame time and gradually recovers when performance improves; photo export uses its own resolution and detailed louver/seat geometry.
- Window resizing, background suspension, WebGL context interruption and GPU resource disposal are handled.

## Source structure

| Path | Responsibility |
| --- | --- |
| `src/scene.js` | Renderer, HDR, lighting, post-processing, assembly, quality and resource lifecycle |
| `src/camera.js` | OrbitControls, transitions, cinematic paths, free movement and boundaries |
| `src/model/` | Louver envelope, seating bowl, roof, six-tray pitch, city and shared geometry |
| `src/main.js`, `styles.css` | UI, accessible status updates, lighting and mechanism controls |
| `src/features/` | Photos, recording, seating, walking, sharing, cutaway and synthesized ambience |
| `src/i18n/` | Chinese, English and Spanish messages, preferences, text updates and language controls |
| `src/assets/` | Local HDR environment; attribution in `public/ASSET-LICENSES.txt` |
| `tests/` | Engineering, interaction-state and localization regression tests |
| `tools/build_standalone.mjs` | Pure Node.js offline HTML packager; the earlier Python version is retained |
| `docs/` | Paired English/Chinese guides, validation notes and actual screenshots |
| `dist/` | Prebuilt static site and offline HTML, reproducible with `npm run build` |
| `.openai/hosting.example.json` | Example static Sites configuration for your own deployment |

## Build and deploy

Run `npm run build`, then deploy the entire `dist/` directory to static hosting. Vite uses relative asset paths (`base: './'`) for subdirectory hosting. See the [deployment steps](docs/USER_GUIDE.md#build-and-deploy).

The repository includes the current source, dependency lockfile, required HDR, tests, build scripts, third-party notices, production output and offline HTML. Dependencies, local backups, temporary verification files and account-specific deployment bindings are excluded.

## References and accuracy

Reference index: [sbp structural information](https://www.sbp.de/en/project/santiago-bernabeu-stadium/), [L35 project description](https://www.l35.com/en/projects/santiago-bernabeu-stadium.html), [gmp project material](https://www.gmp.de/de/bernabeu), and the [official documentary introduction](https://bernabeu.realmadrid.com/en-US/news/bernabeu-documentary). Reference photos informed the reconstruction and are not used as stadium images or background textures.

The urban context is approximate, the tunnel is a visitor space designed for this experience, and the roof folding, storage chamber and transfer mechanism are simplified. Demonstration timings are compressed. The project has no affiliation with Real Madrid.

Third-party notices remain in `public/` and `dist/`. No open-source license has yet been specified for the original project code.


</details>

[Original README archive](docs/showcase/README-before-showcase-2026-11-02.md)

---

<div align="center">

[Step inside the Bernabéu →](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en)

</div>


## Companion scene: Etihad Stadium

The Manchester City companion experience is now included in this repository as **Etihad Stadium (V14)**.

- [Open Etihad Stadium](https://etihad-architecture-atlas.chenvance.chatgpt.site/?lang=en)
- [Etihad source, build and editable models](etihad-stadium/README.md)
- [Download/open the standalone HTML](Etihad%20Stadium.html)

The Santiago Bernabéu source and experience above remain independent.
