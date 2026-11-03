# 新北看台头架构件 · 2026-10-30

对照两张曼城官方照片：

- [2025 北侧钢结构施工图集](https://www.mancity.com/news/club/north-stand-etihad-man-city-rood-update-gallery-63891448)，本地 `research/images/north-09.jpg`，SHA-256 fa593ced4f77b927ded46b378a18e9ded64522c21bece9b5fdb0b868da1bc790。
- [2026 新看台开放实景](https://www.mancity.com/news/mens/manchester-city-etihad-stand-renaming-63915045)，本地 `research/images/north-2026-open.jpg`，SHA-256 6eaafd1314422c9f8287b99f7b4a703c640a0585e952d8f68afdce978742c667。

两张照片都能看到双 A 形轮廓、腿间的圆环构件、顶部浅色板，以及从顶部向屋顶展开的拉索。开放照片还显示北侧屋顶前缘护栏。先前模型用直横杆代替腿间圆环，本轮改成独立圆环并让三个连接点落在腿部轴线上；每座总成独立命名，供后期修改。

圆环的结构作用、是否可供维护人员通行、精确截面及螺栓数量尚未从图纸确证，因此不添加虚构平台楼板、楼梯、承载说明或逐个紧固件数量。现有 X/Y/Z 尺寸、圆环高度、顶板与护栏间距仍是 C 类拟合。圆环半径由拟合的三根腿在同一高度的交点计算，保证模型连接一致，但这不是实测认证。

检查包括圆环与三根腿接点重合、全模型有限坐标、GLB 独立总成名称及重新导入。需继续寻找当前剖面和节点图来校准。
