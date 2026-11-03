# 球场材质与渲染依据 · 2026-10-30

本轮使用 visual-polish，保持原有米制模型和三阶建筑着色。材质值为视觉拟合，不是实验室反射率。

| 来源 | 实际检查内容 | 本轮使用 |
|---|---|---|
| [Kalzip工程页](https://www.kalzip.com/en/references/etihad-stadium-manchester/) | 65/400、直形及锥形板、自然铝色、压纹表面；原球场航拍02图已下载并目视检查 | 哑光自然铝色屋面和折起咬合缝；缝数/分布为C级推导 |
| [Arup Journal 2003 pp33](https://www.arup.com/globalassets/downloads/arup-journal/the-arup-journal-2003-issue-1.pdf) | 铝立边咬合屋面、150mm衬托盘、内缘10m透明聚碳酸酯 | 金属板与透光采光带分别建材；未据此声称2026全部保留构件已核验 |
| [Arup工程实景](https://www.arup.com/projects/etihad-stadium/) | 本地arup-night.jpg：银灰水平板、深色下部、坡道塔与桅杆；arup-interior.jpg：蓝座椅、深色屋底、透光天窗 | 中性灰混凝土、灰色钢构、克制的蓝座椅和昼夜分区 |
| [Populous南看台](https://populous.com/showcases/etihad-stadium-expansion) | 本地populous-18.jpg：金属板分缝、灰钢构、幕墙、低部百叶 | 银灰外墙与反射玻璃区别处理 |

新参考照片：../research/images/kalzip-roof.jpg，原URL https://www.kalzip.com/wp-content/uploads/2019/12/Etihad-Stadium-Manchester02.jpg。年代早于北扩建，仅用于原系统材质，不混作2026竣工照。不将新增照片作为网站再分发资产。

咬合缝贴合当前屋面三角形，名义高度65mm、外缘约400mm的分布是简化表达；真实分板、2026北侧材质牌号及全部立面尺寸仍需图纸确认。细缝低于阴影贴图单元，不单独投射锯齿阴影；实体几何保留，主体阴影照常。

光影：局部天空反射探针只作用于金属与玻璃；看台/主体仍使用三阶着色。弱化暖色填光和夜间座席过曝，收紧阴影覆盖及偏移。没有外部HDR、逐帧反射或新增场外面积。

正投影为独立平行投射相机，锁定俯视旋转，可平移/缩放；返回主场恢复原透视两倍取景。纯净渲染页 ?render=plan&time=day 无网页覆盖，供保存平面图。它是母模型总平渲染，不是施工平面图。
# V11 experience evidence — 2026-11-01

- Manchester City confirms two existing screens plus a new south-east screen: https://www.mancity.com/news/club/north-stand-etihad-man-city-rood-update-gallery-63891448 . Three screen locations, dimensions and hangers remain photo-fitted (C).
- Arup documents the fixed mast/cable-supported roof: https://www.arup.com/projects/etihad-stadium/ . V11 roof separation is an explanatory exploded view, with illustrative offsets, not an operable-roof claim.
- The stadium hosts concerts: https://www.mancity.com/concerts . The optional 96-tile pitch cover, stage layout and installation animation are illustrative (C). Grass stays in place; no underground pitch storage is represented.
- Spectators, 0:0 scoreboard, elapsed demo clock and rotating advertisements are simulated, not live match data. Crowd count comes from model seat instances, not official attendance.
- Eye positions and exploration bounds are checked against current model geometry; they do not certify as-built coordinates.

The V10 input ZIP and editable source matched across all 42 normalized modules before this work. See validation/v11-input-baseline.json. V11 retains metre units, the existing 470 by 500 metre site bounds and 18 architecture systems. It corrects paving that covered the submerged bowl and adds the third screen, experience controls and materials.


## North aisle steps / 2026-11-01

Manchester City 2026/27 Access Statement p20 states two aisle steps per seat-row interval in the North Stand: https://www.mancity.com/meta/media/qjpefmyj/etihad-access-statement-2627.pdf . The north upper aisle solids and nosings now share half-row stations, retaining existing C fitted section/width/axis coordinates. The document does not certify these dimensions. Existing handrails remain on the shared aisle axes. The 11-step concourse connection is not reconstructed without portal positions.


## V11.3 annotated repairs / 2026-11-02

Reviewed local `assets/references/north-2026-open.jpg` (stadium photograph) for short grass, green values and mowing response, and `expanded-interior.jpg` (design visualisation, not as-built evidence) for the north/side bowl relationship. These references guide appearance, not exact grass species, mowing pitch or joint dimensions. User's annotated screenshots are the defect baseline (`previews/junction-before.png`, `turf-before.png`).

The 3 m disagreement between replacement masks (-75 / -78 m) was a procedural model defect. Both masks now use -75 m; crossing treads are clipped rather than dropped and structural returns close the fitted rakes. All new joint locations remain C. Existing stand profiles, field dimensions and site footprint are unchanged. Near grass blades are a camera-local rendering LOD; GLB exports exclude that transient patch and retain a static metre-scale pitch.

## V11.4 junction finish / 2026-11-02

The user-supplied screenshot `截屏2026-11-02 15.08.20.png` showed the old middle-tier dark/white band ending at the north replacement edge. The old ribbon and new north entrance band have different fitted offsets and elevations. The newly modeled inclined cheek fascia and continuous narrow coping close this visible seam, using the shared north cut at x=±74m. This is a model repair based on the screenshot and existing photograph-fitted profiles, not a surveyed 2026 construction dimension. Rendering-performance changes do not alter the pitch or stadium footprint.

The 2023 city planning committee record distinguishes a 9-storey hotel and an 8-storey mixed commercial/workspace building: https://democracy.manchester.gov.uk/mgAi.aspx?ID=12512 . Asymmetry is supported; the current 37m/25m model heights remain unverified C fits and were not equalized. Boundary seat footprints and concourse faces were re-clipped after the user identified penetration in an oblique view; this does not certify the whole bowl section.

V11.5: user screenshot 2026-11-02 20.42.53 identified a depth precision regression after removal of logarithmic depth. The under-field foundation is recessed and the surrounding apron has a regulation-field cutout; perspective near depth scales with orbit target distance. No stadium proportions or exterior site area were changed.
