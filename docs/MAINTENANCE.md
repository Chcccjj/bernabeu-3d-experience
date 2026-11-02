[简体中文](MAINTENANCE.zh-CN.md) | **English**

# Maintenance

## Before merging

Run `npm ci --ignore-scripts`, `npm run check`, and `npm audit --audit-level=moderate`. The `verify` GitHub Actions job repeats these checks for PRs and publishes a short-lived production artifact. Runtime changes additionally require real-browser checks; renderer/DOM doubles cannot establish WebGL visuals or encoder output.

Keep `main` protected against deletion and force pushes. Once the `verify` check has run on GitHub, require it and require a PR before merging. A personal project does not require another person's approval unless the owner deliberately adds that rule. Avoid bypass actors for routine work.

## Dependencies

Dependabot proposes npm and GitHub Actions updates weekly. Compatible npm updates are grouped; major changes remain separate. Review the changelog, let checks run, and exercise real rendering after Three.js, GSAP, Vite, or media changes. Updates are never automatically merged. Third-party Actions are pinned to commit SHAs and updated by Dependabot.

## Release

1. Merge a validated version and confirm `package.json` has the intended version.
2. Create a GitHub release from `main` tagged `v<package version>`, with its changes and known limits.
3. The **Release downloads** workflow validates the tag, rebuilds, audits, and attaches a self-contained HTML, a static-site tar archive, and `SHA256SUMS`.
4. Wait for the workflow to succeed and verify the download list. A release page alone does not prove its assets are ready.

Locally, run `npm run check` then `npm run package:release`; packaging requires an empty `release-assets/` directory so files from different versions cannot mix. Verify downloads with `shasum -a 256 -c SHA256SUMS` (macOS) or `sha256sum -c SHA256SUMS` (Linux). Extract the static archive into a dedicated empty directory before serving it.

## Scope and recovery

The Bernabéu application is maintained independently from `anfield/`, `camp-nou/`, `old-trafford/`, `comparisons/`, and `plugin-upgrades/` local experiments. These directories and `.openai/hosting.json` are excluded from the public repository. Never stage the whole parent AI directory or commit account deployment bindings.

Keep code history and release downloads. Recover a bad update through a new revert PR; do not force-push `main`. Sites publication is a separate production step: preserve the existing site ID and audience and deploy the verified source/build pair. Keep the prior Sites version available for rollback.

Source licensing remains an owner decision. Existing third-party asset and software notices must be preserved; maintenance does not automatically grant a new license to original code.
