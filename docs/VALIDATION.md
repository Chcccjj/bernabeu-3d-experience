**English** | [简体中文](VALIDATION.zh-CN.md)

# Validation scope

[Project home](../README.md) · [User guide](USER_GUIDE.md) · [Development process](DEVELOPMENT.md)

Current automated checks cover patch 2.2.1. On 2026-11-02 the production build was revalidated in a real Chromium browser, including actual image/video export and narrow-screen layouts. The 2026-10-31 sprint lacked browser access; its previous limitation is superseded only for the checks listed below. DOM tests themselves do not render WebGL or test media encoders.

## Automated checks

Run `npm run check` for Lint, scoped strict type checking, 55 tests, production build and artifact/HTTP verification. Type checking covers the public state boundary in `src/features/state.js` using JSDoc and TypeScript; it does not cover the complete Three.js application. Run `npm audit --audit-level=moderate` separately for the complete dependency tree (0 known vulnerabilities at the end of this sprint).

`npm test` includes:

| File | Count | Coverage |
| --- | --- | --- |
| `tests/engineering.test.js` | 9 | Complete six-tray coverage and continuous textures, single-corridor transfers, underground stacking, continuous/reversible paths, bowl normals, perimeter sampling, camera boundaries and the tunnel opening |
| `tests/experience.test.js` | 9 | Export dimensions and texture limits, shared-state validation, blocked/corrupt storage, walking regions, recording-container selection and adaptive-quality recovery |
| `tests/i18n.test.js` | 5 | Complete translations and matching placeholders, language precedence, dynamic text/number formats, state-preserving language links and UI key coverage |
| `tests/recorder.test.js` | 11 | Cancellation, backgrounding, capture/encoder failure, stale events, empty clips, timeout and disposal using controlled media doubles |
| `tests/scene.test.js` | 8 | Export success/failure, resize isolation, fixed recording sizes, deferred quality, mechanism reversals and resource cleanup using real Three.js objects with a renderer double |
| `tests/tools.test.js` | 8 | Happy DOM workbench, ARIA keyboard tabs, focus, localization retention, navigation races and clipboard fallback |
| `tests/camera.test.js` | 2 | Real OrbitControls in Happy DOM: keyboard input routing, acceleration and lost-focus cleanup |
| `tests/ambience.test.js` | 3 | Audio resume cancellation, failure/retry and disposal using a controlled AudioContext double |

`npm run build` generates `dist/` and the self-contained HTML through a pure Node.js build, without Python.

The artifact verifier checks that both offline HTML files are byte-identical, resources and HDR are embedded, licenses are present, bundled JavaScript parses, documentation targets exist, and Vite preview returns HTML/JS/CSS/offline files with correct HTTP status and MIME types. The preview server closes afterward. `.github/workflows/check.yml` runs these checks on Node 24 for PRs and main-branch updates. The GitHub check result for the exact PR commit is the authority for remote validation.

## Browser verification — 2.2.1, 2026-11-02

Production preview in the built-in Chromium browser, 1280 × 720 desktop and 390 × 844 / 320 × 640 narrow-screen viewports:

- Actual WebGL scene loading; exterior/interior/virtual-seat views; day/night/match modes; roof opening/closing; six-tray pitch storage/restoration and the underground section.
- 3840 × 2160 PNG export and narrow-screen 1536 × 2048 JPEG export, with dimensions inspected from the downloaded files.
- All three real recording presets downloaded as H.264/AAC MP4: exterior 1920 × 1080 (14.999933 s), flight 1080 × 1920 (35.987500 s), roof 1920 × 1080 (14.996042 s). FFmpeg decoded the complete files without errors using the input time base; three sampled frames from each clip had distinct SHA-256 hashes. See [machine-readable media evidence](media-verification-2026-11-02.json).
- Keyboard exploration tabs, seat visits, walking entry, bookmark save/delete, and a shared walk/match camera restored after a full reload.
- Chinese, English, and Spanish switching; Spanish 320 px controls and photo panel remained reachable; document scroll width equaled viewport width at both narrow widths.
- The inspected browser error/warning log was empty. Screenshots are retained in [maintenance evidence](images/maintenance-2026-11-02/).

This verifies a Chromium desktop session and emulated narrow viewports. It does not establish Safari/Edge/mobile-device compatibility, sustained frame-rate guarantees, or all interrupted-encoder failure paths. Those failure paths are separately covered by controlled automated tests. The standalone HTML was also loaded via HTTP; no universal `file://` compatibility claim is made.

## Historical browser verification (2.2.0)

Chromium was used for desktop and 390 × 844 / 320 × 640 narrow-screen layouts:

- Scene loading, exterior/interior views, smooth transitions, roof movement and pitch storage/restoration.
- Actual 3840 × 2160 PNG, 3:4 JPEG and portrait narrow-screen PNG exports, with file dimensions inspected.
- All three camera-recording presets recorded, downloaded and decoded; time-separated frames changed as expected.
- A roughly 15-second 1080 × 1920 H.264 + AAC portrait sample, with a matching extension/container. The selected format depends on browser support.
- Virtual seating, 3D seat picking, guided tunnel and keyboard/touch walking, synthesized audio startup, and motion of the same turf trays in the cutaway.
- Shared links restored the camera and mechanism states after reload; bookmarks could be saved and individually removed.
- Chinese, English and Spanish switching, saved preference recovery, translated titles, tools, hotspots, progress and export results.
- Language changes during roof animation and an actual recording while both continued running.
- Spanish long text, narrow-screen headers, toolbars and photo controls without horizontal overflow.
- No console error/warn entries captured in the checked production build and live version.

## Documentation verification

The repository opens with an English README. Its language link opens the complete Chinese README, which links back to English. User, development and validation guides have matching language links and keep their cross-document navigation in the selected language. Documentation links and referenced files are checked when the repository documentation changes.

## Compatibility and performance limits

- Chrome, Safari and Edge are desktop targets. These records are primarily from Chromium and do not establish full Safari/Edge verification.
- Narrow viewport checks do not constitute tests on every physical mobile device.
- WebGL 2, hardware acceleration, `captureStream`, `MediaRecorder` and encoder support affect feature availability. Missing recording support receives a clear message.
- Frame rate depends on GPU, resolution, match-day spectators, export dimensions and other workloads; no fixed rate is guaranteed across devices.
- The standalone HTML was loaded over HTTP. Browser policies may restrict `file://`; use a local server when needed.
- Model seats, scores, city details and mechanisms have the accuracy limits described on the project home page and are not ticketing or engineering data.
