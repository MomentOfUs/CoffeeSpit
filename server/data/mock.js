// 共享 mock 数据：咖啡库 / 广场 / 良心店 / 成就 / 健康选项 / 状态
// 后端种子数据与路由共用此文件

export const COFFEES = [
  { id:"C-001", originalName:"「北欧深海」海盐燕麦拿铁", alias:"NORDIC DEEP-SEA / OAT LATTE", brand:"LANTERN 灯塔咖啡", city:"上海 · 静安", reportedPrice:38, realCost:6.8, premiumRate:458, caffeineMg:142, sugarG:21, kcal:263, tags:["海盐糖浆","蓝色素","燕麦奶"], recipe:["意式浓缩 1 shot（约 18ml）","常温燕麦奶 220ml（OATLY 1L ≈ 38 元，本杯 ≈ 4.5 元）","海盐糖浆 1 泵（约 8ml / 0.3 元）","蓝色食用色素 1 滴（约 0.01 元）","奶油顶 30ml（约 0.5 元）+ 装饰可可粉","纸杯 + 杯套 + 吸管 ≈ 0.8 元"], costBreakdown:[["燕麦奶",4.5],["浓缩咖啡液",0.6],["海盐糖浆",0.3],["装饰 & 杯材",1.4]], verdict:"溢价警告", verdictLevel:"HIGH", roast:[{title:"命名解构",icon:"tag",text:"「北欧深海」四个字里三个骗人。北欧没有深海拿铁，深海也没有蓝色燕麦奶，唯一真实的是那滴 0.01 元食用色素把整杯染成滤镜蓝。你以为喝到斯堪的纳维亚的海风，其实是上海陆家嘴的空调风。"},{title:"配料真相",icon:"droplet",text:"总成本 6.8 元，燕麦奶 4.5 元撑起大半壁江山，浓缩只有 0.6 元，海盐糖浆 0.3 元，蓝色色素 0.01 元——「深海」的颜色只值一分钱。奶油顶 0.5 元负责拍照，杯材 0.8 元负责装样子，真正属于「咖啡」的开支不足一成。"},{title:"身体代价",icon:"alert",text:"咖啡因 142mg 属中偏高，下午三点后慎饮。糖 21g 已逼近 WHO 日限 25g 的 84%，263kcal 相当于一碗半米饭。蓝色素无营养无热量，纯属视觉欺诈。"},{title:"营销噱头",icon:"flame",text:"溢价 458% 的底气来自「北欧」「深海」「燕麦」三个词的排列组合。这套蓝色色素+海盐糖浆+燕麦奶的配方，自己在家复刻不到 5 元，差价全在杯套和那句文案上。"},{title:"店铺风格",icon:"pin",text:"LANTERN 灯塔咖啡，开在上海静安——选址逻辑很清楚：租金贵，所以得卖 38 元一杯的「深海」。灯塔本应指引方向，实际指引的是你钱包的去向。"},{title:"专家总评",icon:"stamp",text:"一杯合格的燕麦拿铁被包装成网红道具。咖啡因够提神，但糖和色素拖了后腿。若真想喝燕麦拿铁，去巷子口 16 元那杯，省 22 元和 21g 糖。"}] },
  { id:"C-002", originalName:"「东京雨夜」樱花苏打美式", alias:"TOKYO RAIN / CHERRY SODA", brand:"SHIBUYA 涩谷小馆", city:"杭州 · 西湖", reportedPrice:36, realCost:5.2, premiumRate:592, caffeineMg:96, sugarG:28, kcal:188, tags:["苏打水","草莓糖浆","樱花粉"], recipe:["意式浓缩 1 shot","苏打水 200ml（≈ 0.3 元）","草莓糖浆 2 泵（≈ 0.6 元）","樱花粉色素 1 撮（≈ 0.01 元）","樱花形盐渍花瓣 0.5g（≈ 0.4 元）","杯材 ≈ 0.9 元"], costBreakdown:[["苏打水",0.3],["浓缩",0.6],["草莓糖浆",0.6],["装饰 & 杯材",3.7]], verdict:"智商核弹", verdictLevel:"EXTREME", roast:[{title:"命名解构",icon:"tag",text:"「东京雨夜」浪漫得像王家卫电影，现实却是一罐苏打水兑浓缩再喷层粉色。雨夜在杭州西湖，不在东京涩谷；樱花是盐渍的，粉色是色素喷的。三个意象，没有一个是真的。"},{title:"配料真相",icon:"droplet",text:"成本 5.2 元里，苏打水 0.3 元、浓缩 0.6 元、草莓糖浆 0.6 元、樱花色素 0.01 元、盐渍花瓣 0.4 元。所谓「樱花风味」其实来自草莓糖浆——樱花本身几乎无味，只能靠色素和花瓣扮演。"},{title:"身体代价",icon:"alert",text:"咖啡因 96mg 适中，但糖 28g 已超 WHO 日限 25g，188kcal 看着不高却几乎全是液态糖。苏打+糖浆的组合对牙齿和胰岛素都不友好，空腹饮用约等于直接喝糖水。"},{title:"营销噱头",icon:"flame",text:"溢价 592%，全场最高。盐渍花瓣 0.4 元负责漂浮美感，樱花粉 0.01 元负责粉红滤镜，剩余 30.8 元买的是「我想被小红书骗一下」的情绪价值。配方表诚实得让人想哭。"},{title:"店铺风格",icon:"pin",text:"SHIBUYA 涩谷小馆开在杭州西湖——地名错位本身就是营销话术：用东京的符号卖杭州的糖水。店名带「小馆」二字，实际定价却是 36 元的大馆水准。"},{title:"专家总评",icon:"stamp",text:"这不是美式，是一杯加了浓缩的粉红汽水。糖严重超标，咖啡因却只有 96mg，提神效果存疑。建议改名「樱花草莓苏打」，至少名字诚实一点。"}] },
  { id:"C-003", originalName:"「京都禅意」抹茶燕麦拿铁", alias:"KYOTO ZEN / MATCHA OAT", brand:"无印山房", city:"成都 · 锦江", reportedPrice:32, realCost:7.1, premiumRate:350, caffeineMg:64, sugarG:19, kcal:246, tags:["速溶抹茶粉","燕麦奶","海盐"], recipe:["速溶抹茶粉 4g（批发 ≈ 0.8 元）","燕麦奶 200ml（≈ 4.0 元）","热水 60ml","糖浆 1 泵","奶油顶 30ml + 抹茶粉撒面","杯材 ≈ 0.8 元"], costBreakdown:[["燕麦奶",4.0],["抹茶粉",0.8],["奶油顶",0.5],["装饰 & 杯材",1.8]], verdict:"溢价严重", verdictLevel:"HIGH", roast:[{title:"命名解构",icon:"tag",text:"「京都禅意」——禅意二字值 25 块。它甚至不是宇治抹茶，是国产速溶绿茶粉兑的，京都和它最近的距离是那 4 克粉末的产地标签。冥想五分钟，金额-25。"},{title:"配料真相",icon:"droplet",text:"成本 7.1 元，抹茶粉仅 0.8 元，燕麦奶 4.0 元才是主角，奶油顶 0.5 元加杯材 1.8 元凑数。速溶抹茶粉意味着喷雾干燥工艺而非石磨现碾，颜色和香气都打了折扣。"},{title:"身体代价",icon:"alert",text:"咖啡因仅 64mg，是 8 杯里第二低的，提神约等于一杯淡茶。糖 19g 不算极端但仍占日限 76%，246kcal 主要来自燕麦奶和奶油顶。海盐在标签里却不在配方重量里，存在感可疑。"},{title:"营销噱头",icon:"flame",text:"溢价 350% 看似「良心」，实则因成本基数高（7.1 元）。禅意包装掩盖了速溶粉的本质——真正宇治抹茶拿铁成本至少翻倍。糖浆+奶油顶的组合也和「禅」字背道而驰。"},{title:"店铺风格",icon:"pin",text:"无印山房开在成都锦江，品牌名致敬日系无印良品，选址却在大西南。「山房」二字营造隐逸感，实际定价 32 元一点也不隐。"},{title:"专家总评",icon:"stamp",text:"一杯伪装成禅意的甜抹茶奶。咖啡因低、糖不低，适合想要仪式感而非提神的人。真要禅意，买包宇治抹茶自己点茶，省钱又保真。"}] },
  { id:"C-004", originalName:"「西西里狂徒」柠檬冰美式", alias:"SICILY MAFIA / LEMON AMERICANO", brand:"BLACK CUP 黑杯", city:"广州 · 天河", reportedPrice:28, realCost:4.2, premiumRate:566, caffeineMg:158, sugarG:14, kcal:92, tags:["柠檬糖浆","双份浓缩"], recipe:["双份意式浓缩 36ml（≈ 1.2 元）","冰块 250g（≈ 0.2 元）","柠檬糖浆 2 泵（≈ 0.6 元）","新鲜柠檬片 1 片（≈ 0.4 元）","杯材 ≈ 0.8 元"], costBreakdown:[["双份浓缩",1.2],["柠檬糖浆",0.6],["冰块",0.2],["装饰 & 杯材",2.2]], verdict:"智商核弹", verdictLevel:"EXTREME", roast:[{title:"命名解构",icon:"tag",text:"「西西里狂徒」名字像黑帮片，本质是冰美式兑柠檬糖浆。「狂徒」是糖浆给的，「西西里」是滤镜给的，柠檬却是广州本地的。一部黑帮史诗，成本 4.2 元。"},{title:"配料真相",icon:"droplet",text:"双份浓缩 1.2 元是全场最贵的咖啡部分，冰块 0.2 元占体积最大，柠檬糖浆 0.6 元提供风味，柠檬片 0.4 元负责出镜。4.2 元成本里，真正「咖啡」的占比不到三成。"},{title:"身体代价",icon:"alert",text:"咖啡因 158mg 全场最高，一杯顶两杯普通美式，敏感人群慎入。糖 14g 相对克制，92kcal 是 8 杯里最低的——讽刺的是最「健康」的数据却配着最离谱的溢价。"},{title:"营销噱头",icon:"flame",text:"溢价 566%，仅次于樱花苏打。28 元买双份浓缩+冰块+糖浆，拆开看等于 14 元一杯冰美式的两倍价。柠檬片 0.4 元扮演的「鲜果」戏份，撑起了整杯的意式滤镜。"},{title:"店铺风格",icon:"pin",text:"BLACK CUP 黑杯，开在广州天河——CBD 选址+黑系极简包装，精准收割上班族。「黑杯」二字暗示纯粹，实际杯里最不纯粹的就是那 0.6 元糖浆。"},{title:"专家总评",icon:"stamp",text:"提神效率最高的选择，咖啡因和热量数据都算能打。但 28 元买 4.2 元成本，溢价离谱。去窗口店点双份冰美式 15 元，自带柠檬，省 13 元还少糖。"}] },
  { id:"C-005", originalName:"「巴黎午后」焦糖玛奇朵", alias:"PARIS PM / CARAMEL MACCHIATO", brand:"MAISON 麦穗", city:"北京 · 朝阳", reportedPrice:35, realCost:6.5, premiumRate:438, caffeineMg:122, sugarG:32, kcal:290, tags:["焦糖糖浆","焦糖纹","鲜奶"], recipe:["鲜牛奶 220ml（≈ 2.4 元）","意式浓缩 1 shot","焦糖糖浆 3 泵（≈ 0.9 元）","焦糖纹 0.2 元材料","奶泡 + 装饰","杯材 ≈ 0.8 元"], costBreakdown:[["鲜牛奶",2.4],["焦糖糖浆",0.9],["浓缩",0.6],["装饰 & 杯材",2.6]], verdict:"溢价严重", verdictLevel:"HIGH", roast:[{title:"命名解构",icon:"tag",text:"「巴黎午后」35 元买一段塞纳河畔的想象，实际是鲜奶+浓缩+焦糖糖浆的经典星巴克配方。巴黎人下午喝 espresso 不加糖；午后在北京朝阳，你喝的是 32 克糖的糖浆奶。"},{title:"配料真相",icon:"droplet",text:"成本 6.5 元，鲜奶 2.4 元是基底，焦糖糖浆 0.9 元是灵魂，焦糖纹 0.2 元是门面，浓缩 0.6 元是配角。所谓「玛奇朵」在此被改造成糖浆拿铁，原意「印记」早已被糖淹没。"},{title:"身体代价",icon:"alert",text:"糖 32g 全场第二高，约等于 6 块方糖直接糊脸，超 WHO 日限 28%。290kcal 接近一顿轻食，咖啡因 122mg 中等。一杯下去血糖峰值堪比吃蛋糕。"},{title:"营销噱头",icon:"flame",text:"溢价 438%，焦糖纹 0.2 元的网格图案是拍照核心，撑起整杯的「精致感」。巴黎标签+焦糖纹+麦穗 logo 三件套，把一杯 6.5 元的糖浆拿铁卖到 35 元。"},{title:"店铺风格",icon:"pin",text:"MAISON 麦穗，开在北京朝阳——法语店名+朝阳商圈，标准中产三件套配置。「麦穗」暗示法式田园，实际坐落在国内最卷的写字楼区。"},{title:"专家总评",icon:"stamp",text:"糖严重超标，咖啡因适中，热量逼近正餐。若非要喝焦糖玛奇朵，把糖浆减到 1 泵，省 18g 糖也省 0.6 元成本。或者直接喝鲜奶拿铁，巴黎午后自然会来。"}] },
  { id:"C-006", originalName:"「撒哈拉落日」脏脏摩卡", alias:"SAHARA / MOCHA MESS", brand:"CAMEL 骆驼咖啡", city:"西安 · 雁塔", reportedPrice:39, realCost:8.0, premiumRate:387, caffeineMg:138, sugarG:36, kcal:348, tags:["巧克力酱","可可粉","奶油"], recipe:["意式浓缩 1 shot","巧克力糖浆 2 泵（≈ 0.7 元）","鲜牛奶 200ml","奶油顶 + 可可粉撒面","纸杯 + 木签 + 杯套","杯材 ≈ 1.0 元"], costBreakdown:[["鲜牛奶",2.4],["巧克力酱",0.7],["奶油顶",0.5],["装饰 & 杯材",4.4]], verdict:"溢价严重", verdictLevel:"HIGH", roast:[{title:"命名解构",icon:"tag",text:"「撒哈拉落日」落日没看到，沙尘暴也没看到，看到的是 36g 糖趴在你腰上。撒哈拉在非洲，骆驼在西安，落日只在奶油顶的可可粉里短暂出现。"},{title:"配料真相",icon:"droplet",text:"成本 8.0 元全场最高，但巧克力酱仅 0.7 元，鲜奶 2.4 元，奶油顶 0.5 元，浓缩 0.6 元，杯材却高达 1.0 元——成本大头是包装而非原料。所谓「脏脏」来自巧克力酱挂壁，工艺成本几乎为零。"},{title:"身体代价",icon:"alert",text:"糖 36g 全场最高，超 WHO 日限 44%；348kcal 相当于一个汉堡，咖啡因 138mg 偏高。这是 8 杯里对代谢系统最不友好的一杯，堪称液体甜点。"},{title:"营销噱头",icon:"flame",text:"溢价 387% 看似最低，但因成本基数 8.0 元最高，绝对利润 31 元仍居前列。「脏脏」二字借势网红脏脏包，落日+撒哈拉+骆驼三重异域符号叠加，掩盖了这就是一杯糖浆摩卡的事实。"},{title:"店铺风格",icon:"pin",text:"CAMEL 骆驼咖啡，开在西安雁塔——古都+骆驼+撒哈拉，异域叙事三连，实际是本土连锁调性。雁塔的游客流量，恰好匹配 39 元的定价勇气。"},{title:"专家总评",icon:"stamp",text:"一杯伪装成咖啡的甜点。糖和热量双双爆表，咖啡因虽够却救不了血糖。建议把巧克力酱减半、去奶油顶，或干脆改成无糖摩卡，至少让「咖啡」二字名副其实。"}] },
  { id:"C-007", originalName:"「极光森林」紫薯燕麦奶", alias:"AURORA / PURPLE OAT", brand:"北方森林", city:"哈尔滨 · 南岗", reportedPrice:34, realCost:6.2, premiumRate:448, caffeineMg:28, sugarG:22, kcal:232, tags:["紫薯粉","燕麦奶","蝶豆花"], recipe:["燕麦奶 220ml（≈ 4.4 元）","紫薯粉 5g（≈ 0.4 元）","蝶豆花茶 80ml（≈ 0.3 元）","糖浆 1 泵","杯材 ≈ 0.8 元"], costBreakdown:[["燕麦奶",4.4],["紫薯粉",0.4],["蝶豆花茶",0.3],["装饰 & 杯材",1.1]], verdict:"智商核弹", verdictLevel:"EXTREME", roast:[{title:"命名解构",icon:"tag",text:"「极光森林」极光在挪威，森林在北欧，你在大东北的商场 B1。紫薯+蝶豆花的紫色组合模仿极光的视觉，本质是一杯装作很酷的奶茶，咖啡因 28mg 说明它根本不配叫咖啡。"},{title:"配料真相",icon:"droplet",text:"成本 6.2 元，燕麦奶 4.4 元占七成，紫薯粉 0.4 元提供颜色和淀粉感，蝶豆花茶 0.3 元贡献蓝紫色变。整杯没有一滴浓缩——这是一杯燕麦奶饮品，却被放在咖啡菜单上卖 34 元。"},{title:"身体代价",icon:"alert",text:"咖啡因 28mg 全场最低，提神效果约等于半杯茶。糖 22g 不低，232kcal 主要来自燕麦奶和糖浆。紫薯粉的膳食纤维被糖浆抵消，蝶豆花则有孕妇慎用的争议。"},{title:"营销噱头",icon:"flame",text:"溢价 448%，全靠「极光」「森林」「蝶豆花」三个词的视觉联想。蝶豆花遇酸变紫的化学反应被包装成「极光渐变」，实际成本 0.3 元。一杯无咖啡的燕麦奶，卖出了精品咖啡的价。"},{title:"店铺风格",icon:"pin",text:"北方森林，开在哈尔滨南岗——最北的省会城市配最北欧的名字，地理梗玩得溜。但「森林」里卖的是商场 B1 的工业糖浆，不是松针气息。"},{title:"专家总评",icon:"stamp",text:"严格来说这不是咖啡，是一杯紫色燕麦奶茶。咖啡因低到可忽略，糖却不低，蝶豆花还有禁忌人群。想喝燕麦奶就去便利店买盒装，6 元搞定，省 28 元还少糖。"}] },
  { id:"C-008", originalName:"「长沙辣妹」辣椒巧克力拿铁", alias:"CHANGSHA / SPICY MOCHA", brand:"湘 COFFEE", city:"长沙 · 岳麓", reportedPrice:33, realCost:5.9, premiumRate:459, caffeineMg:118, sugarG:24, kcal:286, tags:["可可","辣椒粉","鲜奶"], recipe:["意式浓缩 1 shot","鲜牛奶 200ml","可可粉 5g","辣椒粉 0.3g（≈ 0.05 元）","糖浆 1 泵","杯材 ≈ 0.8 元"], costBreakdown:[["鲜牛奶",2.4],["可可粉",0.4],["辣椒粉",0.1],["装饰 & 杯材",3.0]], verdict:"溢价警告", verdictLevel:"HIGH", roast:[{title:"命名解构",icon:"tag",text:"「长沙辣妹」辣椒粉 0.3g 价值 25 块，这是「辣妹」两个字的定价。长沙的火辣人设被 0.05 元的辣椒粉承包，巧克力负责安抚，辣椒负责话题，营销负责收钱。"},{title:"配料真相",icon:"droplet",text:"成本 5.9 元，鲜奶 2.4 元是基底，可可粉 0.4 元装出摩卡感，辣椒粉 0.05 元全场最便宜却是最核心的卖点，浓缩 0.6 元常规配置。0.05 元的辣椒粉撑起整杯的差异化叙事，性价比堪称魔幻。"},{title:"身体代价",icon:"alert",text:"咖啡因 118mg 中等，糖 24g 接近日限 96%，286kcal 不低。辣椒粉 0.3g 对肠胃有刺激，空腹饮用风险加倍——可可+辣椒+糖浆的三重组合，是胃黏膜的连击。"},{title:"营销噱头",icon:"flame",text:"溢价 459%，靠的是「地域 IP+猎奇口味」双 buff。辣椒粉 0.05 元+可可粉 0.4 元合计不到 0.5 元，却创造了「长沙限定」「网红打卡」的话题溢价。辣妹不辣，辣的是价格。"},{title:"店铺风格",icon:"pin",text:"湘 COFFEE，开在长沙岳麓——岳麓山下的书卷气配上「辣妹」的市井感，矛盾得很有戏剧性。地域品牌+方言梗是长沙餐饮的标配打法，咖啡也学会了。"},{title:"专家总评",icon:"stamp",text:"创意有余，诚意不足。辣椒粉的刺激感掩盖不了糖浆的甜腻，肠胃敏感者慎入。若想体验辣巧风味，买纯可可粉+辣椒粉自调，5 元成本解决，顺便清醒一下。"}] }
];

