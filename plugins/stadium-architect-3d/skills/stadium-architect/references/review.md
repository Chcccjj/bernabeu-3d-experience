# V1 用户验收门槛

交付 V1 时，向用户报告：

1. 预览入口/运行命令与文件位置。
2. 已验证的功能、没有测试的功能。
3. 参考来源与模型简化限制。
4. 询问：**建筑外形是否像？画面灯光是否满意？操作视角是否顺手？最想改的 1–3 项是什么？**

记录：

```markdown
# REVIEW
Stage: V1
Approval to start V2: NO
Architecture: pending
Visuals: pending
Controls: pending
User feedback: pending
```

- 用户说“屋顶不对，改一下” => V1 修复，再次验收。
- 用户说“V1 OK，批准你做 V2” => 改 Approval 为 YES，开始 V2。
- 用户说“继续”“再优化”且授权不明确 => 优先维持 V1 修复，不跨阶段。
- 用户批准后，也要保留独立可回退的 V1。
