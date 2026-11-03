export const LANGUAGES={zh:'中文',en:'English',es:'Español',fr:'Français',ja:'日本語'};
// Chinese source text stays canonical; user-authored bookmark names are excluded.
const rows=`
球场探索|Explore|Explorar|Explorer|スタジアム探索
结构拆解|Structure|Estructura|Structure|構造分解
参考档案|References|Referencias|Sources|参考資料
伊蒂哈德建筑档案首页|Etihad Atlas home|Inicio del Atlas Etihad|Accueil de l’Atlas Etihad|エティハド資料ホーム
伊蒂哈德 · 建筑档案|Etihad · Architectural Atlas|Etihad · Atlas arquitectónico|Etihad · Atlas architectural|エティハド・建築アトラス
主导航|Main navigation|Navegación principal|Navigation principale|メインナビ
伊蒂哈德|Etihad|Etihad|Etihad|エティハド
真实米制，逐层深化。|Metre-scale architecture, layer by layer.|Arquitectura en metros, capa a capa.|Architecture en mètres, couche par couche.|メートル単位で、各層を詳しく。
2026 扩建版 · 球场建筑母模型|2026 expansion · architectural master model|Ampliación 2026 · modelo arquitectónico|Extension 2026 · maquette architecturale|2026年拡張版・建築マスターモデル
主环廊|Main concourse|Vestíbulo principal|Coursive principale|メインコンコース
俱乐部层|Club level|Nivel club|Niveau club|クラブ階
上层环廊|Upper concourse|Vestíbulo superior|Coursive supérieure|上層コンコース
设备夹层|Plant mezzanine|Entreplanta técnica|Mezzanine technique|設備中間階
设备层|Plant level|Nivel técnico|Niveau technique|設備階
套房层|Suite level|Nivel de suites|Niveau des suites|スイート階
空中酒吧|Sky bar|Bar panorámico|Bar panoramique|スカイバー
屋面基准|Roof datum|Cota de cubierta|Repère de toiture|屋根基準面
场景控制|Scene controls|Controles de escena|Commandes de scène|シーン操作
观察建筑|Observe the architecture|Observar la arquitectura|Observer l’architecture|建築を見る
从整体，到每一层。|From the whole to every level.|Del conjunto a cada nivel.|De l’ensemble à chaque niveau.|全体から、一つひとつの階へ。
近看主场杆件、屋架与照明，独立查看各层楼板，继续深化室内。|Inspect masts, roof framing, lighting and individual floor shells.|Examina mástiles, cubierta, luces y forjados independientes.|Examinez les mâts, la charpente, l’éclairage et chaque plancher.|支柱・屋根架構・照明と各階の床を詳しく見られます。
观察视角|Viewpoint|Vista|Point de vue|視点
外观|Exterior|Exterior|Extérieur|外観
草坪|Pitch|Césped|Pelouse|ピッチ
自由探索|Free exploration|Exploración libre|Exploration libre|自由探索
球场比赛|Match view|Ver partido|Voir le match|試合を見る
入场人流|Arriving fans|Acceso de hinchas|Arrivée des supporters|入場する人々
停车场|Parking|Aparcamiento|Parking|駐車場
两倍近景|Close view ×2|Primer plano ×2|Vue rapprochée ×2|近景 ×2
总览|Overview|Vista general|Vue d’ensemble|全体図
正投影|Orthographic|Ortográfica|Orthographique|正投影
北立面|North elevation|Fachada norte|Façade nord|北側立面
看台观赛|Stand view|Desde la grada|Depuis les tribunes|観客席から見る
看台|Stands|Gradas|Tribunes|スタンド
座椅|Seats|Asientos|Sièges|座席
屋架|Roof frame|Estructura de cubierta|Charpente|屋根架構
楼层|Floors|Plantas|Étages|各階
打开纯净正投影渲染页|Open clean orthographic render|Abrir vista ortográfica limpia|Ouvrir le rendu orthographique|正投影レンダーを開く
楼层母模型|Floor shells|Forjados base|Planchers de base|各階の基本モデル
下层环廊|Lower concourse|Vestíbulo inferior|Coursive inférieure|下層コンコース
中层环廊|Middle concourse|Vestíbulo intermedio|Coursive intermédiaire|中層コンコース
原球场通用楼板与柱网：标高仍待全场剖面校准。|Floor shells and column grid: levels still require section calibration.|Forjados y pilares: las cotas aún requieren calibración.|Planchers et trame de poteaux : niveaux à étalonner.|床と柱割りの高さは断面図との照合が必要です。
北看台图纸标高|North stand drawing levels|Cotas del plano norte|Niveaux du plan nord|北スタンド図面の標高
查看施工图标高|View drawing levels|Ver cotas del plano|Voir les niveaux du plan|図面の標高を見る
北看台施工图标高|North stand drawing levels|Cotas del plano norte|Niveaux du plan nord|北スタンド図面の標高
全部标高|All levels|Todas las cotas|Tous les niveaux|すべての標高
8 个图纸标高；控制框不代表楼板轮廓。|8 drawing levels; frames are not floor boundaries.|8 cotas; los marcos no son límites del forjado.|8 niveaux ; les cadres ne délimitent pas les planchers.|8つの図面標高。枠は床の輪郭ではありません。
Y = FFL − 60.179 m，以图纸草坪标高对齐现有模型。主体轮廓与看台仍在校准。|Y = FFL − 60.179 m. The pitch datum aligns the model; bowl and envelope calibration continues.|Y = FFL − 60.179 m. El césped alinea el modelo; gradas y envolvente siguen en calibración.|Y = FFL − 60.179 m. Le terrain aligne la maquette ; l’enveloppe et les tribunes restent à étalonner.|Y = FFL − 60.179 m。ピッチを基準に配置し、建物とスタンドは照合中です。
窄屏可选择单层查看每个标高。|On small screens, select one level at a time.|En pantalla pequeña, selecciona una cota.|Sur petit écran, choisissez un niveau.|小さい画面では標高を一つずつ選べます。
下载建筑母模型|Download architectural model|Descargar modelo arquitectónico|Télécharger la maquette|建築モデルをダウンロード
光影时段|Lighting|Iluminación|Éclairage|照明
日间|Day|Día|Jour|昼
夜景|Night|Noche|Nuit|夜
比赛日|Matchday|Día de partido|Jour de match|試合日
空场|Empty stadium|Estadio vacío|Stade vide|無観客
屋顶结构|Roof structure|Estructura de cubierta|Structure de toiture|屋根構造
屋顶拆解|Explode roof|Desglosar cubierta|Décomposer le toit|屋根を分解
复原屋顶|Restore roof|Restaurar cubierta|Rétablir le toit|屋根を復元
固定屋盖的结构展示示意|Illustrative fixed-roof exploded view|Despiece ilustrativo de cubierta fija|Décomposition illustrative du toit fixe|固定屋根の構造展示です
活动场地|Event setup|Eventos|Événements|イベント設営
活动布置|Set up event|Preparar evento|Installer l’événement|イベントを設営
恢复足球场|Restore pitch|Restaurar campo|Rétablir le terrain|ピッチを復元
足球比赛场地|Football pitch|Campo de fútbol|Terrain de football|サッカーピッチ
临时保护层与舞台布置为示意|Temporary cover and stage are illustrative.|La cubierta temporal y el escenario son ilustrativos.|La protection temporaire et la scène sont illustratives.|仮設カバーとステージはイメージです。
自动环绕|Auto orbit|Órbita automática|Rotation automatique|自動周回
连续观察建筑轮廓|Orbit around the building|Rodear el edificio|Tourner autour du bâtiment|建物の周囲を連続して見る
场地活动|Campus activity|Actividad del recinto|Activité du site|場外の活動
行人与道路车辆|Pedestrians and vehicles|Peatones y vehículos|Piétons et véhicules|歩行者と車両
性能优先|Performance mode|Priorizar rendimiento|Mode performances|パフォーマンス優先
关闭阴影与泛光，旋转更顺|Disable shadows and bloom for smoother motion.|Desactiva sombras y brillo para más fluidez.|Désactive les ombres et le bloom pour plus de fluidité.|影とブルームを省いて動作を軽くします。
拖动旋转 · 滚轮平滑缩放 · 双击聚焦细部|Drag to orbit · scroll to zoom · double-click to focus|Arrastra para girar · rueda para zoom · doble clic para enfocar|Glisser pour tourner · molette pour zoomer · double-clic pour cibler|ドラッグで回転・スクロールで拡大・ダブルクリックで注目
右键平移 · 1 日间 / 2 夜景 / 3 比赛日 · H 隐藏界面|Right-drag to pan · 1 day / 2 night / 3 matchday · H hides UI|Botón derecho para desplazar · 1 día / 2 noche / 3 partido · H oculta interfaz|Clic droit pour déplacer · 1 jour / 2 nuit / 3 match · H masque l’interface|右ドラッグで移動・1 昼 / 2 夜 / 3 試合日・H でUI切替
打开建筑的层次。|Unpack the architecture.|Descubre las capas del edificio.|Décomposez l’architecture.|建築の各層を開く。
分离建筑层级，观察不同系统的空间关系。拆解运动为展示示意。|Separate layers to inspect their spatial relationships. Motion is illustrative.|Separa capas para ver su relación espacial. El movimiento es ilustrativo.|Séparez les couches pour voir leurs relations. Le mouvement est illustratif.|各システムの位置関係を見るための分解展示です。
分层展开|Explode layers|Separar capas|Séparer les couches|各層を展開
完整复原|Restore all|Restaurar todo|Tout rétablir|全体を復元
拆解进度|Explode amount|Nivel de despiece|Décomposition|分解の進行度
独立查看 18 个建筑系统|Inspect 18 building systems|Ver 18 sistemas del edificio|Examiner 18 systèmes|18の建築システムを見る
全部显示|Show all|Mostrar todo|Tout afficher|すべて表示
场地与道路|Site and roads|Recinto y vías|Site et voirie|敷地と道路
聚焦|Focus|Enfocar|Cibler|注目
草坪与比赛设施|Pitch and facilities|Campo e instalaciones|Terrain et équipements|ピッチと試合設備
看台混凝土结构|Concrete stands|Gradas de hormigón|Tribunes en béton|スタンドのコンクリート構造
座椅与支架|Seats and frames|Asientos y soportes|Sièges et supports|座席と支持材
幕墙与外立面|Curtain wall and façades|Muro cortina y fachadas|Mur-rideau et façades|カーテンウォールと外装
八座螺旋交通塔|Eight spiral towers|Ocho torres helicoidales|Huit tours hélicoïdales|8つの螺旋動線塔
桅杆与主屋架|Masts and main roof frame|Mástiles y estructura principal|Mâts et charpente principale|マストと主屋根架構
扇形拉索与锚固|Fan cables and anchors|Cables y anclajes|Câbles et ancrages|放射状ケーブルと定着部
屋面与采光带|Roof and skylights|Cubierta y lucernarios|Toiture et lanterneaux|屋根と採光帯
新北看台与连廊|North stand and links|Grada norte y pasarelas|Tribune nord et liaisons|新北スタンドと連絡通路
酒店与商业翼楼|Hotel and commercial wings|Hotel y alas comerciales|Hôtel et ailes commerciales|ホテルと商業棟
球迷广场玻璃雨棚|Fan plaza glass canopy|Marquesina de la plaza|Auvent vitré de la place|広場のガラス庇
环廊与次结构|Concourses and secondary frame|Vestíbulos y estructura secundaria|Coursives et structure secondaire|コンコースと二次構造
下层环廊楼板与柱网|Lower floor and columns|Forjado y pilares inferiores|Plancher et poteaux inférieurs|下層の床と柱割り
中层环廊楼板与柱网|Middle floor and columns|Forjado y pilares intermedios|Plancher et poteaux intermédiaires|中層の床と柱割り
上层环廊楼板与柱网|Upper floor and columns|Forjado y pilares superiores|Plancher et poteaux supérieurs|上層の床と柱割り
比赛照明与灯具支架|Match lighting and brackets|Iluminación y soportes|Éclairage du match et supports|試合照明と取付金具
屋顶排水与检修构件|Roof drainage and access|Desagüe y acceso a cubierta|Drainage et accès au toit|屋根排水と点検部材
纵向剖切|Longitudinal section|Sección longitudinal|Coupe longitudinale|縦断面
显示西侧剖面与看台内部|Reveal the west section and bowl interior|Mostrar el corte oeste y el interior|Montrer la coupe ouest et l’intérieur|西側断面とスタンド内部を表示
每个细节，都有出处。|Every detail has a source.|Cada detalle tiene una fuente.|Chaque détail a sa source.|細部にも根拠を。
来源、模型假设与当前完成范围。|Sources, assumptions and current scope.|Fuentes, supuestos y alcance actual.|Sources, hypothèses et périmètre actuel.|出典、モデルの仮定、現在の範囲。
尺寸确证|Verified dimensions|Dimensiones verificadas|Dimensions vérifiées|確認済み寸法
草坪 105 × 68 米；场地较原地面下挖约 6 米。|Pitch: 105 × 68 m; about 6 m below original ground.|Campo: 105 × 68 m; unos 6 m bajo el terreno original.|Terrain : 105 × 68 m ; environ 6 m sous le sol d’origine.|ピッチは105 × 68 m、元の地面より約6 m低い位置です。
结构与形态确证|Structure and form evidence|Evidencia de estructura y forma|Sources sur la structure et la forme|構造と形態の根拠
桅杆拉索屋顶、螺旋交通塔、分层看台与北侧新增建筑，依据工程资料及官方影像重建。|Mast-supported roof, spiral towers, stands and north buildings follow engineering and official imagery.|Cubierta, torres, gradas y ampliación norte se basan en documentación e imágenes oficiales.|Toiture, tours, tribunes et extension nord s’appuient sur des documents techniques et images officielles.|マスト支持屋根、螺旋塔、スタンド、北側新棟は技術資料と公式画像を参考にしています。
初步拟合 · 待图纸校准|Preliminary fit · calibration pending|Ajuste preliminar · pendiente de calibración|Ajustement provisoire · à étalonner|暫定形状・図面との照合待ち
外轮廓、层高、座席排布、酒店窗格及路网尺度。当前并非经测绘认证的全场 1∶1 模型。|Envelope, heights, seats, windows and roads remain fitted. This is not a survey-certified 1:1 stadium.|La envolvente, alturas, asientos, ventanas y vías son aproximados. No es un modelo 1:1 certificado.|Enveloppe, hauteurs, sièges, fenêtres et voirie restent approximatifs. Ce modèle 1:1 n’est pas certifié par relevé.|外形、階高、座席、窓、道路は暫定です。実測認証された全場1:1モデルではありません。
打开图像与来源档案|Open images and sources|Abrir imágenes y fuentes|Ouvrir images et sources|画像と出典を開く
模型单位|Model units|Unidades|Unités du modèle|モデル単位
建筑控制|Controls|Controles|Commandes|建築操作
建筑全景|Stadium overview|Vista del estadio|Vue du stade|スタジアム全景
建筑观察预设|Camera presets|Vistas predefinidas|Vues prédéfinies|視点プリセット
草坪视角|Pitch view|Vista del campo|Vue de la pelouse|ピッチ視点
电影巡游|Cinematic tour|Recorrido de cine|Visite cinéma|シネマツアー
停止巡游|Stop tour|Detener recorrido|Arrêter la visite|ツアーを停止
拖动环视 · Esc 返回建筑全景|Drag to look · Esc for overview|Arrastra para mirar · Esc para vista general|Glisser pour regarder · Échap pour la vue générale|ドラッグで見回す・Escで全景へ
漫游方向控制|Movement controls|Controles de movimiento|Commandes de déplacement|移動操作
前进|Forward|Avanzar|Avancer|前進
左移|Left|Izquierda|Gauche|左へ
后退|Back|Retroceder|Reculer|後退
右移|Right|Derecha|Droite|右へ
升高|Up|Subir|Monter|上昇
降低|Down|Bajar|Descendre|下降
资料驱动建筑模型|Source-based architectural model|Modelo basado en fuentes|Maquette fondée sur des sources|資料に基づく建築モデル
北方位|North|Norte|Nord|北
隐藏界面|Hide UI|Ocultar interfaz|Masquer l’interface|UIを隠す
显示界面|Show UI|Mostrar interfaz|Afficher l’interface|UIを表示
复位视角|Reset view|Restablecer vista|Réinitialiser la vue|視点をリセット
保存视图|Save view|Guardar vista|Enregistrer la vue|画像を保存
全屏查看|Fullscreen|Pantalla completa|Plein écran|全画面
标准画质|Standard quality|Calidad estándar|Qualité standard|標準画質
球场尺寸|Pitch size|Tamaño del campo|Dimensions du terrain|ピッチ寸法
扩建后容量|Expanded capacity|Aforo ampliado|Capacité après extension|拡張後の収容人数
建筑系统|Building systems|Sistemas del edificio|Systèmes du bâtiment|建築システム
组可独立探索|independent systems|sistemas independientes|systèmes indépendants|個の独立システム
钢结构|Steelwork|Estructura de acero|Structure métallique|鉄骨構造
分层楼板|Floor layers|Forjados|Planchers|各層の床
依据公开实景与设计资料的初步重建，持续校准中。|Preliminary reconstruction from public imagery and design documents; calibration continues.|Reconstrucción preliminar con imágenes y planos públicos; la calibración continúa.|Reconstruction provisoire à partir d’images et de plans publics ; étalonnage en cours.|公開写真と設計資料による初期モデルで、照合を継続しています。
查看研究档案|Open research archive|Ver archivo de investigación|Voir les sources|調査資料を見る
曼彻斯特德比演示|Manchester derby demo|Demo del derbi de Mánchester|Démo du derby de Manchester|マンチェスター・ダービーのデモ
中圈开球|Kick-off|Saque inicial|Coup d’envoi|キックオフ
球场创作工作台|Stadium studio|Estudio del estadio|Atelier du stade|スタジアム制作ツール
探索工具|Exploration tools|Herramientas|Outils d’exploration|探索ツール
拍照|Photo|Foto|Photo|写真
录像|Video|Vídeo|Vidéo|動画
探索|Explore|Explorar|Explorer|探索
分享|Share|Compartir|Partager|共有
创作工作台|Studio|Estudio|Atelier|制作ツール
捕捉建筑|Capture the stadium|Capturar el estadio|Capturer le stade|スタジアムを撮る
关闭工作台|Close studio|Cerrar estudio|Fermer l’atelier|ツールを閉じる
为主场留一张，属于你的画面。|Frame your own view of the home ground.|Crea tu propia imagen del estadio.|Cadrez votre propre vue du stade.|ホームスタジアムを自分だけの一枚に。
城市全景|City view|Vista urbana|Vue urbaine|街の全景
俯瞰|Aerial|Aérea|Vue aérienne|俯瞰
构图比例|Aspect ratio|Proporción|Format|縦横比
长边尺寸|Long edge|Lado largo|Grand côté|長辺サイズ
文件格式|File format|Formato|Format du fichier|ファイル形式
镜头视角|Field of view|Campo de visión|Champ de vision|画角
曝光|Exposure|Exposición|Exposition|露出
三分构图参考线|Rule-of-thirds grid|Cuadrícula de tercios|Grille des tiers|三分割ガイド
拍摄高清画面|Capture high-resolution image|Capturar imagen de alta resolución|Capturer en haute définition|高解像度で撮影
下载刚才的照片|Download photo|Descargar foto|Télécharger la photo|写真をダウンロード
用一段运镜，走近伊蒂哈德。|Bring Etihad to life with a camera journey.|Acércate al Etihad con un recorrido de cámara.|Approchez l’Etihad par un mouvement de caméra.|カメラの旅でエティハドへ。
镜头路线|Camera route|Ruta de cámara|Parcours caméra|カメラルート
城市与外立面 · 15 秒|City and exterior · 15 s|Ciudad y fachada · 15 s|Ville et façade · 15 s|街と外観・15秒
电影巡游 · 约 39 秒|Cinematic tour · about 39 s|Recorrido de cine · unos 39 s|Visite cinéma · environ 39 s|シネマツアー・約39秒
固定屋盖拆解 · 15 秒|Roof structure · 15 s|Despiece de cubierta · 15 s|Structure du toit · 15 s|固定屋根の分解・15秒
画面比例|Aspect ratio|Proporción|Format|縦横比
视频分辨率|Video resolution|Resolución de vídeo|Résolution vidéo|動画解像度
合成环境音|Synthetic ambience|Ambiente sintetizado|Ambiance synthétique|合成環境音
环境音量|Ambience volume|Volumen ambiental|Volume d’ambiance|環境音の音量
音效由本机合成，无需麦克风。视频格式取决于浏览器支持。|Audio is generated locally; no microphone. Video format depends on your browser.|Audio generado localmente, sin micrófono. El formato depende del navegador.|Audio produit localement, sans micro. Le format dépend du navigateur.|音は端末内で合成し、マイクは不要です。動画形式はブラウザにより異なります。
开始录制|Start recording|Grabar|Enregistrer|録画開始
停止并生成视频|Stop and create video|Detener y crear vídeo|Arrêter et créer la vidéo|停止して動画を作成
准备就绪 · 目标 30 FPS 录制|Ready · target 30 FPS recording|Listo · objetivo 30 FPS|Prêt · objectif 30 images/s|準備完了・目標30 FPS
下载视频|Download video|Descargar vídeo|Télécharger la vidéo|動画をダウンロード
探索方式|Explore mode|Modo de exploración|Mode d’exploration|探索方法
选座|Seats|Asientos|Places|座席選択
路线|Routes|Rutas|Parcours|ルート
建筑|Architecture|Arquitectura|Architecture|建築
剖面|Section|Sección|Coupe|断面
选择模型中的席位，体验它的观赛视野。|Choose a model seat to see its view.|Elige un asiento del modelo para ver su perspectiva.|Choisissez une place du modèle pour voir sa vue.|モデルの座席から見える景色を体験できます。
看台方向|Stand direction|Orientación de grada|Orientation de la tribune|スタンドの方角
东看台|East stand|Grada este|Tribune est|東スタンド
南看台|South stand|Grada sur|Tribune sud|南スタンド
西看台|West stand|Grada oeste|Tribune ouest|西スタンド
北看台|North stand|Grada norte|Tribune nord|北スタンド
看台层级|Tier|Nivel de grada|Niveau de tribune|スタンドの層
下层|Lower|Inferior|Inférieur|下層
中层|Middle|Intermedio|Intermédiaire|中層
上层|Upper|Superior|Supérieur|上層
北扩建上层|North expansion upper|Ampliación norte superior|Extension nord supérieure|北拡張上層
虚拟排号|Virtual row|Fila virtual|Rangée virtuelle|仮想列番号
本排虚拟席位|Virtual seat in row|Asiento virtual de la fila|Place virtuelle de la rangée|列内の仮想座席
虚拟席位|Virtual seat|Asiento virtual|Place virtuelle|仮想座席
查看这个席位|View this seat|Ver este asiento|Voir cette place|この座席を見る
直接点击座椅选位|Click a seat to select|Haz clic en un asiento|Cliquer pour choisir une place|座席を直接クリックして選ぶ
模型示意席位，不对应官方售票编号。|Illustrative seats, not official ticket numbers.|Asientos ilustrativos, sin numeración oficial de entradas.|Places illustratives, sans numéro officiel de billetterie.|モデル上の座席で、公式チケット番号ではありません。
从场地眼高到城市远景。|From pitch level to the city skyline.|Del campo al horizonte urbano.|Du terrain à l’horizon urbain.|ピッチの目線から街の遠景まで。
球员通道至草坪 · 路线示意|Tunnel to pitch · illustrative route|Túnel al campo · ruta ilustrativa|Tunnel au terrain · parcours illustratif|通路からピッチへ・ルートイメージ
自由探索 · WASD / Q E|Free exploration · WASD / Q E|Exploración libre · WASD / Q E|Exploration libre · WASD / Q E|自由探索・WASD / Q E
完整电影巡游|Full cinematic tour|Recorrido completo|Visite cinéma complète|全シネマツアー
停车场 · 日常进出|Parking · daily arrivals|Aparcamiento · acceso diario|Parking · accès quotidien|駐車場・日常の出入り
场馆入口 · 入场人流|Entrance · arriving fans|Entrada · acceso de hinchas|Entrée · arrivée des supporters|入口・入場する人々
城市环绕|City orbit|Órbita urbana|Tour de la ville|街を周回
停止运镜|Stop camera|Detener cámara|Arrêter la caméra|カメラを停止
点击画面中的编号，查看建筑构造。|Select a marker to inspect the structure.|Selecciona un número para ver la estructura.|Choisissez un repère pour examiner la structure.|番号を選んで建築構造を見る。
外立面与螺旋塔|Façade and spiral towers|Fachada y torres helicoidales|Façade et tours hélicoïdales|外装と螺旋塔
桅杆、拉索与屋架|Masts, cables and roof|Mástiles, cables y cubierta|Mâts, câbles et toiture|マスト・ケーブル・屋根架構
新北看台|New north stand|Nueva grada norte|Nouvelle tribune nord|新北スタンド
标准比赛场地|Regulation pitch|Campo reglamentario|Terrain réglementaire|規定寸法のピッチ
看台与座椅|Stands and seats|Gradas y asientos|Tribunes et sièges|スタンドと座席
楼板与标高|Floors and levels|Forjados y cotas|Planchers et niveaux|床と標高
主要形态依据工程资料；逐构件坐标仍含拟合值。|Form follows engineering sources; component coordinates still include estimates.|Forma basada en documentación técnica; las coordenadas incluyen estimaciones.|Forme fondée sur des sources techniques ; certaines coordonnées restent estimées.|形態は技術資料に基づきますが、部材座標には推定値を含みます。
拆解主场，独立观察楼板与结构。|Separate the stadium to inspect floors and structure.|Desglosa el estadio para ver forjados y estructura.|Décomposez le stade pour examiner planchers et structure.|スタジアムを分解し、床と構造を個別に見る。
纵向建筑剖切|Longitudinal building section|Corte longitudinal del edificio|Coupe longitudinale du bâtiment|建物の縦断面
环廊楼板母模型|Concourse floor shells|Forjados base de vestíbulos|Planchers des coursives|コンコース床モデル
批准图纸标高控制|Approved drawing levels|Cotas de planos aprobados|Niveaux des plans approuvés|承認図面の標高
屋盖结构拆解|Roof structure exploded view|Despiece de estructura de cubierta|Décomposition de la charpente|屋根構造を分解
恢复完整球场|Restore full stadium|Restaurar estadio completo|Rétablir le stade complet|スタジアム全体を復元
曼彻斯特城市背景|Manchester city context|Entorno de Mánchester|Environnement de Manchester|マンチェスターの街並み
路网方向依据校园地图；远处街区与天际线为氛围示意。|Road directions follow campus maps; distant blocks and skyline are illustrative.|Las vías siguen mapas del recinto; barrios y horizonte lejanos son ilustrativos.|Les axes suivent les plans du site ; quartiers et horizon lointains sont illustratifs.|道路方向は敷地図を参考にし、遠景の街区はイメージです。
让别人抵达你眼前的这一刻。|Share the moment in front of you.|Comparte el momento que tienes delante.|Partagez l’instant devant vous.|目の前の景色を共有しましょう。
复制当前机位链接|Copy view link|Copiar enlace de vista|Copier le lien de vue|現在の視点リンクをコピー
当前机位链接|Current view link|Enlace de vista actual|Lien de la vue actuelle|現在の視点リンク
收藏名称|Bookmark name|Nombre del favorito|Nom du favori|保存名
例如：北看台夜景|e.g. North stand at night|p. ej. Grada norte de noche|ex. Tribune nord de nuit|例：北スタンドの夜景
收藏当前机位|Save this view|Guardar esta vista|Enregistrer cette vue|この視点を保存
最多收藏 8 个机位，保存在当前浏览器。分享链接包含机位、时段、剖切和结构状态。|Save up to 8 views in this browser. Links include camera, lighting, section and structure states.|Guarda 8 vistas en este navegador. Los enlaces incluyen cámara, luz, corte y estructura.|Enregistrez 8 vues dans ce navigateur. Les liens incluent caméra, lumière, coupe et structure.|このブラウザに8視点まで保存できます。リンクにはカメラ・照明・断面・構造状態を含みます。
主场，连接城市。|A home ground, connected to its city.|Un estadio conectado con su ciudad.|Un stade relié à sa ville.|街とつながるホームスタジアム。
开启电影导览 · 36 秒旅程|Start cinematic tour · 36 s|Iniciar recorrido · 36 s|Lancer la visite cinéma · 36 s|シネマツアー開始・36秒
亲自探索|Explore in person|Explora por ti mismo|Explorez vous-même|自分で探索
电影工作室|Film studio|Estudio de vídeo|Atelier vidéo|動画スタジオ
分享这一刻|Share this moment|Comparte este momento|Partager cet instant|この瞬間を共有
模拟比赛|Demo match|Partido de demostración|Match de démonstration|デモ試合
曼城进球|City scores|Gol del City|But de City|マンCのゴール
进球庆祝|Goal celebration|Celebración del gol|Célébration du but|ゴールを祝う
射门|Shot|Disparo|Tir|シュート
传球|Pass|Pase|Passe|パス
推进|In play|En juego|En jeu|プレー中
准备巡游|Preparing tour|Preparando recorrido|Préparation de la visite|ツアー準備中
环绕外立面|Orbiting exterior|Rodeando la fachada|Tour de la façade|外観を周回
穿过屋顶开口|Through the roof opening|Por la abertura de cubierta|Par l’ouverture du toit|屋根の開口部を通過
进入草坪|Entering the pitch|Entrando al campo|Entrée sur le terrain|ピッチに入る
东看台观赛席|East stand view|Vista desde la grada este|Vue de la tribune est|東スタンドの観戦席
巡游完成 · 拖动环视|Tour complete · drag to look|Recorrido completo · arrastra para mirar|Visite terminée · glissez pour regarder|ツアー終了・ドラッグで見回す
场景已暂停|Scene paused|Escena pausada|Scène en pause|シーンを一時停止
场景已恢复|Scene resumed|Escena reanudada|Scène reprise|シーンを再開
场地活动已恢复|Activity resumed|Actividad reanudada|Activité reprise|場外の活動を再開
场地活动已暂停|Activity paused|Actividad pausada|Activité en pause|場外の活動を一時停止
纵向剖切已开启|Section enabled|Corte activado|Coupe activée|縦断面を表示
完整建筑已恢复|Full building restored|Edificio restaurado|Bâtiment rétabli|建物全体を復元
当前浏览器暂不支持全屏|Fullscreen is unavailable in this browser|Este navegador no permite pantalla completa|Plein écran indisponible dans ce navigateur|このブラウザでは全画面にできません
已保存当前建筑视图|View saved|Vista guardada|Vue enregistrée|現在の画像を保存しました
请先停止录像|Stop recording first|Detén la grabación primero|Arrêtez d’abord l’enregistrement|先に録画を停止してください
机位已收藏|View bookmarked|Vista guardada|Vue ajoutée aux favoris|視点を保存しました
当前机位链接已复制|View link copied|Enlace copiado|Lien copié|視点リンクをコピーしました
请复制已选中的机位链接|Copy the selected view link|Copia el enlace seleccionado|Copiez le lien sélectionné|選択された視点リンクをコピーしてください
机位链接无效，已保留默认视角|Invalid view link; default view retained|Enlace no válido; se mantiene la vista predeterminada|Lien invalide ; vue par défaut conservée|無効なリンクのため既定の視点を表示します
录制完成 · 可预览或下载|Recording complete · preview or download|Grabación completa · vista previa o descarga|Enregistrement terminé · aperçu ou téléchargement|録画完了・プレビューまたはダウンロード
录制失败，请重试|Recording failed; try again|Error al grabar; inténtalo de nuevo|Échec de l’enregistrement ; réessayez|録画に失敗しました。再試行してください
照片生成失败|Image export failed|Error al exportar la imagen|Échec de l’export de l’image|画像の出力に失敗しました
正在恢复足球场|Restoring pitch|Restaurando campo|Rétablissement du terrain|ピッチを復元中
临时保护层与舞台 · 布置示意|Temporary cover and stage · illustrative|Protección y escenario · ilustrativo|Protection et scène temporaires · illustration|仮設カバーとステージ・設営イメージ
删除机位|Delete view|Eliminar vista|Supprimer la vue|視点を削除
全部标高|All levels|Todas las cotas|Tous les niveaux|すべての標高
原球场工程资料|Original stadium engineering|Ingeniería del estadio original|Ingénierie du stade d’origine|旧スタジアムの技術資料
北看台扩建|North stand expansion|Ampliación de grada norte|Extension de la tribune nord|北スタンド拡張
比赛照明|Match lighting|Iluminación del partido|Éclairage du match|試合照明
曼城 vs 曼联|Man City vs Man United|Man. City vs Man. United|Man. City contre Man. United|マンC対マンU
玻璃幕墙、水平金属带与独立螺旋交通塔；轮廓仍含照片拟合。|Glass façade, horizontal metal bands and separate spiral towers; forms remain photo-fitted.|Fachada de vidrio, bandas metálicas y torres independientes; formas ajustadas a fotos.|Façade vitrée, bandes métalliques et tours indépendantes ; formes ajustées aux photos.|ガラス外装、水平金属帯、独立した螺旋塔。形状には写真からの推定を含みます。
固定屋盖由桅杆与拉索体系支承，可独立查看结构分组。|The fixed roof is supported by masts and cables; structural groups can be isolated.|Cubierta fija sostenida por mástiles y cables; los grupos se pueden aislar.|Le toit fixe est soutenu par mâts et câbles ; les groupes peuvent être isolés.|固定屋根はマストとケーブルで支持され、構造グループを個別に表示できます。
2026 北扩建与单一上层看台；当前接缝及逐排尺寸仍需图纸校准。|2026 north expansion with a continuous upper tier; joints and row dimensions remain provisional.|Ampliación norte 2026 con nivel superior continuo; juntas y filas aún son provisionales.|Extension nord 2026 à gradin supérieur continu ; joints et rangées restent provisoires.|2026年北拡張と連続上層。接合部と各列の寸法は図面照合が必要です。
比赛区为 105 × 68 米；草坪的方向性材质与近景草叶分级呈现。|The pitch is 105 × 68 m, with directional turf shading and near grass detail.|Campo de 105 × 68 m, con césped direccional y detalle cercano.|Terrain de 105 × 68 m, avec pelouse directionnelle et détail de proximité.|ピッチは105 × 68 m。芝目の表現と近景の草を段階的に表示します。
逐席实例几何，可进入虚拟席位；不对应官方售票座位编号。|Individual seat instances support virtual views; numbers are not official ticket IDs.|Asientos individuales con vistas virtuales; no son números oficiales de entradas.|Sièges instanciés pour les vues virtuelles ; numéros non officiels.|座席ごとの形状を使った仮想視点で、公式チケット番号とは異なります。
8 个批准图纸标高控制框；控制框不是已建楼板的边界。|Eight approved drawing-level frames; these are not as-built floor boundaries.|Ocho marcos de cotas aprobadas; no delimitan forjados construidos.|Huit repères de niveaux approuvés ; ils ne délimitent pas les planchers construits.|承認図面の8つの標高枠で、完成した床の境界ではありません。
W A S D 移动 · Q / E 升降 · Shift 加速 · 拖动环视 · Esc 返回|W A S D move · Q / E up/down · Shift faster · drag to look · Esc back|W A S D mover · Q / E altura · Shift rápido · arrastrar para mirar · Esc volver|W A S D déplacer · Q / E hauteur · Maj accélérer · glisser pour regarder · Échap retour|WASD 移動・Q/E 上下・Shift 加速・ドラッグで見回す・Esc 戻る
真实座席高度|Seat-level view|Vista a nivel del asiento|Vue à hauteur du siège|座席の高さから見る
图纸标高控制|Drawing-level controls|Control de cotas|Repères de niveaux|図面標高の確認
结构分层|Structural layers|Capas estructurales|Couches structurelles|構造の各層
展示示意|Illustration|Ilustración|Illustration|展示イメージ
主场巨幕|Stadium close-up|Primer plano del estadio|Gros plan du stade|スタジアム近景
单体总览|Building overview|Vista general del edificio|Vue d’ensemble du bâtiment|建物の全体図
正在独立显示|Showing only|Mostrando solo|Affichage isolé|個別に表示中
正在构建伊蒂哈德|Building Etihad|Construyendo Etihad|Construction de l’Etihad|エティハドを構築中
准备探索伊蒂哈德|Ready to explore Etihad|Listo para explorar Etihad|Prêt à explorer l’Etihad|エティハドの探索を準備

`;
const ids={zh:0,en:1,es:2,fr:3,ja:4};export const TRANSLATIONS=new Map(rows.trim().split('\n').map(row=>{const cells=row.split('|');if(cells.length!==5)throw Error('Invalid translation row: '+cells[0]);return[cells[0],cells];}));
const keys=[...TRANSLATIONS.keys()].sort((a,b)=>b.length-a.length);
export function translateText(text,language='zh'){
 const lang=ids[language]??0,source=String(text),trim=source.trim();const score=trim.match(/^曼城\s*(\d+)\s*:\s*(\d+)\s*曼联$/);if(score){const names=[['曼城','曼联'],['Man City','Man United'],['Man. City','Man. United'],['Man. City','Man. United'],['マンC','マンU']][lang];return names[0]+(lang?' ':'')+score[1]+':'+score[2]+(lang?' ':'')+names[1];}if(!lang)return source;
 const patterns=[[/^(\d[\d,]*) 位助威观众 · 曼城 vs 曼联$/,n=>[`${n} cheering fans · Man City vs Man United`,`${n} aficionados · City vs United`,`${n} supporters · City contre United`,`${n}人の観客・マンC対マンU`][lang-1]],[/^(\d[\d,]*) 个示意座席 · 18 个建筑系统$/,n=>[`${n} model seats · 18 building systems`,`${n} asientos del modelo · 18 sistemas`,`${n} sièges illustratifs · 18 systèmes`,`${n}のモデル座席・18の建築システム`][lang-1]],[/^此分区本排 (\d+) 个示意席位$/,n=>[`${n} model seats in this section and row`,`${n} asientos en esta fila y sección`,`${n} places dans cette rangée et ce secteur`,`${n}席のモデル座席があります`][lang-1]],[/^已选择虚拟第 (\d+) 排 · 模型席位 (\d+)$/,(a,b)=>[`Virtual row ${a} · model seat ${b}`,`Fila virtual ${a} · asiento ${b}`,`Rangée virtuelle ${a} · place ${b}`,`仮想${a}列・モデル座席${b}`][lang-1]],[/^已生成 (\d+) × (\d+) 画面$/,(a,b)=>[`Exported ${a} × ${b}`,`Exportado ${a} × ${b}`,`Exporté en ${a} × ${b}`,`${a} × ${b}で出力しました`][lang-1]],[/^正在录制 · (\d+) × (\d+)$/,(a,b)=>[`Recording · ${a} × ${b}`,`Grabando · ${a} × ${b}`,`Enregistrement · ${a} × ${b}`,`録画中・${a} × ${b}`][lang-1]]];
 for(const[re,fn]of patterns){const m=trim.match(re);if(m)return fn(...m.slice(1));}
 if(TRANSLATIONS.has(trim))return source.replace(trim,TRANSLATIONS.get(trim)[lang]);
 // Preserve prefixes (FFL, IDs, arrows) while translating known source phrases.
 let result=source;for(const key of keys)if(result.includes(key))result=result.split(key).join(TRANSLATIONS.get(key)[lang]);return result;
}
