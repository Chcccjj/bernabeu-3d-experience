# Etihad companion integration / 伊蒂哈德项目整合

2026-11-03 · [English homepage](../README.md) · [中文首页](../README.zh-CN.md)

## Scope

PR #7 contributes Etihad Stadium as an independent companion to Bernabéu: source, vendored Three.js 0.180.0, exported HTML, reference material, existing screenshots and compressed editable models. This integration updates repository presentation and validation. It does not alter either stadium's runtime geometry or deploy either public Site.

The English and Chinese homepages now show both projects, their existing application screenshots, language choices, public experience links, source guides and offline HTML files. Bernabéu's detailed developer documentation and the earlier README archives remain available.

## Validation

- The failed `verify` job was caused by ESLint reading third-party Three.js files and their `compat/compat` directives. `**/vendor/**` is now excluded from project Lint; upstream files remain byte-for-byte unchanged.
- `npm run check` retains Bernabéu's 55 tests, Lint, scoped state typing, production build and artifact/HTTP checks. It also invokes `npm run check:companion`.
- The companion check verifies every authored JS/MJS file parses, checks recorded vendor hashes, rebuilds the Etihad export into a temporary location, and compares its complete module map with both committed HTML editions.
- Only model filenames declared by `MODEL-MANIFEST.json` are read from the ZIP. The GLB files are reimported and their recorded hashes/bounds are checked by the existing project tests.
- All 9 current-source check scripts run in a disposable project copy so report-writing scripts do not rewrite the original evidence. The new current-seat check verifies nonzero bucket-seat shells, paired underframes, selection positions and orientation; it does not use obsolete detail counters.
- `check-model.mjs` assumes an older mast topology, separate seat frames and an earlier triangle-count multiplier. It is kept with the old model evidence; current source checks and manifest-based GLB reimports are verified independently.
- The north-step audit now recognizes the numbered seat-sector suffixes emitted by the current renderer. Its row/triangle checks proceed, but the subsequent band raycast reports `Egress band crosses aisle 0`. This is a known model-level finding, not a passing integration check; the strict script is retained for future geometry work and excluded from the repository-packaging gate. No source geometry was changed to hide it.
- The old `check-aisles.mjs` only recognizes retired BoxGeometry seat bases; it now rejects empty coverage. Current seat coverage lives in `check-seats.mjs`. The separate north-step audit and its unresolved finding are described below.
- `check-v12-architecture.mjs` and `check-v13-architecture.mjs` compare against commits in the original Site repository. They are retained as historical evidence, not claimed as runnable history in this GitHub repository.
- The CI artifact includes Bernabéu's production directory, Etihad's production directory and its root standalone HTML.

Run from the repository root with Node 24+ and Python 3:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=moderate
```

No new browser/encoder or architectural visual-quality approval is implied. Homepage images and the existing browser records are explicitly attributed to the supplied project evidence.

## 中文说明

本轮将 PR #7 的伊蒂哈德独立项目整合进仓库，并更新中英文首页，让两座球场的在线体验、语言、离线文件、源码及模型入口并列可见。现有伯纳乌开发文档与 README 归档继续保留，不调整球场模型，也不发布线上网页。

原 CI 失败来自根目录 ESLint 误扫第三方 Three.js 代码。现在仅排除第三方 `vendor/`，并增加伊蒂哈德当前源码语法、模块内嵌一致性、第三方哈希、模型 ZIP/GLB 重新导入与 9 项现有检查。生成检查记录的脚本在临时副本运行；两项需要原 Site Git 历史的对比脚本、旧版本模型拓扑和旧方盒座椅检查保留作历史证据；新座椅检查直接核对真实座椅壳体、配套支架和选座记录，北看台独立检查在通道带探测时报出 `Egress band crosses aisle 0`，如实记录为待复核的模型问题；严格脚本保留，但不将其计入通过的仓库打包门槛。旧方盒检查不再允许零席位假通过。原有 55 项伯纳乌测试仍照常执行。

展示图沿用协作者已提供的应用截图；本轮没有把静态/源码检查写成新的 WebGL 视觉、实际编码或建筑质量验收。
