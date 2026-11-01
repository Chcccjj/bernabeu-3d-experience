# StadiumArchitect 3D · Plugin source

This directory contains the source of the **StadiumArchitect 3D v1.0.0** ChatGPT/Codex skills-based plugin.

It lives inside [bernabeu-3d-experience](https://github.com/Chcccjj/bernabeu-3d-experience) as a **separate plugin package** and does not replace the existing Bernabéu website or its root-level dependencies.

## What it does

User names a football club or stadium → research architecture → build a **runnable Three.js V1** → test and present it for **user review** → fix V1 based on feedback → start cinematic **V2 only after explicit approval**. Preserve a working V1 backup.

- Workflow rules: [skills/stadium-architect/SKILL.md](skills/stadium-architect/SKILL.md)
- Blueprint guidance: [references/blueprint.md](skills/stadium-architect/references/blueprint.md)
- QA checklist: [references/qa.md](skills/stadium-architect/references/qa.md)
- Review gate: [references/review.md](skills/stadium-architect/references/review.md)
- Generic V1 project starter: [assets/starter-v1](assets/starter-v1)

## Install as a private ChatGPT plugin

From the repository root, package **only this plugin directory**:

```bash
cd plugins
zip -r stadium-architect-3d.zip stadium-architect-3d -x '*/.DS_Store'
```

Upload the resulting ZIP in Plugin Creator, subject to account and workspace support. Installing from a GitHub source copy creates a separate plugin; GitHub updates do not automatically update an installed ChatGPT plugin.

## Try the generic V1 starter

```bash
cd plugins/stadium-architect-3d/assets/starter-v1
npm install
npm run dev
```

For a production build run `npm run build`. For optional browser checks install the Playwright Chromium runtime with `npx playwright install chromium` and run `npm test`.

**Important:** The starter is deliberately **generic**, not a validated reconstruction of the Bernabéu. A specific stadium requires researching its structure and adjusting the geometry and appearance before claiming V1 is ready. Browser tests were not confirmed at the time this plugin package was first created.

## Example

> Generate a recognizable, runnable V1 of the Santiago Bernabéu using StadiumArchitect 3D. Test and deliver it for my review. Do not start V2 until I explicitly approve.

## Distribution note

This repository is public, but a public source copy **does not** change the original installed plugin's private visibility or publish it in the ChatGPT plugin directory. Do not include API keys, credentials, or personal contact details in shared package files.
