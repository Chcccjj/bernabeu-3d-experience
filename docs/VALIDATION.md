**English** | [简体中文](VALIDATION.zh-CN.md)

# Validation scope

[Project home](../README.md) · [User guide](USER_GUIDE.md) · [Development process](DEVELOPMENT.md)

These records cover project 2.2.0 and its pre-publication checks. Screenshots come from the running application. Automated checks, browser verification and compatibility targets are described separately.

## Automated checks

Run `npm test` for 20 checks:

| File | Count | Coverage |
| --- | --- | --- |
| `tests/engineering.test.js` | 9 | Complete six-tray coverage and continuous textures, single-corridor transfers, underground stacking, continuous/reversible paths, bowl normals, perimeter sampling, camera boundaries and the tunnel opening |
| `tests/experience.test.js` | 6 | Export dimensions and texture limits, shared-state validation, blocked/corrupt storage, walking regions, recording-container selection and adaptive-quality recovery |
| `tests/i18n.test.js` | 5 | Complete translations and matching placeholders, language precedence, dynamic text/number formats, state-preserving language links and UI key coverage |

`npm run build` generates `dist/` and the self-contained HTML through a pure Node.js build, without Python.

## Completed browser verification

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
