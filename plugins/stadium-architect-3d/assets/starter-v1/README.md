# StadiumArchitect V1 starter

这是**通用可运行基座**，不代表任何特定真实球场的精确还原。生成具体球场前，必须依据官方与建筑参考修改轮廓、立面、看台和屋顶。

```bash
npm ci --ignore-scripts
npm run dev
npm run build
```

浏览器打开终端输出的本地地址。可选测试：`npx playwright install chromium` 然后 `npm test`。启动需要 Node.js 和网络安装依赖。具体模型由插件技能根据用户选择生成；在完成 V1 用户验收前不能直接进入 V2。

## UI design default

The on-screen UI intentionally avoids developer-facing labels such as V1/V2, prototype badges, S/A branding, or oversized bottom toolbars. The compact floating dock follows the plugin's `references/ui-design.md` contract. Keep the stadium as the focal point. Version/stage labels belong in the delivery report, not the visitor's page.