export const PLAZA = [
  { id:"F-001", time:"今天 09:42", user:"@冷萃凶手", cat:"美式", original:"「东京雨夜」樱花苏打美式", truth:"苏打水 + 浓缩 + 草莓糖浆 + 樱花粉色素。", price:36, real:5.2, premium:592, likes:128, comments:23, verified:true },
  { id:"F-002", time:"今天 08:11", user:"@豆浆机本机", cat:"拿铁", original:"「京都禅意」抹茶燕麦拿铁", truth:"速溶抹茶粉 4g + 燕麦奶 + 糖浆 + 牛奶。", price:32, real:7.1, premium:350, likes:96, comments:18, verified:true },
  { id:"F-003", time:"昨天 21:55", user:"@续命中转站", cat:"美式", original:"「西西里狂徒」柠檬冰美式", truth:"冰美式 + 柠檬糖浆 2 泵 + 冰块。", price:28, real:4.2, premium:566, likes:211, comments:47, verified:true, spotlight:true },
  { id:"F-004", time:"昨天 15:20", user:"@戒糖失败者", cat:"拿铁", original:"「巴黎午后」焦糖玛奇朵", truth:"拿铁 + 焦糖糖浆 3 泵 + 焦糖纹。", price:35, real:6.5, premium:438, likes:67, comments:12, verified:true },
  { id:"F-005", time:"前天 12:08", user:"@咖啡因侦探", cat:"特调", original:"「撒哈拉落日」脏脏摩卡", truth:"巧克力糖浆 + 浓缩 + 牛奶 + 可可粉。", price:39, real:8.0, premium:387, likes:142, comments:31, verified:true },
  { id:"F-006", time:"3天前 19:33", user:"@极光打假办", cat:"特调", original:"「极光森林」紫薯燕麦奶", truth:"燕麦奶 + 紫薯粉 + 蝶豆花 + 糖浆。", price:34, real:6.2, premium:448, likes:88, comments:15, verified:false },
  { id:"F-007", time:"3天前 10:21", user:"@橘子洲头辣妹", cat:"特调", original:"「长沙辣妹」辣椒巧克力拿铁", truth:"浓缩 + 鲜奶 + 可可粉 + 辣椒粉 0.3g。", price:33, real:5.9, premium:459, likes:54, comments:9, verified:true },
  { id:"F-008", time:"4天前 16:08", user:"@拿铁鉴赏家", cat:"拿铁", original:"「上海滩」桂花乌龙拿铁", truth:"乌龙茶 + 燕麦奶 + 桂花糖浆 + 浓缩。", price:30, real:6.4, premium:368, likes:103, comments:21, verified:true },
  { id:"F-009", time:"5天前 11:45", user:"@冰美式原教旨主义者", cat:"美式", original:"「北欧森林」黑松露美式", truth:"双份浓缩 + 冰块 + 一片柠檬 + 黑松露盐 0.1g。", price:42, real:7.6, premium:452, likes:172, comments:36, verified:true },
  { id:"F-010", time:"6天前 14:30", user:"@抹茶政治警察", cat:"抹茶", original:"「岚山小径」五十铃抹茶拿铁", truth:"国产抹茶粉 + 牛奶 + 糖浆，宇治含量 0%。", price:38, real:7.8, premium:387, likes:79, comments:14, verified:false },
  { id:"F-011", time:"1周前 09:12", user:"@果咖试毒员", cat:"果咖", original:"「三亚盛夏」椰子芒果冰沙", truth:"椰浆 + 芒果酱 + 冰沙 + 香精 + 浓缩。", price:35, real:5.5, premium:536, likes:64, comments:11, verified:true },
  { id:"F-012", time:"1周前 18:50", user:"@戒糖第三天", cat:"拿铁", original:"「北海道初雪」白桃乌龙拿铁", truth:"乌龙茶 + 牛奶 + 白桃糖浆 + 椰果。", price:31, real:6.1, premium:408, likes:91, comments:17, verified:true }
];

