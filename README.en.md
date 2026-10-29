# Santiago Bernabéu 3D Experience

[中文说明](README.md) · [Live experience](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en)

An interactive, real-time Three.js / WebGL reconstruction inspired by the renovated Santiago Bernabéu. Explore the silver louvered façade, fly into the seating bowl, operate the retractable roof, and watch six turf trays move into underground storage.

![Live application screenshot](docs/images/exterior-en.png)

## What you can do

- Orbit outside, explore the interior, stand on the pitch, take a 36-second cinematic tour, or move freely.
- Switch between day, night and match-day lighting and crowds.
- Open and close the roof; store and restore six turf trays; inspect the underground cutaway.
- Choose a virtual seat, follow the player-tunnel route, and inspect six architectural hotspots.
- Export PNG/JPEG images with composition guides and adjustable exposure and field of view.
- Record actual camera motion to MP4 or WebM, depending on browser support, with optional synthesized ambience.
- Share camera and mechanism states through a link, or save viewpoints in your browser.
- Switch between **中文 / English / Español** without reloading the scene. Language preferences persist locally.

## Run locally

Requires Node.js 22.12 or newer.

```sh
git clone https://github.com/Chcccjj/bernabeu-3d-experience.git
cd bernabeu-3d-experience
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

```sh
npm test          # 20 engineering, state and localization tests
npm run build     # dist/ plus a self-contained offline HTML edition
npm run preview   # preview the production build
```

The included `伯纳乌球场.html` bundles JavaScript, CSS and the HDR environment. Download the raw file to use it; GitHub's file preview does not run the application. If your browser restricts local files, serve it over HTTP. No runtime CDN is required.

## Controls

| Action | Control |
| --- | --- |
| Orbit / look around | Left-drag |
| Zoom / pan | Wheel / right-drag; two-finger gestures on touch screens |
| Free movement | W A S D or arrows, Q / E for height, Shift for speed |
| Walking | W A S D, Shift; direction pad on touch screens |
| Hide UI / fullscreen / reset | H / F / Home |

## How it is built

The project uses Three.js 0.186.1, GSAP 3.15.0 and Vite 8.3.5. Geometry is generated locally: 48 louver courses, a three-tier seating bowl with 64 rows and 53,318 instanced seats, a structured roof and a 105 × 68 m six-tray pitch. Those are **model parameters**, not official capacity or construction specifications.

Instancing, LOD, adaptive pixel ratio, physically based materials, HDR reflections, shadow maps, tone mapping and restrained post-processing keep the scene practical for desktop browsing. Performance depends on the device and selected quality.

Detailed documentation is available in Chinese:

- [User guide](docs/USER_GUIDE.md)
- [Development process](docs/DEVELOPMENT.md)
- [Validation scope](docs/VALIDATION.md)
- [Asset acknowledgements](public/ASSET-LICENSES.txt)

This is an independent architectural interpretation, not an official survey, ticketing interface or construction digital twin. The urban context, walking tunnel and mechanical systems are simplified. The project is not affiliated with Real Madrid. Third-party notices are retained; no open-source license has yet been specified for the original project code.
