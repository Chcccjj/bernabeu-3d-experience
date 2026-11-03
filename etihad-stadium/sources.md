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


## V12 Manchester city and studio transfer · 2026-11-03

Functional reference: https://github.com/Chcccjj/bernabeu-3d-experience at commit `35086732e6aa8f4ed88cf2e926b4ddd737c07d66`, and its live page https://bernabeu-architecture-studio.justllama33.chatgpt.site/ . Inspected features/index.js, recorder.js, state.js, ambience.js, model/city.js and scene.js. Photo / video / exploration / saved-view behaviour is adapted to Etihad APIs. The ambience synthesizer is adapted with attribution. Stadium geometry remains Etihad; the reference's retractable roof and underground pitch storage do not describe this stadium.

Manchester context evidence:

- Manchester City 2021 illustrated campus map: https://www.mancity.com/meta/media/tndjo2f1/etihadcampussitemap_5_21_amend_v2.pdf . Local image `research/campus-v2/images/campus-map-2021.jpg` (research directory is above the Site checkout) was inspected: Ashton New Road south, Alan Turing Way east, Joe Mercer Way / tram north, CFA southeast. This is not a 2026 surveyed parcel map.
- Official campus aerial and 2023 north plan, already inspected in `../research/campus-v2/images/`: open apron, roads, parking and greenspace around the stadium; Philips Park toward northeast. Preserve this open transition instead of Madrid blocks against the stadium.
- Current visitor directions: https://www.mancity.com/club/travel-and-transport/travelling-to-the-etihad-stadium-202627-update . Supports road/tram context, not every procedural street or building footprint.
- City Council's Ancoats built character: https://www.manchester.gov.uk/parks-leisure-and-the-arts/parks-playgrounds-allotments-and-open-spaces/conservation-areas/introduction24/ancoats-and-its-building-today . Red brick industrial blocks, repeated vertical openings and dark roofs inform ordinary Manchester context.
- New Jackson regeneration context: https://www.manchester.gov.uk/planning-and-regeneration/regeneration/city-centre-growth-and-infrastructure/city-centre-regeneration-areas/new-jackson-street . Distant west/southwest tower rhythm is an inference; no generated tower is labeled as a surveyed named landmark.

Road directions are B; building dimensions, generic courtyard plots, tree placements, parked cars and distant silhouettes are C. The finite ~6 km city field fades into existing fog, producing a receding city view; it is not an infinite streamed map. Landscape has a hole matching the original 470×500m campus; new roads/pavements are split at the boundary to avoid duplicate ground surfaces. Buildings are excluded from road corridors, trees from building envelopes. New meshes use 19 instanced/static draw objects and add no per-building point lights.


## V13 · Matchday / daily parking simulation · 2026-11-03

This release implements the user's explicit animation brief, not new stadium survey claims. Nine arrival gates are selected from the current envelope's actual portal coordinates, avoiding the existing ramp towers. The positions still inherit the envelope's C fitted classification. Queue densities, entry rates, railings, parking signs/barriers, routes, driver dwell times and football tactics are authored demonstration data, not Etihad operations or a crowd-safety model.

Reuse: `src/actors/people-batch.js` bakes the existing Little Worlds character prototype and animates its arms/legs on the GPU. Athlete variants shorten the kit sleeves/trousers, add socks, and preserve blue City / red United shirts. `parked-cars.js` bakes the existing car factory so parked and moving cars share wheels, glass, lamps and body proportions. `stadium-activity.js` uses six reserved bays in the existing eastern parking court and preserves the ground/road footprint; it does not claim new parking capacity or surveyed gate/bay numbering.

Spectator bodies/heads share a time/phase vertex displacement, with independent spatial phases and a goal boost. The existing count (53,433) remains the model's illustrated population, not official attendance. Manchester derby play is deterministic: 11 players each, referee, ball passes/dribbles/shots, goal cycle and demonstration score. It is not live data, a full rules engine, official lineups or real player likenesses. Architectural GLBs omit the scene's site layer and all gameplay objects, and retain their previous file hashes.


## V14 · Visitor behavior and multilingual interface · 2026-11-03

The user's new instruction replaces V13's repeating derby score and short queue recycling. The visitor timer uses the current fitted facade/bowl/north-stand envelope as a camera-space test; it is an interaction convention, not measured access control. Only interior, unpaused matchday time advances the 15-second counter; the single City goal is illustrative. No live football result is shown.

Arrival routes are finite and monotonically approach a modeled portal from the south campus paths. Supporters are occluded by the entrance before their route ends, and are not recycled into an exposed nearby queue. Nearby walking loops and thirteen social clusters are illustrative public-space activity inside the original campus. Additional people use a coarse version of the existing character prototype, retaining the shared instancing and GPU limb animation.

Five-language UI strings are authored locally in `src/ui/translations.js`; no network translator or account is required. Source Chinese is retained for round-trip switching, user bookmark names are excluded, and numeric FFL/source identifiers are preserved. The primary 3D experience is localized; the separate historical research archive retains its original Chinese source commentary. Matchday-only light adjustments reuse existing lights and do not change model materials/units or introduce extra light fixtures.
