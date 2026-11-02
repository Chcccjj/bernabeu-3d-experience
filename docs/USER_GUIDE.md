**English** | [简体中文](USER_GUIDE.zh-CN.md)

# User guide

[Project home](../README.md) · [Development process](DEVELOPMENT.md) · [Validation scope](VALIDATION.md)

## Three ways to open the experience

### Live site

Open the [Bernabéu 3D Experience](https://bernabeu-architecture-studio.justllama33.chatgpt.site/?lang=en) to browse, share viewpoints and export photos or videos.

### Development server

Install Node.js 24+ (or 22.x starting at 22.13), then run:

```sh
git clone https://github.com/Chcccjj/bernabeu-3d-experience.git
cd bernabeu-3d-experience
npm ci
npm run dev
```

Open the URL printed by the terminal, normally `http://127.0.0.1:5173/`. The initial dependency installation needs a network connection. The running application does not load code or scene assets from a CDN.

### Offline HTML

The `伯纳乌球场.html` files at the repository root and in `dist/` are identical self-contained editions. Download the raw HTML and open it locally. If your browser restricts local-file execution, use a static server or access the file through `npm run preview`.

The project entry point, `index.html`, contains module references and needs a development or preview server. GitHub's file preview displays source code.

## Camera views and controls

| View | Purpose | Controls |
| --- | --- | --- |
| Exterior | Building overview and silver louvers | Left-drag to orbit, wheel to zoom, right-drag to pan |
| Interior | Stands, pitch and wraparound screen | Drag and zoom to inspect the interior |
| Pitch view | Experience the scale of the stands from a low camera | Drag to look around |
| Cinematic | A continuous journey of about 36 seconds | Fly from the city to the roof and into the stadium; Esc stops the tour |
| Free explore | Control movement yourself | W/A/S/D or arrows, Q/E for height, Shift for speed, drag to look |

Touch screens support one-finger rotation and two-finger pan/zoom. Free movement and walking provide on-screen direction controls. Camera boundaries constrain movement around the shell and roof; city exploration uses a simplified movement system.

Shortcuts: **H** hides/shows the interface, **F** toggles fullscreen, and **Home** resets the camera. Stop the cinematic tour with **Esc** or its close button.

## Lighting, roof and pitch

Use the Scene settings panel on the right. Expand it first on narrow screens.

- **Day:** Natural light and an empty stadium.
- **Night:** Façade lighting, stadium floodlights and a night environment.
- **Match day:** Blue/white spectators, match ambience and animated displays. Scores are demonstration content.
- **Retractable roof:** Toggle the switch to move the membrane along its tracks. Operating it again can reverse the motion. Camera journeys into the stadium open the roof first.
- **Pitch transformation:** Six turf trays enter a side transfer corridor in sequence, then descend to different underground levels. Operate it again to restore the pitch along the same path. Goals and corner flags first move clear of the transfer area.

The roof and underground systems are simplified demonstrations with compressed timings.

## High-resolution photos

Open **Photo** in the tool strip:

1. Choose an exterior, metal-detail, roof, seating, pitch or night preset, or continue adjusting the camera yourself.
2. Select 16:9, 9:16, 3:4 or 1:1 framing.
3. Adjust the field of view, exposure and composition guides.
4. Choose the long-edge size and PNG/JPEG format, then export.

Desktop output reaches a 3840 px long edge; narrow screens reach 2048 px. Both are subject to the GPU's maximum texture size. The interface and guides are excluded from the image. Browsing resolution is restored after export, and the download link can save the latest result again.

## Camera-motion recording

Open **Video**, choose the exterior orbit, cinematic tour or roof sequence, select the frame shape and decide whether to include synthesized ambience.

- Exterior orbit and roof presets last about 15 seconds; the cinematic tour lasts about 36 seconds.
- The actual WebGL canvas is recorded, targeting 30 fps. Actual performance depends on the device.
- Desktop video long edge is 1920 px; narrow screens use 1280 px.
- The browser selects a supported MP4 or WebM format. The saved extension matches the real container.
- Stop early if needed, then preview and download. Keep the page in the foreground during recording; moving it into the background ends and preserves the current clip.
- Ambience is synthesized without microphone access. Missing capture or encoder support produces a clear message.

Changing the interface language does not reload the page or interrupt a recording.

## Seating, walking and architectural cutaway

Open **Explore**:

| Tab | What to do |
| --- | --- |
| Seats | Choose a direction, lower/middle/upper tier, row and seat, then visit it. Click a 3D seat to change position. |
| Routes | Choose the guided player tunnel or free pitch walking. Move with W/A/S/D, use Shift for speed, or use the touch direction pad. Optional ambience has a volume control. |
| Details | Select one of six hotspots for a camera transition and explanation. The numbered markers in the scene are also clickable. |
| Section | Hide the shell and ground to inspect the underground racks and the same six turf trays moving into storage or returning. |

The 64 rows and seat identifiers are virtual model data and do not correspond to official tickets. Walking stays within the tunnel and pitch area, avoiding stands and goals.

## Language, sharing and bookmarks

The page header and workbench both offer **English, 中文 and Español**. Application language precedence is the URL parameter (`?lang=zh|en|es`), the saved preference, a supported browser language, then Chinese fallback.

Language changes update the page title, menus, settings, descriptions, progress, accessible labels and export results while retaining the 3D scene. Spanish numbers use locale-specific formatting. User-entered viewpoint names keep their original text.

Open **Share** to copy a viewpoint link containing camera position, target, field of view, lighting, roof, pitch, cutaway and language. Recipients can restore the state on the public site. A `localhost` link from a development session only works on that computer; use the live site for external sharing.

Up to eight bookmarks are stored in the current browser. They do not sync between devices and may be lost when browser site data is cleared.

The repository documentation has its own **English | 简体中文** links. The repository opens in English; these documentation links are independent of the live application's three-language preference.

## Quality and troubleshooting

| Situation | Suggested action |
| --- | --- |
| Black screen or initialization error | Use a WebGL 2-capable browser with hardware acceleration, then retry through the error panel. |
| Slow match-day or high-resolution rendering | Choose Performance or Automatic quality and reduce other demanding browser workloads. |
| No 4K option | Narrow screens or GPU texture limits reduce the available export sizes. |
| Video downloads as WebM | This is the format supported by the current browser; the extension matches its container. |
| Recording is shorter than the preset | It may have been stopped manually or moved into the background. The result displays the reason. |
| No ambience | Enable it with a click and check the volume. Browser audio needs a user gesture to start. |
| Language does not appear remembered | A URL `lang` parameter takes precedence; privacy mode or storage restrictions can affect persistence. |

Automatic quality lowers the pixel ratio after sustained high frame times and gradually raises it when performance recovers. There is no fixed frame-rate guarantee across devices.

## Build and deploy

```sh
npm test
npm run build
npm run preview
```

The build first produces Vite's static output, then runs a pure Node.js packager to create the offline HTML at the root and in `dist/`. Python is not required.

For static hosting, upload the entire `dist/` directory, retaining `assets/`, license files and relative paths. No database, server-side keys or remote rendering service is needed.

For Sites, use the `static.directory` configuration in `.openai/hosting.example.json`, create your own site, and use the identity returned for that site. The public repository excludes the author's account-specific deployment binding.
