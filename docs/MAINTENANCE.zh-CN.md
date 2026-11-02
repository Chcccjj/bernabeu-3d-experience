**简体中文** | [English](MAINTENANCE.md)

# 项目维护

## 合并前

执行 `npm ci --ignore-scripts`、`npm run check` 和 `npm audit --audit-level=moderate`。GitHub Actions 的 `verify` 任务会为 PR 重复执行检查，并保留短期生产构建产物。运行行为有变化时，还须进行真实浏览器验证；DOM 和渲染器替身不能验证 WebGL 画面及媒体编码器。

主分支禁止删除和强制推送。`verify` 在 GitHub 实际运行成功后，再把它设为合并必过检查，并要求通过 PR 修改主分支。个人项目不强制他人批准，除非所有者明确设置此要求。日常维护不添加绕过保护的角色。

## 依赖

Dependabot 每周提出 npm 与 GitHub Actions 更新 PR；兼容的小版本更新分组合并为一个 PR，主版本更新单独检查。合并前查看变更说明、等待检查通过；Three.js、GSAP、Vite 或媒体相关更新还需补验真实渲染。没有配置自动合并。第三方 Actions 固定到提交 SHA，由 Dependabot 更新。

## 发布

1. 合并验证通过的版本，确认 `package.json` 版本号。
2. 从 `main` 创建 GitHub Release，标签为 `v<版本号>`，填写变化和已知限制。
3. **Release downloads** 工作流检查标签与版本一致，重新构建、审计，并附上完整离线 HTML、静态站点压缩包及 `SHA256SUMS`。
4. 等待工作流成功，确认下载列表；仅创建 Release 页面不代表附件已经就绪。

本地执行 `npm run check` 后运行 `npm run package:release`。输出目录 `release-assets/` 必须为空，以免混入其他版本。macOS 可用 `shasum -a 256 -c SHA256SUMS`，Linux 可用 `sha256sum -c SHA256SUMS` 校验下载。静态站点压缩包应解压到独立空目录后运行。

## 范围与恢复

伯纳乌应用与本地 `anfield/`、`camp-nou/`、`old-trafford/`、`comparisons/`、`plugin-upgrades/` 实验分开维护；上述目录及 `.openai/hosting.json` 已从公开仓库排除。不要整体提交父级 AI 文件夹，也不要公开账号部署绑定。

保留 Git 历史和发布下载。需要恢复时创建回退 PR，不强制覆盖主分支。Sites 生产发布为单独步骤：保留站点 ID 和访问范围，只部署已经验证且对应同一源码的构建，保留上一站点版本供回退。

原创源码采用何种许可证仍由所有者决定；维护不会自动添加新的授权。第三方软件和素材的现有声明必须保留。
