# V1 蓝图数据规范（轻量）

创建 `stadium-blueprint.json`，使用真实来源优先；不确定的字段使用 `null` 或 `estimated`，不要编造官方数值。示例结构：

```json
{
  "stadium": "Santiago Bernabéu Stadium",
  "club": "Real Madrid",
  "targetVersion": "user-requested or current version",
  "referenceDate": "YYYY-MM-DD",
  "pitchMeters": {"length": 105, "width": 68, "status": "default_model_assumption"},
  "footprint": {"type": "rounded-rectangle", "status": "estimated"},
  "stands": {"tiers": null, "specialZones": [], "status": "unverified"},
  "facade": {"signature": [], "status": "estimated"},
  "roof": {"type": null, "specialFeatures": [], "status": "unverified"},
  "sourceNotes": ["Source URLs and what each source actually supports"],
  "modelLimitations": []
}
```

以上所有值仅是数据结构示例，不代表对该球场事实的断言。球场的确定信息应来自实际检索和用户材料。

建模坐标：X 为场地长边，Z 为短边，Y 为上方；单位米，原点位于球场中心。无需强制所有球场使用同一种超椭圆。对独特外立面使用专属生成函数。
