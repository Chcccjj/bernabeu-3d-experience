# Changelog

## 2.2.1 — 2026-11-02

- Recover cleanly from cancelled or failed recordings, delayed recorder callbacks, and audio resume failures.
- Keep photo export and video dimensions stable through window resizing and defer quality changes until export finishes.
- Prevent stale navigation, roof, pitch, and workbench actions from taking over a newer operation.
- Recover valid saved views when neighboring entries are corrupt; validate shared camera and display state.
- Improve keyboard routing, accessible exploration tabs, focus restoration, and GPU resource disposal.
- Add 55 automated checks, lint, scoped state type checking, production/offline artifact verification, and GitHub Actions.
- Add weekly npm/Actions dependency update PRs, bug and PR templates, security reporting guidance, and verified release downloads with SHA-256 checksums.

The approved building geometry and interface design are retained. Browser/device verification limits are documented in [validation](docs/VALIDATION.md).

## 2.2.0

- Introduced photo/video tools, virtual seat visits, walking routes, architecture cutaways, shared views, and Chinese/English/Spanish localization.