export const SHOPS = [
  { id:"S-01", name:"巷子口咖啡", district:"静安 · 武定路", desc:"老板自烘豆，澳式拼配，美式 12 元起。", tags:["自烘","平价","无糖"], price:12, dist:"320m", pos:{x:30,y:35}, lng:121.4525, lat:31.2290, rating:4.8, signature:"SOE 埃塞 / 燕麦拿铁", why:"老板是个老派人，只卖咖啡不卖滤镜。奶只用鲜奶，糖浆全部自煮。", menu:[["澳式拼配 美式","¥12"],["燕麦拿铁","¥16"],["澳白","¥15"],["手冲 · 耶加雪菲","¥28"]] },
  { id:"S-02", name:"师大三号楼窗口", district:"静安 · 校区后门", desc:"社区窗口，只卖拿铁和美式，杯子丑但真材实料。", tags:["社区","真材实料","无装饰"], price:10, dist:"180m", pos:{x:65,y:60}, lng:121.4480, lat:31.2310, rating:4.6, signature:"鲜奶拿铁 / 冰美式", why:"一家只做基础款的窗口咖啡。十块钱的拿铁，用的是当天的鲜奶，老板娘记得每位常客的口味。", menu:[["美式","¥10"],["鲜奶拿铁","¥12"],["燕麦拿铁","¥13"]] },
  { id:"S-03", name:"老周咖啡铺", district:"徐汇 · 永康路", desc:"夫妻店，奶只用鲜奶，糖浆全部自制。", tags:["鲜奶","自制糖浆","安静"], price:14, dist:"450m", pos:{x:78,y:30}, lng:121.4620, lat:31.2070, rating:4.9, signature:"桂花糖浆拿铁 / 海盐澳白", why:"十年前在弄堂口摆摊的夫妻店。糖浆是老婆自己熬的，桂花是楼下阿婆送的。", menu:[["美式","¥12"],["鲜奶拿铁","¥14"],["桂花拿铁","¥16"],["海盐澳白","¥15"]] },
  { id:"S-04", name:"二手书+咖啡", district:"黄浦 · 思南路", desc:"咖啡只做基础款，环境安静，奶不加糖浆。", tags:["基础款","可自习","无糖"], price:13, dist:"260m", pos:{x:42,y:78}, lng:121.4680, lat:31.2180, rating:4.7, signature:"冰美式 / 拿铁", why:"不卷特调，不上糖浆，不加奶油顶。咖啡只做咖啡。旁边全是书架，待一下午不被打扰。", menu:[["美式","¥13"],["拿铁","¥16"],["澳白","¥15"]] },
  { id:"S-05", name:"无名窗口", district:"长宁 · 凯旋路", desc:"连招牌都没挂，熟客才知道。来晚了喝不到。", tags:["熟客店","限量","鲜奶"], price:11, dist:"210m", pos:{x:22,y:60}, lng:121.4200, lat:31.2200, rating:4.9, signature:"鲜奶燕麦拿铁 / 手冲", why:"没有大众点评，没有小红书推荐。老板说「我只卖给懂的人」。豆子每月更换，奶只用保质期三天内的。", menu:[["美式","¥11"],["鲜奶拿铁","¥13"],["燕麦拿铁","¥15"]] },
  { id:"S-06", name:"小卖部咖啡", district:"普陀 · 真如", desc:"上海爷叔开的，7-11 旁边。每天 5 种豆子。", tags:["爷叔","实在","明码"], price:11, dist:"490m", pos:{x:55,y:22}, lng:121.4020, lat:31.2510, rating:4.5, signature:"曼特宁 / 哥伦比亚", why:"开在老式小卖部旁边，豆子明码标价。爷叔话不多，做的咖啡不花哨。", menu:[["美式","¥11"],["拿铁","¥14"],["手冲 单品","¥25"]] },
  { id:"S-07", name:"白盒子咖啡", district:"静安 · 胶州路", desc:"建筑师开的店，5 平米的窗口，菜单只印 1 张。", tags:["建筑师","5平米","小而美"], price:13, dist:"380m", pos:{x:72,y:50}, lng:121.4480, lat:31.2380, rating:4.7, signature:"冰美式 / 燕麦拿铁", why:"老板是个建筑师，只做基础款。店里没 Wi-Fi，没座位，但有真正的咖啡。", menu:[["美式","¥13"],["燕麦拿铁","¥16"],["冰拿铁","¥15"]] },
  { id:"S-08", name:"栗子树下", district:"徐汇 · 武康路", desc:"弄堂尽头的小店，老板娘话少，奶香浓郁。", tags:["弄堂","鲜奶","安静"], price:12, dist:"430m", pos:{x:38,y:18}, lng:121.4350, lat:31.2150, rating:4.6, signature:"栗子拿铁 / 热美式", why:"一棵树龄 30 年的栗子树下。秋天会有自熬栗子酱，其它季节就老老实实做基础款。", menu:[["美式","¥12"],["鲜奶拿铁","¥14"],["季节限定 栗子拿铁","¥18"]] }
];

export const ACHIEVEMENTS = [
  { key:"first-scan",  ico:"sparkle", name:"初识破",     sub:"首次扫描",  desc:"完成第一次扫描" },
  { key:"streak-7",    ico:"fire",    name:"连续 7 日",  sub:"连续7天",   desc:"连续 7 天有识破" },
  { key:"save-100",    ico:"coins",   name:"省下百元",   sub:"省下百元",    desc:"累计省下 100 元" },
  { key:"savior-10",   ico:"star",    name:"救星 10",    sub:"推荐10次",    desc:"推荐 10 次平价店" },
  { key:"roast-5",     ico:"flame",   name:"深度解析 5",  sub:"解析5条",    desc:"阅读 5 条 AI 深度解析" },
  { key:"low-caff",    ico:"cup",     name:"清醒选择",  sub:"低因选择",desc:"扫描低因咖啡" },
  { key:"no-sugar",    ico:"diamond", name:"无糖先锋",  sub:"无糖先锋",    desc:"扫描无糖咖啡" },
  { key:"fav-3",       ico:"heart",   name:"收藏 3",     sub:"收藏3家",      desc:"收藏 3 家良心店" }
];

export const HEALTH_OPTS = [
  { key:"lactoseIntolerant", name:"乳糖不耐",   code:"乳糖不耐" },
  { key:"caffeineSensitive", name:"咖啡因敏感", code:"咖啡因敏感" },
  { key:"sugarFree",         name:"戒糖",       code:"控糖" },
  { key:"pregnant",          name:"孕期/备孕",   code:"孕期" },
  { key:"vegan",             name:"植物基",     code:"植物奶" },
  { key:"lowBudget",         name:"平价优先",   code:"低预算" },
  { key:"nightOwl",          name:"夜猫子",     code:"熬夜党" }
];

export const MOCK_STATES = [
  { key:"stomach",  name:"肠胃不适", code:"GI" },
  { key:"insomnia", name:"失眠",     code:"ZZZ" },
  { key:"anxiety",  name:"心悸焦虑", code:"HRT" },
  { key:"acne",     name:"爆痘",     code:"ACN" },
  { key:"pregnant", name:"孕期/备孕", code:"PNT" },
  { key:"fasting",  name:"空腹",     code:"FST" }
];

// 拍照/上传后 mock 识别：按图片"特征"命中，这里用随机+权重模拟
export function mockRecognize() {
  const idx = Math.floor(Math.random() * COFFEES.length);
  return COFFEES[idx];
}

// 内联推荐：按价格升序取 n 家最便宜良心店
export function recommendShops(coffee, n = 3) {
  return [...SHOPS]
    .sort((a, b) => a.price - b.price)
    .slice(0, n)
    .map(s => ({ ...s, saved: Math.max(0, coffee.reportedPrice - s.price) }));
}
