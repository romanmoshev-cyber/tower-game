"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const arenaWrap = document.querySelector(".arena-wrap");
const STORAGE_KEY = "coreSentinelSaveV1";
const TWO_PI = Math.PI * 2;
const ARENA_CAMERA_ZOOM_OUT = 2.5;

const balance = {
  waveEnemyBase: 3,
  waveEnemyGrowth: 1.05,
  waveHpGrowth: 1.068,
  waveDamageGrowth: 1.052,
  waveSpeedGrowth: 0.006,
  spawnBaseDelay: 0.95,
  spawnMinDelay: 0.42,
  spawnDelayWaveReduction: 0.006,
  coinCashRate: 0.016,
  coinWaveBonus: 0.9,
  coinKillRate: 0.03,
  coinBossBonus: 7,
  bossHpGrowth: 2.1,
  bossDamageGrowth: 1.28,
  bossRewardGrowth: 0.25,
  bossTierReward: 0.28,
  goldenCoreCashMult: 1.7,
  goldenCoreCashGrowth: 0.08,
  goldenCoreCashCap: 2.5,
  overclockedSpeed: 1.18,
  overclockedUpgradeDiscount: 0.9,
  glassCoreHp: 0.7,
  glassCoreCash: 1.25,
};

const screens = {
  menu: document.getElementById("menuScreen"),
  game: document.getElementById("gameScreen"),
  defeat: document.getElementById("defeatScreen"),
  permanent: document.getElementById("permanentScreen"),
  ultimate: document.getElementById("ultimateScreen"),
  labs: document.getElementById("labScreen"),
  cards: document.getElementById("cardsScreen"),
  custom: document.getElementById("customScreen"),
  modules: document.getElementById("modulesScreen"),
  events: document.getElementById("eventsScreen"),
  guide: document.getElementById("guideScreen"),
  settings: document.getElementById("settingsScreen"),
  profile: document.getElementById("profileScreen"),
};

const permanentDefs = [
  { id: "baseDamage", name: "Базовый урон", desc: "+1 урона за уровень", getEffect: (lvl) => `+${lvl}`, base: 45, scale: 1.36, max: 100 },
  { id: "baseAttackSpeed", name: "Базовая скорострельность", desc: "+1.5% скорости атаки за уровень", getEffect: (lvl) => `+${(lvl * 1.5).toFixed(1)}%`, base: 55, scale: 1.38, max: 80 },
  { id: "baseHealth", name: "Базовое здоровье", desc: "+8 максимальных ОЗ за уровень", getEffect: (lvl) => `+${lvl * 8}`, base: 40, scale: 1.34, max: 100 },
  { id: "coinBonus", name: "Бонус монет", desc: "+2% к выплате монет за уровень", getEffect: (lvl) => `+${lvl * 2}%`, base: 75, scale: 1.4, max: 80 },
  { id: "startingCash", name: "Стартовый кэш", desc: "+8 стартовых $ за уровень", getEffect: (lvl) => `+${lvl * 8}`, base: 60, scale: 1.38, max: 60 },
  { id: "criticalChance", name: "Шанс крита", desc: "+0.5% шанса крита за уровень", getEffect: (lvl) => `+${(lvl * 0.5).toFixed(1)}%`, base: 85, scale: 1.42, max: 40 },
  { id: "bossDamageBonus", name: "Урон по боссам", desc: "+3% урона по боссам за уровень", getEffect: (lvl) => `+${lvl * 3}%`, base: 95, scale: 1.42, max: 60 },
  { id: "lifesteal", name: "Вампиризм", desc: "+0.1% кражи здоровья за уровень", getEffect: (lvl) => `+${(lvl * 0.1).toFixed(1)}%`, base: 110, scale: 1.45, max: 40 },
  { id: "defensePercent", name: "Процент защиты", desc: "+0.7% снижения урона за уровень", getEffect: (lvl) => `+${(lvl * 0.7).toFixed(1)}%`, base: 100, scale: 1.38, max: 50 },
  { id: "thorns", name: "Шипы", desc: "Возвращает 2% урона башни атакующему", getEffect: (lvl) => `+${lvl * 2}%`, base: 90, scale: 1.4, max: 35 },
  { id: "freeUpgrade", name: "Бесплатные улучшения", desc: "+0.4% шанс бесплатного улучшения за волну", getEffect: (lvl) => `+${(lvl * 0.4).toFixed(1)}%`, base: 150, scale: 1.48, max: 40 },
  { id: "orbSpeed", name: "Скорость сфер", desc: "+0.08 к базовой скорости сфер", getEffect: (lvl) => `+${(lvl * 0.08).toFixed(2)}`, base: 140, scale: 1.38, max: 30 },
  { id: "packageChance", name: "Шанс пакета", desc: "+0.5% шанс посылки после волны", getEffect: (lvl) => `+${(lvl * 0.5).toFixed(1)}%`, base: 180, scale: 1.45, max: 30 },
];

const permanentIconMap = {
  baseDamage: "icon-damage",
  baseAttackSpeed: "icon-attack-speed",
  baseHealth: "icon-health",
  coinBonus: "icon-coin",
  startingCash: "icon-cash-bonus",
  criticalChance: "icon-crit-chance",
  bossDamageBonus: "icon-damage-meter",
  lifesteal: "icon-lifesteal",
  defensePercent: "icon-defense-percent",
  thorns: "icon-thorns",
  freeUpgrade: "icon-free-upgrade",
  orbSpeed: "icon-orb-speed",
  packageChance: "icon-loot-cube",
};

const permanentStarterRunUpgradeMap = {
  baseDamage: { runId: "damage", every: 5, cap: 18, label: "старт. ур. Урона" },
  baseAttackSpeed: { runId: "attackSpeed", every: 6, cap: 12, label: "старт. ур. Скорости атаки" },
  baseHealth: { runId: "maxHealth", every: 5, cap: 18, label: "старт. ур. Здоровья" },
  coinBonus: { runId: "runCoinBonus", every: 8, cap: 10, label: "старт. ур. Бонуса монет" },
  startingCash: { runId: "cashWave", every: 8, cap: 8, label: "старт. ур. $/Волна" },
  criticalChance: { runId: "critChance", every: 4, cap: 10, label: "старт. ур. Крита" },
  lifesteal: { runId: "lifesteal", every: 5, cap: 8, label: "старт. ур. Вампиризма" },
  defensePercent: { runId: "defensePercent", every: 5, cap: 10, label: "старт. ур. Брони" },
  thorns: { runId: "thorns", every: 5, cap: 8, label: "старт. ур. Шипов" },
  freeUpgrade: { runId: "freeUpgrade", every: 5, cap: 8, label: "старт. ур. Беспл. апгрейдов" },
  packageChance: { runId: "packageChance", every: 6, cap: 8, label: "старт. ур. Посылок" },
};

const labDefs = [
  { id: "labDamage", name: "Урон башни", desc: "Глобальный урон башни", getEffect: (lvl) => `+${lvl}%`, baseCost: 150, costGrowth: 1.32, baseTime: 300, timeGrowth: 1.24, max: 60 },
  { id: "labAttackSpeed", name: "Скорость атаки", desc: "Множитель скорости атаки", getEffect: (lvl) => `+${(lvl * 0.6).toFixed(1)}%`, baseCost: 200, costGrowth: 1.34, baseTime: 480, timeGrowth: 1.25, max: 50 },
  { id: "labCoins", name: "Множитель монет", desc: "Глобальный бонус всех монет", getEffect: (lvl) => `+${(lvl * 1.5).toFixed(1)}%`, baseCost: 250, costGrowth: 1.35, baseTime: 900, timeGrowth: 1.26, max: 60 },
  { id: "labStartingCash", name: "Стартовый кэш", desc: "Увеличивает $ на старте", getEffect: (lvl) => `+$${lvl * 15}`, baseCost: 500, costGrowth: 1.3, baseTime: 1200, timeGrowth: 1.22, max: 40 },
  { id: "labHealth", name: "Прочность ядра", desc: "Глобальное здоровье башни", getEffect: (lvl) => `+${(lvl * 1.2).toFixed(1)}%`, baseCost: 180, costGrowth: 1.32, baseTime: 420, timeGrowth: 1.24, max: 60 },
  { id: "labCritDamage", name: "Крит-калибровка", desc: "Усиление критического урона", getEffect: (lvl) => `+${lvl * 2}%`, baseCost: 320, costGrowth: 1.36, baseTime: 1800, timeGrowth: 1.26, max: 40 },
  { id: "labBossDamage", name: "Анти-босс протокол", desc: "Дополнительный урон по боссам", getEffect: (lvl) => `+${lvl * 2}%`, baseCost: 400, costGrowth: 1.38, baseTime: 2400, timeGrowth: 1.27, max: 50 },
  { id: "labUpgradeDiscount", name: "Оптимизация апгрейдов", desc: "Снижает стоимость улучшений в забеге", getEffect: (lvl) => `-${(Math.min(12, lvl * 0.4)).toFixed(1)}%`, baseCost: 450, costGrowth: 1.4, baseTime: 3600, timeGrowth: 1.28, max: 30 },
  { id: "labModuleParts", name: "Разбор модулей", desc: "Больше деталей модулей с боссов", getEffect: (lvl) => `+${lvl}%`, baseCost: 600, costGrowth: 1.38, baseTime: 5400, timeGrowth: 1.27, max: 30 },
  { id: "labGameSpeed", name: "Скорость игры", desc: "Ускоряет обработку забега", getEffect: (lvl) => `+${lvl}%`, baseCost: 350, costGrowth: 1.34, baseTime: 1500, timeGrowth: 1.24, max: 50 },
  { id: "labLabSpeed", name: "Скорость лаборатории", desc: "Сокращает время исследований", getEffect: (lvl) => `-${Math.min(40, lvl)}% времени`, baseCost: 500, costGrowth: 1.36, baseTime: 2400, timeGrowth: 1.25, max: 40 },
  { id: "labLightSpeed", name: "Световые выстрелы", desc: "Снаряды почти мгновенно долетают до цели", getEffect: (lvl) => `+${lvl * 12}% скорости`, baseCost: 700, costGrowth: 1.38, baseTime: 3600, timeGrowth: 1.26, max: 25 },
  { id: "labGarlicThorns", name: "Чесночные шипы", desc: "Шипы дополнительно прожигают вампиров рядом с ядром", getEffect: (lvl) => `${lvl * 5}% силы шипов`, baseCost: 850, costGrowth: 1.4, baseTime: 5400, timeGrowth: 1.27, max: 20 },
  { id: "labPerkWaves", name: "Чаще перки", desc: "Снижает требование волн между перками", getEffect: (lvl) => `-${Math.min(10, lvl)} волн`, baseCost: 900, costGrowth: 1.42, baseTime: 7200, timeGrowth: 1.28, max: 10 },
  { id: "labGoldenBonus", name: "Бонус Golden Tower", desc: "Усиливает доход во время Золотой Башни", getEffect: (lvl) => `+${lvl * 4}% дохода`, baseCost: 1100, costGrowth: 1.42, baseTime: 7200, timeGrowth: 1.28, max: 30 },
  { id: "labGoldenDuration", name: "Длительность Golden Tower", desc: "Продлевает активность Золотой Башни", getEffect: (lvl) => `+${(lvl * 0.4).toFixed(1)}с`, baseCost: 1250, costGrowth: 1.43, baseTime: 9000, timeGrowth: 1.28, max: 25 },
  { id: "labBlackHoleCoins", name: "Монеты Black Hole", desc: "Усиливает награды за убийства внутри Черной Дыры", getEffect: (lvl) => `+${lvl * 5}%`, baseCost: 1350, costGrowth: 1.44, baseTime: 9600, timeGrowth: 1.29, max: 30 },
  { id: "labBlackHoleDamage", name: "Урон Black Hole", desc: "Враги внутри Черной Дыры теряют долю максимального здоровья", getEffect: (lvl) => `${(lvl * 0.12).toFixed(2)}% ОЗ/с`, baseCost: 1500, costGrowth: 1.45, baseTime: 10800, timeGrowth: 1.29, max: 25 },
  { id: "labBlackHoleDuration", name: "Длительность Black Hole", desc: "Продлевает Черную Дыру", getEffect: (lvl) => `+${(lvl * 0.35).toFixed(1)}с`, baseCost: 1450, costGrowth: 1.44, baseTime: 10200, timeGrowth: 1.29, max: 20 },
  { id: "labDeathWaveHealth", name: "Здоровье Death Wave", desc: "Убийства Волной Смерти дают временный запас ОЗ", getEffect: (lvl) => `+${lvl}% лимита`, baseCost: 1600, costGrowth: 1.45, baseTime: 12000, timeGrowth: 1.3, max: 25 }
];

const labIconMap = {
  labDamage: "icon-damage",
  labAttackSpeed: "icon-attack-speed",
  labCoins: "icon-coin",
  labStartingCash: "icon-cash-bonus",
  labHealth: "icon-health",
  labCritDamage: "icon-crit-damage",
  labBossDamage: "icon-damage-meter",
  labUpgradeDiscount: "icon-tower-upgrade",
  labModuleParts: "icon-parts",
  labGameSpeed: "icon-ultimate-time-field",
  labLabSpeed: "icon-labs",
  labLightSpeed: "icon-attack-speed",
  labGarlicThorns: "icon-thorns",
  labPerkWaves: "icon-tower-upgrade",
  labGoldenBonus: "icon-ultimate-golden-core",
  labGoldenDuration: "icon-ultimate-golden-core",
  labBlackHoleCoins: "icon-ultimate-black-hole",
  labBlackHoleDamage: "icon-ultimate-black-hole",
  labBlackHoleDuration: "icon-ultimate-black-hole",
  labDeathWaveHealth: "icon-ultimate-death-wave",
};

const cardDefs = [
  { id: "cardDamage", name: "Урон", desc: "+20% за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.2).toFixed(2)}` },
  { id: "cardSpeed", name: "Скор. Атаки", desc: "+15% за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.15).toFixed(2)}` },
  { id: "cardHealth", name: "Здоровье", desc: "+25% за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.25).toFixed(2)}` },
  { id: "cardCash", name: "Бонус $", desc: "+20% за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.2).toFixed(2)}` },
  { id: "cardCoins", name: "Бонус монет", desc: "+15% за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.15).toFixed(2)}` },
  { id: "cardSlow", name: "Замедляющая аура", desc: "Враги медленнее на 5%", getEffect: (lvl) => `-${(lvl * 5)}% скор.` },
  { id: "cardRegen", name: "Регенерация", desc: "+30% регенерации за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.3).toFixed(2)}` },
  { id: "cardDefense", name: "Экстра защита", desc: "+2% защиты за уровень", getEffect: (lvl) => `+${lvl * 2}%` },
  { id: "cardFortress", name: "Крепость", desc: "+20% абсолютной защиты за уровень", getEffect: (lvl) => `x${(1 + lvl * 0.2).toFixed(2)}` },
  { id: "cardFreeUpgrade", name: "Бесплатные апгрейды", desc: "+3% шанса за уровень", getEffect: (lvl) => `+${lvl * 3}%` },
  { id: "cardExtraOrbs", name: "Доп. сферы", desc: "+1 орбитальная сфера за уровень", getEffect: (lvl) => `+${lvl} сф.` },
  { id: "cardWaveSkip", name: "Пропуск волны", desc: "+3% шанса за уровень", getEffect: (lvl) => `+${lvl * 3}%` },
  { id: "cardEnemyBalance", name: "Баланс врагов", desc: "Больше врагов и больше наград", getEffect: (lvl) => `+${lvl * 8}%` },
  { id: "cardDeathRay", name: "Смертельный луч", desc: "Периодически прорезает линию врагов", getEffect: (lvl) => `${Math.max(9, 18 - lvl * 1.5).toFixed(1)}с КД` },
  { id: "cardEnergyShield", name: "Энергощит", desc: "Блокирует смертельный удар раз в забег", getEffect: (lvl) => `${1 + Math.floor(lvl / 3)} заряд` },
  { id: "cardSecondWind", name: "Второе дыхание", desc: "Один раз восстанавливает ядро после смерти", getEffect: (lvl) => `${25 + lvl * 10}% ОЗ` },
  { id: "cardCriticalCoin", name: "Крит-монета", desc: "Криты повышают шанс монет", getEffect: (lvl) => `+${lvl * 3}%` },
  { id: "cardPlasmaCannon", name: "Плазменная пушка", desc: "Боссы получают урон при появлении", getEffect: (lvl) => `${lvl * 5}% ОЗ босса` },
  { id: "cardWaveAccelerator", name: "Ускоритель волн", desc: "Сокращает паузы между волнами", getEffect: (lvl) => `-${lvl * 8}% паузы` },
  { id: "cardLandmineStun", name: "Оглушающие мины", desc: "Мины замедляют выживших врагов", getEffect: (lvl) => `${0.6 + lvl * 0.2}с` },
  { id: "cardEnergyNet", name: "Энергосеть", desc: "На время ловит босса при появлении", getEffect: (lvl) => `${0.8 + lvl * 0.25}с` },
  { id: "cardDemonMode", name: "Демон-режим", desc: "Короткий стартовый разгон урона и скорости", getEffect: (lvl) => `${4 + lvl * 2}с` },
];
const CARD_PULL_COST = 20;
const CARD_SLOT_COSTS = [0, 50, 150, 400, 1000]; // 1-й слот бесплатен

const cardIconMap = {
  cardDamage: "icon-damage",
  cardSpeed: "icon-attack-speed",
  cardHealth: "icon-health",
  cardCash: "icon-cash-bonus",
  cardCoins: "icon-coins",
  cardSlow: "icon-ultimate-time-field",
  cardRegen: "icon-regen",
  cardDefense: "icon-defense-percent",
  cardFortress: "icon-absolute-defense",
  cardFreeUpgrade: "icon-free-upgrade",
  cardExtraOrbs: "icon-orb-count",
  cardWaveSkip: "icon-cash-wave",
  cardEnemyBalance: "icon-warning",
  cardDeathRay: "icon-death",
  cardEnergyShield: "icon-energy",
  cardSecondWind: "icon-recovery",
  cardCriticalCoin: "icon-crit-chance",
  cardPlasmaCannon: "icon-ultimate-solar-beam",
  cardWaveAccelerator: "icon-rapid-fire-chance",
  cardLandmineStun: "icon-landmine-chance",
  cardEnergyNet: "icon-ultimate-storm-chain",
  cardDemonMode: "icon-ultimate-death-wave",
};

function getCardIconClass(id) {
  return cardIconMap[id] || "icon-cards";
}

const moduleTypes = [
  { id: "weapon", name: "Орудие", desc: "Глобальный множитель Урона", stat: "damage", mults: [1.1, 1.25, 1.5, 2.0] },
  { id: "armor", name: "Броня", desc: "Глобальный множитель Здоровья", stat: "health", mults: [1.1, 1.25, 1.5, 2.0] },
  { id: "generator", name: "Генератор", desc: "Множитель Кэша и Монет", stat: "economy", mults: [1.1, 1.25, 1.5, 2.0] },
  { id: "core", name: "Процессор", desc: "Множитель Скор. Атаки", stat: "speed", mults: [1.1, 1.25, 1.5, 2.0] },
];
const rarityNames = ["Обычный", "Редкий", "Эпический", "Легендарный"];

const moduleUniqueDefs = [
  { id: "astralDeliverance", type: "weapon", name: "Astral Deliverance", desc: "Рикошет летит дальше и усиливается после каждого отскока." },
  { id: "wormholeRedirector", type: "armor", name: "Wormhole Redirector", desc: "Регенерация лечит часть оверхила от пакетов." },
  { id: "galaxyCompressor", type: "generator", name: "Galaxy Compressor", desc: "Пакеты восстановления сокращают перезарядку ультимейтов." },
  { id: "multiverseNexus", type: "core", name: "Multiverse Nexus", desc: "Golden Tower, Black Hole и Death Wave чаще синхронизируются." },
  { id: "blackHoleDigester", type: "generator", name: "Black Hole Digester", desc: "Бесплатные апгрейды временно усиливают монеты за убийство." },
  { id: "orbitalAugmentation", type: "armor", name: "Orbital Augmentation", desc: "Добавляет электронные орбиты, добивающие врагов рядом с ядром." },
];

const cosmeticDefs = {
  shapes: [
    { id: "shape_hex", name: "Гексагон", sides: 6, cost: 0 },
    { id: "shape_square", name: "Квадрат", sides: 4, cost: 15 },
    { id: "shape_triangle", name: "Тригон", sides: 3, cost: 25 },
    { id: "shape_octa", name: "Октагон", sides: 8, cost: 40 },
    { id: "shape_substance", name: "Субстанция", sides: 8, cost: 35, substance: true },
    { id: "shape_pulsar", name: "Пульсар", sides: 10, cost: 55, style: "star", label: "звездное ядро" },
    { id: "shape_ring", name: "Кольцо", sides: 12, cost: 70, style: "ring", label: "орбитальное кольцо" },
    { id: "shape_crystal", name: "Кристалл", sides: 6, cost: 85, style: "crystal", label: "призматическое ядро" },
    { id: "shape_blade", name: "Клинки", sides: 4, cost: 100, style: "blade", label: "роторное ядро" },
    { id: "shape_void", name: "Разлом", sides: 9, cost: 120, style: "void", label: "нестабильный разлом" },
  ],
  colors: [
    { id: "color_cyan", name: "Неон", color: "#55ecff", dark: "#141a3a", cost: 0 },
    { id: "color_pink", name: "Малиновый", color: "#ff5c9b", dark: "#3a1428", cost: 10 },
    { id: "color_green", name: "Токсичный", color: "#a5ff3b", dark: "#1e3a14", cost: 10 },
    { id: "color_gold", name: "Золотой", color: "#ffb020", dark: "#3a2a14", cost: 20 },
    { id: "color_red", name: "Кровавый", color: "#ff4444", dark: "#3a1414", cost: 30 },
  ]
};

const enemyDescs = {
  scout: "Быстрый и хрупкий. Берет числом.",
  grunt: "Рядовой боец сбалансированной силы.",
  brute: "Медленный танк с огромным запасом ОЗ.",
  shooter: "Останавливается вдали и стреляет в башню.",
  splitter: "При смерти распадается на два мелких Осколка.",
  shard: "Крайне быстрый осколок Делителя.",
  shield: "Первые 3 удара по нему наносят лишь 35% урона.",
  vampire: "Лечится при нанесении урона по Ядру.",
  armored: "Тяжелый металл. Полностью игнорирует отбрасывание.",
  assassin: "Стремительный. Огромный урон, но мало ОЗ.",
  healer: "Периодически восстанавливает ОЗ всем врагам вокруг.",
  boss: "Иммунитет к сферам и отбрасыванию. Дает кристаллы и детали модулей.",
  horn: "Прозрачный убийца. Его видит только внимательная рука игрока."
};

const runUpgradeDefs = [
  { id: "damage", name: "Урон", category: "attack", base: 12, growth: 1.32, max: 5000, desc: "Увеличивает базовый урон снарядов башни." },
  { id: "attackSpeed", name: "Скорость атаки", category: "attack", base: 16, growth: 1.34, max: 100, desc: "Увеличивает частоту выстрелов." },
  { id: "range", name: "Дальность", category: "attack", base: 14, growth: 1.3, max: 100, desc: "Увеличивает радиус поражения башни." },
  { id: "critChance", name: "Шанс крита", category: "attack", base: 18, growth: 1.38, max: 90, desc: "Вероятность нанести критический урон." },
  { id: "critDamage", name: "Сила крита", category: "attack", base: 22, growth: 1.42, max: 150, desc: "Множитель урона при критическом попадании." },
  { id: "multiShot", name: "Мультивыстрел", category: "attack", base: 32, growth: 1.46, max: 100, desc: "Шанс выпустить дополнительный снаряд." },
  { id: "bounceShot", name: "Рикошет", category: "attack", base: 85, growth: 1.55, max: 100, desc: "Шанс отскока снаряда в другую цель." },
  { id: "bounceTargets", name: "Цели рикошета", category: "attack", base: 190, growth: 1.62, max: 6, desc: "Увеличивает число цепных отскоков снаряда." },
  { id: "bounceRange", name: "Радиус рикошета", category: "attack", base: 160, growth: 1.48, max: 60, desc: "Увеличивает дальность поиска следующей цели для рикошета." },
  { id: "rapidFireChance", name: "Шанс Rapid Fire", category: "attack", base: 140, growth: 1.52, max: 80, desc: "Шанс временно ускорить стрельбу после выстрела." },
  { id: "rapidFireDuration", name: "Длит. Rapid Fire", category: "attack", base: 170, growth: 1.5, max: 60, desc: "Продлевает временный разгон Rapid Fire." },
  { id: "damageMeter", name: "Урон/метр", category: "attack", base: 110, growth: 1.42, max: 120, desc: "Снаряды наносят больше урона дальним целям." },
  { id: "superCritChance", name: "Супер-крит (%)", category: "attack", base: 1500, growth: 1.8, max: 100, desc: "Шанс превратить критический урон в супер-крит." },
  { id: "superCritMult", name: "Супер-крит (x)", category: "attack", base: 2000, growth: 1.85, max: 150, desc: "Дополнительный множитель для супер-критов." },
  { id: "orbCount", name: "Сферы (шт)", category: "attack", base: 2250, growth: 2.25, max: 4, desc: "Количество орбитальных сфер вокруг башни." },
  { id: "orbSpeed", name: "Скорость сфер", category: "attack", base: 1080, growth: 1.62, max: 50, desc: "Скорость вращения орбитальных сфер." },
  { id: "maxHealth", name: "Макс. здоровье", category: "defense", base: 15, growth: 1.32, max: 5000, desc: "Увеличивает максимальный запас здоровья." },
  { id: "regen", name: "Регенерация", category: "defense", base: 20, growth: 1.38, max: 5000, desc: "Восстанавливает здоровье каждую секунду." },
  { id: "absDefense", name: "Абс. защита", category: "defense", base: 10, growth: 1.25, max: 5000, desc: "Вычитает фиксированное значение из урона врагов." },
  { id: "knockback", name: "Отбрасывание", category: "defense", base: 24, growth: 1.38, max: 100, desc: "Шанс отбросить врага при попадании." },
  { id: "knockbackStrength", name: "Сила отбрасывания", category: "defense", base: 95, growth: 1.46, max: 60, desc: "Увеличивает дистанцию отбрасывания врагов." },
  { id: "lifesteal", name: "Вампиризм", category: "defense", base: 45, growth: 1.45, max: 100, desc: "Восстанавливает здоровье от нанесенного урона." },
  { id: "defensePercent", name: "Броня (%)", category: "defense", base: 50, growth: 1.5, max: 90, desc: "Процентное снижение получаемого урона." },
  { id: "thorns", name: "Шипы", category: "defense", base: 40, growth: 1.4, max: 100, desc: "Возвращает часть урона атакующим в ближнем бою." },
  { id: "deathDefy", name: "Второй шанс", category: "defense", base: 400, growth: 1.6, max: 30, desc: "Шанс пережить смертельный удар с 1 ХП." },
  { id: "landmineChance", name: "Шанс мин", category: "defense", base: 110, growth: 1.45, max: 50, desc: "Шанс сбросить мину при выстреле." },
  { id: "landmineDamage", name: "Урон мин", category: "defense", base: 130, growth: 1.48, max: 100, desc: "Множитель урона для наземных мин." },
  { id: "cashBonus", name: "Бонус $", category: "utility", base: 26, growth: 1.4, max: 200, desc: "Множитель получаемых $ с врагов." },
  { id: "cashWave", name: "$/Волна", category: "utility", base: 22, growth: 1.36, max: 160, desc: "Выдает кэш после завершения каждой волны." },
  { id: "freeUpgrade", name: "Беспл. апгрейд", category: "utility", base: 100, growth: 1.6, max: 100, desc: "Шанс бесплатно улучшить стат в конце волны." },
  { id: "runCoinBonus", name: "Бонус монет", category: "utility", base: 120, growth: 1.65, max: 150, desc: "Множитель выпадающих монет." },
  { id: "coinWave", name: "Монеты/Волна", category: "utility", base: 180, growth: 1.7, max: 80, desc: "Шанс получить постоянные монеты после волны." },
  { id: "interestRate", name: "Инвестиции (%)", category: "utility", base: 50, growth: 1.45, max: 50, desc: "Процент от текущих $, начисляемый каждую волну." },
  { id: "maxInterest", name: "Макс. инвест.", category: "utility", base: 100, growth: 1.55, max: 150, desc: "Максимальный лимит начисления $ с инвестиций." },
  { id: "packageChance", name: "Шанс посылки", category: "utility", base: 200, growth: 1.5, max: 100, desc: "Шанс получить лечение (оверхил) после волны." },
  { id: "packageMax", name: "Макс. оверхил", category: "utility", base: 300, growth: 1.65, max: 100, desc: "Максимальный множитель оверхила от пакетов." },
  { id: "shockWave", name: "Ударная волна", category: "utility", base: 880, growth: 1.7, max: 60, desc: "Периодически отталкивает врагов от башни, загоняя их под сферы." },
  { id: "enemyAttackSkip", name: "Пропуск ATK врагов", category: "utility", base: 340, growth: 1.6, max: 80, desc: "Снижает рост урона врагов в текущем забеге." },
  { id: "enemyHealthSkip", name: "Пропуск HP врагов", category: "utility", base: 340, growth: 1.6, max: 80, desc: "Снижает рост здоровья врагов в текущем забеге." },
  { id: "waveSkip", name: "Пропуск волны", category: "utility", base: 420, growth: 1.68, max: 50, desc: "Шанс мгновенно зачесть следующую волну и ускорить фарм." },
];

const runUpgradeRequirements = {
  bounceTargets: "bounceShot",
  bounceRange: "bounceShot",
  superCritMult: "superCritChance",
  rapidFireDuration: "rapidFireChance",
  orbSpeed: "orbCount",
  knockbackStrength: "knockback",
  landmineDamage: "landmineChance",
  maxInterest: "interestRate",
  packageMax: "packageChance",
};

const runUpgradeCategories = {
  attack: { label: "Атака", icon: "⚔" },
  defense: { label: "Защита", icon: "🛡" },
  utility: { label: "Тактика", icon: "★" },
};

const runUpgradeIconMap = {
  damage: "icon-damage",
  attackSpeed: "icon-attack-speed",
  range: "icon-range",
  critChance: "icon-crit-chance",
  critDamage: "icon-crit-damage",
  multiShot: "icon-multishot",
  bounceShot: "icon-bounce-shot",
  bounceTargets: "icon-bounce-targets",
  bounceRange: "icon-bounce-range",
  rapidFireChance: "icon-rapid-fire-chance",
  rapidFireDuration: "icon-rapid-fire-duration",
  damageMeter: "icon-damage-meter",
  superCritChance: "icon-super-crit-chance",
  superCritMult: "icon-super-crit-mult",
  orbCount: "icon-orb-count",
  orbSpeed: "icon-orb-speed",
  maxHealth: "icon-max-health",
  regen: "icon-regen",
  absDefense: "icon-absolute-defense",
  knockback: "icon-knockback",
  knockbackStrength: "icon-knockback-strength",
  lifesteal: "icon-lifesteal",
  defensePercent: "icon-defense-percent",
  thorns: "icon-thorns",
  deathDefy: "icon-death-defy",
  landmineChance: "icon-landmine-chance",
  landmineDamage: "icon-landmine-damage",
  cashBonus: "icon-cash-bonus",
  cashWave: "icon-cash-wave",
  runCoinBonus: "icon-run-coin-bonus",
  coinWave: "icon-coin-wave",
  interestRate: "icon-interest-rate",
  maxInterest: "icon-max-interest",
  freeUpgrade: "icon-free-upgrade",
  packageChance: "icon-package-chance",
  packageMax: "icon-package-max",
  shockWave: "icon-shock-wave",
  enemyAttackSkip: "icon-enemy-attack-skip",
  enemyHealthSkip: "icon-enemy-health-skip",
  waveSkip: "icon-wave-skip",
};
const defaultRunUpgradeIconClass = "icon-tower-upgrade";

const ultimateDefs = [
  { id: "stormChain", name: "Chain Lightning", cost: 800, cooldown: 11, desc: "Молния перескакивает между врагами.", getUpgradeInfo: (lvl) => `Целей: ${4+lvl} -> ${4+lvl+1} | Урон: x${4+lvl}` },
  { id: "timeField", name: "Chrono Field", cost: 900, cooldown: 18, desc: "Замедляет врагов вокруг башни.", getUpgradeInfo: (lvl) => `Замедление: постоянно` },
  { id: "missileSwarm", name: "Smart Missile", cost: 1100, cooldown: 16, desc: "Запускает самонаводящиеся ракеты.", getUpgradeInfo: (lvl) => `Ракет: ${5+lvl} -> ${5+lvl+1}` },
  { id: "solarBeam", name: "Солнечный луч", cost: 1400, cooldown: 45, desc: "Мощный луч на 360 градусов.", getUpgradeInfo: (lvl) => `Урон/сек: x${15+lvl*5} -> x${15+(lvl+1)*5}` },
  { id: "goldenCore", name: "Golden Tower", cost: 1600, cooldown: 35, desc: "Умножает $ и монеты во время активности.", getUpgradeInfo: (lvl) => `Длительность: ${10+lvl*2}с -> ${10+(lvl+1)*2}с` },
  { id: "blackHole", name: "Black Hole", cost: 1850, cooldown: 42, desc: "Стягивает врагов и увеличивает награды за убийства внутри.", getUpgradeInfo: (lvl) => `Длительность: ${6+lvl}с -> ${6+lvl+1}с` },
  { id: "deathWave", name: "Death Wave", cost: 5600, cooldown: 90, desc: "Короткая волна энергии вокруг башни.", getUpgradeInfo: (lvl) => `Урон: x${(1.7+lvl*0.35).toFixed(1)} -> x${(1.7+(lvl+1)*0.35).toFixed(1)}` },
  { id: "poisonSwamp", name: "Poison Swamp", cost: 2200, cooldown: 18, desc: "Создает токсичные лужи.", getUpgradeInfo: (lvl) => `Луж: ${3+lvl} -> ${3+lvl+1}` },
];

const ultimateLoadoutLimit = 3;

const synergyDefs = [
  { ids: ["timeField", "solarBeam"], name: "Орбитальная линза", desc: "Солнечный луч замедляет задетых врагов." },
  { ids: ["timeField", "missileSwarm"], name: "Стазис-заряд", desc: "Рой ракет наносит на 35% больше урона." },
  { ids: ["stormChain", "deathWave"], name: "Магнитная дуга", desc: "Цепь шторма поражает на 2 цели больше." },
  { ids: ["stormChain", "solarBeam"], name: "Заряженный фокус", desc: "+5% шанса крита в забеге." },
  { ids: ["goldenCore", "blackHole"], name: "Фарм-синхрон", desc: "Убийства в Черной Дыре под Золотым Ядром дают еще больше $." },
  { ids: ["blackHole", "deathWave"], name: "Сжатая волна", desc: "Волна Смерти наносит больше урона врагам в Черной Дыре." },
];

const eventModeDefs = [
  { id: "scoutRush", name: "Налет разведчиков", desc: "В основном быстрые разведчики. +35% к счету медалей.", reward: 1.35 },
  { id: "doubleBoss", name: "Протокол двух боссов", desc: "Босс-волны вызывают двух боссов. +65% к счету медалей.", reward: 1.65 },
  { id: "glassCore", name: "Хрупкое ядро", desc: "-30% ОЗ башни, +50% $. +50% к счету медалей.", reward: 1.5 },
  { id: "overclocked", name: "Разогнанное поле", desc: "Враги быстрее, улучшения дешевле. +45% к счету медалей.", reward: 1.45 },
  { id: "tournament", name: "Турнир (Рейтинг)", desc: "Враги получают +2% ОЗ и Урона каждую волну. Награда: 1 🔮 за 10 волн.", reward: 1.0 },
];

const eventShopDefs = [
  { id: "medalDamage", name: "Медальный калибратор", desc: "+1 базового урона за уровень", getEffect: (lvl) => `+${lvl * 1}`, cost: 8, max: 20 },
  { id: "medalCoins", name: "Множитель призов", desc: "+3% выплаты монет за уровень", getEffect: (lvl) => `+${lvl * 3}%`, cost: 10, max: 20 },
  { id: "medalStart", name: "Ивент-$", desc: "+15 стартовых $ за уровень", getEffect: (lvl) => `+$${lvl * 15}`, cost: 6, max: 15 },
];

const milestoneDefs = [
  { id: "w10", wave: 10, reward: { coins: 35, crystals: 5 }, text: "+35 монет, +5 ♦" },
  { id: "w25", wave: 25, reward: { coins: 100, medals: 3, crystals: 12 }, text: "+100 монет, +3 медали, +12 ♦" },
  { id: "w50", wave: 50, reward: { coins: 260, prestige: 1, crystals: 25 }, text: "+260 монет, +1 престиж, +25 ♦" },
  { id: "w75", wave: 75, reward: { coins: 520, medals: 8, prestige: 1, crystals: 45 }, text: "+520 монет, +8 медалей, +1 престиж, +45 ♦" },
  { id: "w100", wave: 100, reward: { coins: 1000, medals: 15, prestige: 3, crystals: 100 }, text: "+1000 монет, +15 медалей, +3 престижа, +100 ♦" },
];

const eventDefs = [
  { id: "kill100", name: "Убей 100 врагов", target: 100, metric: "kills", rewardMedals: 5, rewardCrystals: 10 },
  { id: "wave20", name: "Дойди до 20-й волны", target: 20, metric: "bestWave", rewardMedals: 8, rewardCrystals: 20 },
  { id: "boss3", name: "Победи 3 боссов", target: 3, metric: "bossKills", rewardMedals: 10, rewardCrystals: 30 },
  { id: "buy10", name: "Купи 10 улучшений за один забег", target: 10, metric: "maxRunUpgrades", rewardMedals: 6, rewardCrystals: 15 },
  { id: "cash1000", name: "Заработай $1000", target: 1000, metric: "cashEarned", rewardMedals: 7, rewardCrystals: 15 },
];

const dailyRewards = [
  { text: "+100 Монет", type: "coins", amount: 100 },
  { text: "+10 Медалей", type: "medals", amount: 10 },
  { text: "+20 Кристаллов", type: "crystals", amount: 20 },
  { text: "+500 Монет", type: "coins", amount: 500 },
  { text: "+25 Медалей", type: "medals", amount: 25 },
  { text: "+50 Кристаллов", type: "crystals", amount: 50 },
  { text: "+150 Кристаллов", type: "crystals", amount: 150 },
];

const dailyQuestPool = [
  { id: "dq_kills", name: "Охотник", desc: "Убей 500 врагов", type: "kills", target: 500, reward: 10 },
  { id: "dq_bosses", name: "Дуэлянт", desc: "Убей 5 боссов", type: "bosses", target: 5, reward: 15 },
  { id: "dq_waves", name: "Выживший", desc: "Пройди 50 волн", type: "waves", target: 50, reward: 10 },
  { id: "dq_upgrades", name: "Инвестор", desc: "Купи 30 улучшений в бою", type: "upgrades", target: 30, reward: 10 },
];

const bossRewardDefs = [
  { id: "overcharge", name: "Линза перегруза", desc: "+18% урона и +8 дальности", apply: () => {
    game.tower.damage *= 1.09;
    game.tower.range += 5;
    if(game.rewardMultipliers) game.rewardMultipliers.damage *= 1.09;
  } },
  { id: "pulseEngine", name: "Импульсный двигатель", desc: "+16% скорости атаки", apply: () => {
    game.tower.attackSpeed *= 1.08;
  } },
  { id: "repairLoop", name: "Ремонтный цикл", desc: "Восстановить 35% ОЗ и +1 регенерации", apply: () => {
    game.tower.hp = Math.min(game.tower.maxHp, game.tower.hp + game.tower.maxHp * 0.25);
    game.tower.regen += 0.5;
  } },
  { id: "luckyCapacitor", name: "Удачный конденсатор", desc: "+7% крита и +0.25 силы крита", apply: () => {
    game.tower.critChance += 0.035;
    game.tower.critDamage += 0.15;
  } },
  { id: "wideBurst", name: "Широкий залп", desc: "+8% мультивыстрела и +6% отбрасывания", apply: () => {
    game.tower.multiShot += 0.04;
    game.tower.knockback += 0.035;
  } },
  { id: "salvageCode", name: "Код утилизации", desc: "+15% бонуса $ и +$80 сразу", apply: () => {
    game.tower.cashBonus += 0.08;
    game.cash += 50;
  } },
];

const perkDefs = [
  { id: "dmg", name: "Урон +15%", desc: "Увеличивает весь урон башни на 15%.", max: 5 },
  { id: "hp", name: "Здоровье +20%", desc: "Максимальное здоровье башни увеличено на 20%.", max: 5 },
  { id: "regenPerk", name: "Регенерация x1.6", desc: "Сильно усиливает восстановление ядра.", max: 5 },
  { id: "defense", name: "Защита +4%", desc: "Процент защиты увеличен на 4%.", max: 5 },
  { id: "coins", name: "Монеты +15%", desc: "Глобальный шанс выпадения монет увеличен.", max: 5 },
  { id: "orbPerk", name: "Орба +1", desc: "Добавляет дополнительную орбитальную сферу.", max: 2 },
  { id: "freeUpPerk", name: "Free Upgrades +5%", desc: "Повышает шанс бесплатных улучшений.", max: 5 },
  { id: "perkWaveReq", name: "Перки чаще -20%", desc: "Следующие перки появляются быстрее.", max: 3 },
  { id: "gameSpeedPerk", name: "Скорость игры +1", desc: "Ускоряет текущий забег.", max: 1 },
  { id: "tradeHp", name: "Хрупкие враги", desc: "Сделка: -40% ОЗ врагов, но +40% урон врагов.", max: 1, trade: true },
  { id: "tradeBoss", name: "Убийца боссов", desc: "Сделка: +50% урона по боссам, -10% урона по остальным.", max: 1, trade: true },
  { id: "tradeCoinsHp", name: "Монеты x1.8 / -70% ОЗ", desc: "Сделка: сильный фарм ценой максимального здоровья.", max: 1, trade: true },
];

const enemyDefs = {
  scout: { name: "Разведчик", hp: 11, speed: 52, reward: 6, damage: 4, radius: 11, color: "#41e7ff" },
  grunt: { name: "Боец", hp: 19, speed: 28, reward: 5, damage: 7, radius: 13, color: "#ff6cab" },
  brute: { name: "Громила", hp: 72, speed: 17, reward: 15, damage: 16, radius: 17, color: "#ff9a3d" },
  shooter: { name: "Стрелок", hp: 28, speed: 22, reward: 12, damage: 6, radius: 13, color: "#b375ff" },
  splitter: { name: "Делитель", hp: 32, speed: 25, reward: 11, damage: 8, radius: 14, color: "#22ffd0" },
  shard: { name: "Осколок", hp: 9, speed: 45, reward: 2, damage: 3, radius: 8, color: "#7cff8b" },
  shield: { name: "Щитовой", hp: 40, speed: 21, reward: 14, damage: 9, radius: 14, color: "#ffe75c" },
  vampire: { name: "Вампир", hp: 36, speed: 27, reward: 13, damage: 10, radius: 14, color: "#ff4e78" },
  armored: { name: "Броненосец", hp: 85, speed: 15, reward: 18, damage: 18, radius: 16, color: "#8a94a6" },
  assassin: { name: "Ассасин", hp: 6, speed: 72, reward: 8, damage: 25, radius: 10, color: "#ff2a2a" },
  healer: { name: "Целитель", hp: 35, speed: 20, reward: 15, damage: 5, radius: 14, color: "#24b47e" },
  boss: { name: "Босс", hp: 3400, speed: 14, reward: 115, damage: 28, radius: 60, color: "#f8f2ff" },
  horn: { name: "Рога", hp: 38, speed: 10, reward: 16, damage: 0, radius: 14, color: "#a9a9a9" },
};

let progress;
let game;
let lastFrame = 0;
let animationId = 0;
let paused = false;
let gameSpeed = 1;
const gameSpeedSteps = [1, 1.5, 2, 3, 4, 5];
let activeRunUpgradeCategory = "attack";
let runUpgradeScrollPositions = {};
let isRestoringRunUpgradeScroll = false;
let wasPausedForInfo = false;
let offlineMsCalculated = 0;
let arenaGridOffset = { x: 0, y: 0 };
let towerPositionAnimationId = 0;

// --- ИНТЕГРАЦИЯ TELEGRAM ---
const tg = window.Telegram?.WebApp;

function applyTelegramPlatformClasses() {
  const platform = (tg?.platform || "browser").toLowerCase();
  const isMobile = !["iPad", "tdesktop", "macos", "web"].some(p => navigator.userAgent.includes(p));
  document.body.classList.toggle("is-telegram", Boolean(tg));
  document.body.classList.toggle("is-telegram-mobile", Boolean(tg) && isMobile);
  document.body.classList.toggle("is-telegram-desktop", ["tdesktop", "macos", "web", "weba", "webk"].includes(platform));
  
  // Установка viewport метаданных Telegram
  if (tg?.setViewportExpandable) {
    tg.setViewportExpandable?.(true);
  }
  if (tg?.disableVerticalSwipes) {
    tg.disableVerticalSwipes?.(false);
  }
}

function getArenaWorldCenter() {
  const arenaRect = arenaWrap?.getBoundingClientRect();
  const viewportWidth = Math.max(320, Math.round(arenaRect?.width || canvas.clientWidth || 760));
  const viewportHeight = Math.max(240, Math.round(arenaRect?.height || canvas.clientHeight || 920));
  const scaleX = ARENA_CAMERA_ZOOM_OUT;
  const scaleY = ARENA_CAMERA_ZOOM_OUT;
  const upgradePanel = document.querySelector(".upgrade-panel");
  const panelRect = upgradePanel?.getBoundingClientRect();
  let visibleBottom = viewportHeight;

  if (arenaRect && panelRect) {
    visibleBottom = Math.max(120, Math.min(viewportHeight, panelRect.top - arenaRect.top));
  }

  return {
    x: (viewportWidth / 2) * scaleX,
    y: (visibleBottom / 2) * scaleY,
  };
}


function scaleWorldPoint(point, scaleX, scaleY) {
  if (!point || typeof point.x !== "number" || typeof point.y !== "number") return;
  point.x *= scaleX;
  point.y *= scaleY;
}

function getCanvasEffectiveWidth() {
  return canvas._logicalWidth || canvas.width;
}

function getCanvasEffectiveHeight() {
  return canvas._logicalHeight || canvas.height;
}

function shiftWorldPoint(point, dx, dy) {
  if (!point || typeof point.x !== "number" || typeof point.y !== "number") return;
  point.x += dx;
  point.y += dy;
}

function shiftArenaWorld(dx, dy) {
  if (!game || (!dx && !dy)) return;
  shiftWorldPoint(game.tower, dx, dy);
  game.enemies?.forEach((enemy) => shiftWorldPoint(enemy, dx, dy));
  game.projectiles?.forEach((projectile) => shiftWorldPoint(projectile, dx, dy));
  game.enemyProjectiles?.forEach((projectile) => shiftWorldPoint(projectile, dx, dy));
  game.missiles?.forEach((missile) => shiftWorldPoint(missile, dx, dy));
  game.landmines?.forEach((mine) => shiftWorldPoint(mine, dx, dy));
  game.effects?.forEach((effect) => {
    shiftWorldPoint(effect, dx, dy);
    effect.pts?.forEach((point) => shiftWorldPoint(point, dx, dy));
  });
  game.texts?.forEach((text) => shiftWorldPoint(text, dx, dy));
  shiftWorldPoint(game.blackHole, dx, dy);
  arenaGridOffset.x += dx;
  arenaGridOffset.y += dy;
}

function positionTowerInVisibleArena() {
  if (!game?.tower) return;
  const center = getArenaWorldCenter();
  shiftArenaWorld(center.x - game.tower.x, center.y - game.tower.y);
}

function redrawAfterTowerPositionUpdate() {
  positionTowerInVisibleArena();
  if (game && !game.ended) drawGame();
}

function scheduleTowerPositionUpdate() {
  if (towerPositionAnimationId) cancelAnimationFrame(towerPositionAnimationId);
  const startedAt = performance.now();
  const duration = 280;

  const followPanel = (now) => {
    redrawAfterTowerPositionUpdate();
    if (now - startedAt < duration) {
      towerPositionAnimationId = requestAnimationFrame(followPanel);
      return;
    }
    towerPositionAnimationId = 0;
    redrawAfterTowerPositionUpdate();
  };

  towerPositionAnimationId = requestAnimationFrame(followPanel);
}

function resizeGameCanvas() {
  const rect = arenaWrap?.getBoundingClientRect();
  let devicePixelRatio = window.devicePixelRatio || 1;
  if (devicePixelRatio > 2.5) devicePixelRatio = 2.5; // Ограничение для избежания краша по памяти на Android

  const viewportWidth = Math.max(320, Math.round(rect?.width || canvas.clientWidth || 760));
  const viewportHeight = Math.max(240, Math.round(rect?.height || canvas.clientHeight || 920));
  
  const logicalWidth = viewportWidth * ARENA_CAMERA_ZOOM_OUT;
  const logicalHeight = viewportHeight * ARENA_CAMERA_ZOOM_OUT;

  // Физический размер холста теперь строго равен размеру экрана (с учетом DPR),
  // а зум достигается через ctx.scale, чтобы не превысить лимиты текстур на мобилках.
  const width = Math.round(viewportWidth * devicePixelRatio);
  const height = Math.round(viewportHeight * devicePixelRatio);
  
  const prevWidth = canvas.width;
  const prevHeight = canvas.height;

  if (prevWidth === width && prevHeight === height) {
    positionTowerInVisibleArena();
    if (game && !game.ended) drawGame();
    else drawIdleArena();
    return;
  }

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  
  if (ctx) {
    const scale = devicePixelRatio / ARENA_CAMERA_ZOOM_OUT;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  if (game?.tower) {
    const prevLogicalWidth = canvas._logicalWidth || (prevWidth ? prevWidth / devicePixelRatio : logicalWidth);
    const prevLogicalHeight = canvas._logicalHeight || (prevHeight ? prevHeight / devicePixelRatio : logicalHeight);
    
    const scaleX = logicalWidth / prevLogicalWidth;
    const scaleY = logicalHeight / prevLogicalHeight;
    
    scaleWorldPoint(game.tower, scaleX, scaleY);
    game.enemies?.forEach((enemy) => scaleWorldPoint(enemy, scaleX, scaleY));
    game.projectiles?.forEach((projectile) => scaleWorldPoint(projectile, scaleX, scaleY));
    game.enemyProjectiles?.forEach((projectile) => scaleWorldPoint(projectile, scaleX, scaleY));
    game.missiles?.forEach((missile) => scaleWorldPoint(missile, scaleX, scaleY));
    game.landmines?.forEach((mine) => scaleWorldPoint(mine, scaleX, scaleY));
    game.effects?.forEach((effect) => {
      scaleWorldPoint(effect, scaleX, scaleY);
      effect.pts?.forEach((point) => scaleWorldPoint(point, scaleX, scaleY));
    });
    game.texts?.forEach((text) => scaleWorldPoint(text, scaleX, scaleY));
    scaleWorldPoint(game.blackHole, scaleX, scaleY);
    arenaGridOffset.x *= scaleX;
    arenaGridOffset.y *= scaleY;
    positionTowerInVisibleArena();
  }

  canvas._logicalWidth = logicalWidth;
  canvas._logicalHeight = logicalHeight;

  if (game && !game.ended) drawGame();
  else drawIdleArena();
}

function syncTelegramViewport() {
  const height = tg?.viewportStableHeight || tg?.viewportHeight || window.visualViewport?.height || window.innerHeight;
  if (height) document.documentElement.style.setProperty("--tg-viewport-height", `${Math.round(height)}px`);
  applyTelegramPlatformClasses();
  window.requestAnimationFrame(resizeGameCanvas);
}

syncTelegramViewport();
window.addEventListener("resize", syncTelegramViewport, { passive: true });
window.addEventListener("orientationchange", syncTelegramViewport, { passive: true });
window.visualViewport?.addEventListener("resize", syncTelegramViewport, { passive: true });
// Для iOS: отслеживаем изменения safe area
if (CSS.supports("padding", "env(safe-area-inset-top)")) {
  const mediaQuery = window.matchMedia("(orientation: portrait)");
  mediaQuery.addEventListener("change", syncTelegramViewport, { passive: true });
}

if (tg) {
  tg.ready?.();
  tg.expand?.(); // Разворачиваем игру на весь экран в TG
  tg.onEvent?.("viewportChanged", syncTelegramViewport);
}

// --- АУДИО ДВИЖОК (Web Audio API) ---
const audio = {
  ctx: null,
  lastPlayed: {},
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  play(type) {
    if (!progress?.settings?.sound || !this.ctx) return;
    const now = Date.now();
    if (this.lastPlayed[type] && now - this.lastPlayed[type] < 50) return; // Ограничитель, чтобы звук не рвался при 50 попаданиях разом
    this.lastPlayed[type] = now;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    const vol = progress?.settings?.soundVolume ?? 0.8;

    if (type === "shoot") {
      osc.type = "square";
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
      gain.gain.setValueAtTime(0.15 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    } else if (type === "substanceShoot") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);
      gain.gain.setValueAtTime(0.16 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.002, t + 0.18);
      osc.start(t); osc.stop(t + 0.18);
    } else if (type === "hit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
      gain.gain.setValueAtTime(0.2 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    } else if (type === "crit") {
      osc.type = "square";
      osc.frequency.setValueAtTime(1000, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      gain.gain.setValueAtTime(0.15 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
    } else if (type === "explosion") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
      gain.gain.setValueAtTime(0.4 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.4);
    } else if (type === "coin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(1600, t + 0.05);
      gain.gain.setValueAtTime(0.2 * vol, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    } else if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
      gain.gain.setValueAtTime(0.2 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t); osc.stop(t + 0.05);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.15);
      gain.gain.setValueAtTime(0.2 * vol, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    } else if (type === "boss") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(50, t);
      osc.frequency.linearRampToValueAtTime(100, t + 1.5);
      gain.gain.setValueAtTime(0.3 * vol, t);
      gain.gain.linearRampToValueAtTime(0, t + 1.5);
      osc.start(t); osc.stop(t + 1.5);
    } else if (type === "baseHit") {
      osc.type = "square";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.2);
      gain.gain.setValueAtTime(0.4 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
    }
  }
};

const bgm = {
  interval: null,
  gameNotes: [
    220.00, 261.63, 329.63, 440.00, 220.00, 261.63, 329.63, 440.00, // Am
    174.61, 220.00, 261.63, 349.23, 174.61, 220.00, 261.63, 349.23, // F
    261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 523.25, // C
    196.00, 246.94, 293.66, 392.00, 196.00, 246.94, 293.66, 392.00, // G
    146.83, 174.61, 220.00, 293.66, 146.83, 174.61, 220.00, 293.66, // Dm
    220.00, 261.63, 329.63, 440.00, 220.00, 261.63, 329.63, 440.00, // Am
    164.81, 207.65, 246.94, 329.63, 164.81, 207.65, 246.94, 329.63, // E
    164.81, 207.65, 293.66, 329.63, 329.63, 293.66, 246.94, 207.65  // E7 (спад перед новым кругом)
  ],
  menuNotes: [
    261.63, 329.63, 392.00, 523.25, // C
    220.00, 261.63, 329.63, 440.00, // Am
    174.61, 220.00, 261.63, 349.23, // F
    196.00, 246.94, 293.66, 392.00  // G
  ],
  step: 0,
  currentMode: null,
  update() {
    const isActiveGame = game && !game.ended && !paused;
    const newMode = isActiveGame ? "game" : "menu";

    if (this.currentMode !== newMode) {
      clearInterval(this.interval);
      this.interval = null;
      this.currentMode = newMode;
      this.step = 0;
    }

    if (progress?.settings?.music) {
      if (!this.interval) {
        audio.init();
        const notes = this.currentMode === "game" ? this.gameNotes : this.menuNotes;
        const tempo = this.currentMode === "game" ? 180 : 350;

        this.interval = setInterval(() => {
          if (!progress?.settings?.music || !audio.ctx || audio.ctx.state === "suspended") return;
          const t = audio.ctx.currentTime;
          const osc = audio.ctx.createOscillator();
          const gain = audio.ctx.createGain();
          
          osc.type = "triangle"; // Смягченный 8-битный звук (меньше режет слух)
          osc.frequency.value = notes[this.step % notes.length];
          this.step++;
          osc.connect(gain);
          gain.connect(audio.ctx.destination);
          
          const vol = progress.settings.musicVolume ?? 0.8;
          const baseGain = this.currentMode === "game" ? 0.25 : 0.15;

          // Плавное затухание (чтобы ноты не стучали по ушам)
          gain.gain.setValueAtTime(baseGain * vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (tempo / 1000) - 0.02);
          
          osc.start(t); osc.stop(t + (tempo / 1000));
        }, tempo); 
      }
    } else {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
};

function defaultProgress() {
  return {
    lastSaveTime: Date.now(),
    lastDailyTime: 0,
    dailyStreak: 0,
    playerId: tg?.initDataUnsafe?.user?.id ? "TG-" + tg.initDataUnsafe.user.id : "ID-" + Math.floor(Math.random() * 1000000000).toString(16).toUpperCase(),
    playTime: 0,
    coins: 0,
    crystals: 0,
    powerStones: 0,
    moduleParts: 0,
    modules: [],
    equippedModules: { weapon: null, armor: null, generator: null, core: null },
    stoneUpgrades: { dmg: 0, cd: 0 },
    bestiary: {},
    cards: {},
    cardSlots: 1,
    equippedCards: [],
    medals: 0,
    spentCoins: 0,
    spentMedals: 0,
    prestige: 0,
    bestWave: 0,
    totalKills: 0,
    totalBosses: 0,
    tiers: { 1: 0, 2: 0, 3: 0 },
    permanent: Object.fromEntries(permanentDefs.map((u) => [u.id, 0])),
    labs: { slots: 1, active: [], levels: Object.fromEntries(labDefs.map((u) => [u.id, 0])) },
    ultimates: Object.fromEntries(ultimateDefs.map((u) => [u.id, { owned: false, level: 0, enabled: true }])),
    events: { kills: 0, bossKills: 0, runUpgrades: 0, maxRunUpgrades: 0, cashEarned: 0, bestScore: 0, claimed: {} },
    eventShop: Object.fromEntries(eventShopDefs.map((u) => [u.id, 0])),
    milestones: {},
    settings: { damageNumbers: true, screenShake: true, reducedMotion: false, music: true, sound: true, fps60: true, musicVolume: 0.8, soundVolume: 0.8, autoRestart: false },
    customization: { shape: "shape_hex", color: "color_cyan" },
    unlockedCosmetics: ["shape_hex", "color_cyan", "shape_substance"],
    dailyQuests: { date: "", list: [] },
  };
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (raw.lastSaveTime) offlineMsCalculated = Date.now() - raw.lastSaveTime;
    progress = { ...defaultProgress(), ...raw };
  } catch {
    progress = defaultProgress();
  }
  if (!progress.playerId) progress.playerId = defaultProgress().playerId;
  progress.permanent = { ...defaultProgress().permanent, ...progress.permanent };
  progress.labs = progress.labs || defaultProgress().labs;
  progress.labs.levels = { ...defaultProgress().labs.levels, ...progress.labs.levels };
  progress.cards = progress.cards || {};
  progress.equippedCards = progress.equippedCards || [];
  progress.modules = progress.modules || [];
  progress.equippedModules = { ...defaultProgress().equippedModules, ...(progress.equippedModules || {}) };
  progress.stoneUpgrades = { ...defaultProgress().stoneUpgrades, ...(progress.stoneUpgrades || {}) };
  progress.bestiary = progress.bestiary || {};
  progress.ultimates = { ...defaultProgress().ultimates, ...progress.ultimates };
  progress.events = { ...defaultProgress().events, ...progress.events };
  progress.eventShop = { ...defaultProgress().eventShop, ...progress.eventShop };
  progress.milestones = { ...defaultProgress().milestones, ...progress.milestones };
  progress.settings = { ...defaultProgress().settings, ...progress.settings };
  progress.customization = { ...defaultProgress().customization, ...(progress.customization || {}) };
  progress.unlockedCosmetics = progress.unlockedCosmetics || defaultProgress().unlockedCosmetics;
  progress.dailyQuests = progress.dailyQuests || defaultProgress().dailyQuests;
  normalizeUltimateLoadout();
  saveProgress();
  checkCompletedLabs();
}

function saveProgress() {
  progress.lastSaveTime = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function showScreen(screenKey) {
  if (screenKey !== "game" && game?.ended) {
    cancelAnimationFrame(animationId);
  }
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[screenKey].classList.add("active");
  screens[screenKey].scrollTop = 0;
  if (screenKey === "menu") renderMenu();
  if (screenKey === "labs") renderLabs();
  if (screenKey === "cards") renderCards();
  if (screenKey === "custom") renderCustomization();
  if (screenKey === "modules") renderModules();
  if (screenKey === "permanent") renderPermanentShop();
  if (screenKey === "ultimate") renderUltimateShop();
  if (screenKey === "events") renderEvents();
  if (screenKey === "settings") renderSettings();
  if (screenKey === "profile") renderProfile();
  if (screenKey === "guide") renderGuide();
}

function initGame() {
  loadProgress();
  bindUi();
  checkWelcomeBack();
  checkDailyQuests();
  renderMenu();
  resizeGameCanvas();
  if (tg?.CloudStorage) {
    document.getElementById("tgCloudBlock").classList.remove("hidden");
  }
  drawIdleArena();
}

function bindUi() {
  document.getElementById("playBtn").addEventListener("click", () => startRun());
  document.getElementById("continueBtn").addEventListener("click", continueRun);
  document.getElementById("againBtn").addEventListener("click", restartFromDefeat);
  document.getElementById("menuBtn").addEventListener("click", exitDefeatToMenu);
  document.getElementById("reviveBtn").addEventListener("click", reviveRun);
  document.getElementById("upgradesBtn").addEventListener("click", () => showScreen("permanent"));
  document.getElementById("profileBtn").addEventListener("click", () => showScreen("profile"));
  document.getElementById("labsBtn").addEventListener("click", () => showScreen("labs"));
  document.getElementById("cardsBtn").addEventListener("click", () => showScreen("cards"));
  document.getElementById("customBtn").addEventListener("click", () => showScreen("custom"));
  document.getElementById("modulesBtn").addEventListener("click", () => showScreen("modules"));
  document.getElementById("ultimateBtn").addEventListener("click", () => showScreen("ultimate"));
  document.getElementById("eventsBtn").addEventListener("click", () => showScreen("events"));
  document.getElementById("guideBtn").addEventListener("click", () => showScreen("guide"));
  document.getElementById("settingsBtn").addEventListener("click", () => showScreen("settings"));
  document.getElementById("gameSettingsBtn").addEventListener("click", toggleGameGearMenu);
  document.getElementById("settingsFromGameBtn").addEventListener("click", openGameSettings);
  document.getElementById("gameMenuBtn").addEventListener("click", pauseRunToMenu);
  document.getElementById("quitRunBtn").addEventListener("click", quitRun);
  document.getElementById("pullCardBtn").addEventListener("click", pullCard);
  document.getElementById("closeCardPullBtn").addEventListener("click", closeCardPullOverlay);
  document.getElementById("pullModuleBtn").addEventListener("click", pullModule);
  document.getElementById("mergeModulesBtn").addEventListener("click", mergeModules);
  document.getElementById("hudPlayPauseBtn").addEventListener("click", togglePause);
  document.getElementById("hudSpeedUpBtn").addEventListener("click", increaseSpeed);
  document.getElementById("hudSpeedDownBtn").addEventListener("click", decreaseSpeed);
  document.getElementById("runUpgradeGrid").addEventListener("scroll", () => {
    if (!isRestoringRunUpgradeScroll) saveRunUpgradeScrollPosition();
  }, { passive: true });
  document.getElementById("closeUpgradeInfoBtn").addEventListener("click", () => {
    document.getElementById("upgradeInfoOverlay").classList.add("hidden");
    if (wasPausedForInfo) {
      togglePause();
      wasPausedForInfo = false;
    }
  });
  document.getElementById("claimWelcomeBtn").addEventListener("click", () => {
    document.getElementById("welcomeOverlay").classList.add("hidden");
    audio.play("click");
  });
  document.getElementById("damageNumbersToggle").addEventListener("change", (event) => updateSetting("damageNumbers", event.target.checked));
  document.getElementById("screenShakeToggle").addEventListener("change", (event) => updateSetting("screenShake", event.target.checked));
  document.getElementById("reducedMotionToggle").addEventListener("change", (event) => updateSetting("reducedMotion", event.target.checked));
  document.getElementById("musicToggle").addEventListener("change", (event) => updateSetting("music", event.target.checked));
  document.getElementById("soundToggle").addEventListener("change", (event) => updateSetting("sound", event.target.checked));
  document.getElementById("fpsToggle").addEventListener("change", (event) => updateSetting("fps60", event.target.checked));
  document.getElementById("autoRestartToggle").addEventListener("change", (event) => updateSetting("autoRestart", event.target.checked));
  document.getElementById("musicVolumeSlider").addEventListener("input", (event) => updateSetting("musicVolume", parseFloat(event.target.value)));
  document.getElementById("soundVolumeSlider").addEventListener("input", (event) => updateSetting("soundVolume", parseFloat(event.target.value)));
  document.getElementById("exportSaveBtn").addEventListener("click", exportSave);
  document.getElementById("importSaveBtn").addEventListener("click", importSave);
  document.getElementById("tgSaveBtn").addEventListener("click", saveToTgCloud);
  document.getElementById("tgLoadBtn").addEventListener("click", loadFromTgCloud);
  canvas.addEventListener("click", (event) => {
    if (!game?.enemies?.length) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (event.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (event.clientY - rect.top) * (canvas.height / rect.height);
    const horn = game.enemies.find((enemy) => enemy.type === "horn" && enemy.hidden && Math.hypot(enemy.x - sx, enemy.y - sy) <= enemy.radius + 10);
    if (!horn) return;
    horn.hidden = false;
    horn.revealTimer = 6;
    addText("Обнаружен!", horn.x, horn.y - 22, "#ffcf66");
  });
  
  // Бронебойная разблокировка аудио для мобильных браузеров и WebView (Telegram/VK)
  const unlockAudio = () => {
    if (!audio.ctx || audio.ctx.state === "suspended") {
      audio.init();
      bgm.update();
    }
  };
  document.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
  document.addEventListener("touchend", unlockAudio, { once: true, passive: true });
  document.addEventListener("keydown", unlockAudio, { once: true, passive: true });
  document.addEventListener("click", unlockAudio, { once: true });

  document.addEventListener("click", (e) => {
    unlockAudio();
    if (e.target.tagName === "BUTTON" || e.target.classList.contains("card-slot") || e.target.classList.contains("card-item") || e.target.classList.contains("upgrade-info-btn") || e.target.classList.contains("tab-cell")) {
       if (e.target.disabled || e.target.classList.contains("disabled") || e.target.classList.contains("locked")) {
         audio.play("error");
       } else {
         audio.play("click");
       }
    }
    if (e.target.classList.contains("upgrade-info-btn") && e.target.dataset.infoType) {
      e.stopPropagation();
      openMenuInfo(e.target.dataset.infoType, e.target.dataset.infoId);
    }
  });
  document.getElementById("resetSaveBtn").addEventListener("click", resetSave);
  document.getElementById("debugCoinsBtn").addEventListener("click", debugAddCoins);
  document.getElementById("debugUltimatesBtn").addEventListener("click", debugUnlockUltimates);
  document.getElementById("debugWaveBtn").addEventListener("click", debugJumpWave10);
  document.getElementById("debugKillBtn").addEventListener("click", debugKillRun);
  document.querySelectorAll(".tab-cell").forEach((btn) => {
    btn.addEventListener("click", () => selectRunUpgradeCategory(btn.dataset.category));
  });
  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen.replace("Screen", "")));
  });
}

function checkWelcomeBack() {
  const now = Date.now();
  let showPopup = false;
  let offlineText = "";
  let dailyText = "";

  // Офлайн доход (считаем, если отсутствовал более 5 минут)
  const offlineMins = Math.floor(offlineMsCalculated / 60000);
  if (offlineMins >= 240) {
    const hours = Math.min(24, offlineMins / 60); // Максимум 24 часа
    // Базовая ставка: 10 монет/мин + 2 монеты за каждую пройденную лучшую волну
    const coinRatePerMin = Math.min(8.33, 0.2 + (progress.bestWave || 0) * 0.018); 
    const labMult = 1 + (progress.labs.levels.labCoins || 0) * 0.015;
    const earned = Math.floor(offlineMins * coinRatePerMin * labMult);
    
    if (earned > 0) {
      progress.coins += earned;
      const timeStr = hours < 1 ? `${offlineMins} мин.` : `${hours.toFixed(1)} ч.`;
      offlineText = `Тебя не было <strong>${timeStr}</strong>.<br>Башня заработала: <strong style="color:var(--accent-green);">+${earned} Монет</strong>`;
      showPopup = true;
    }
  }

  // Ежедневная награда
  const todayDate = new Date().toDateString();
  const lastDailyDate = progress.lastDailyTime ? new Date(progress.lastDailyTime).toDateString() : "";
  
  if (todayDate !== lastDailyDate) {
    if (lastDailyDate && (now - progress.lastDailyTime) / 86400000 > 2) progress.dailyStreak = 0; // Сброс стрика, если пропустил > 48ч
    
    const dayIndex = (progress.dailyStreak || 0) % 7;
    const reward = dailyRewards[dayIndex];
    progress[reward.type] += reward.amount;
    progress.lastDailyTime = now;
    progress.dailyStreak = (progress.dailyStreak || 0) + 1;
    
    dailyText = `Ежедневная награда (День ${(progress.dailyStreak - 1) % 7 + 1}):<br><strong style="color:var(--accent-pink);">${reward.text}</strong>`;
    showPopup = true;
  }

  if (showPopup) {
    saveProgress();
    document.getElementById("offlineReport").innerHTML = offlineText || "Офлайн доходов нет (прошло менее 5 минут).";
    document.getElementById("dailyRewardReport").innerHTML = dailyText;
    document.getElementById("welcomeOverlay").classList.remove("hidden");
  }
}

function checkDailyQuests() {
  const today = new Date().toDateString();
  if (progress.dailyQuests.date !== today) {
    progress.dailyQuests.date = today;
    const shuffled = [...dailyQuestPool].sort(() => Math.random() - 0.5).slice(0, 3);
    progress.dailyQuests.list = shuffled.map(q => ({ ...q, current: 0, claimed: false }));
    saveProgress();
  }
}

function trackDailyQuest(type, amount) {
  if (!progress.dailyQuests?.list) return;
  let changed = false;
  progress.dailyQuests.list.forEach(q => {
    if (q.type === type && !q.claimed && q.current < q.target) {
      q.current = Math.min(q.target, q.current + amount);
      changed = true;
    }
  });
  if (changed) saveProgress();
}

function selectRunUpgradeCategory(category) {
  if (!runUpgradeCategories[category]) return;
  if (category === activeRunUpgradeCategory) {
    toggleUpgradePanel();
    return;
  }
  saveRunUpgradeScrollPosition();
  activeRunUpgradeCategory = category;
  setUpgradePanelCollapsed(false);
  renderRunUpgradeTabs();
  renderRunUpgrades();
}

function saveRunUpgradeScrollPosition(category = activeRunUpgradeCategory) {
  const grid = document.getElementById("runUpgradeGrid");
  if (!grid || !category) return;
  runUpgradeScrollPositions[category] = grid.scrollTop;
}

function restoreRunUpgradeScrollPosition(category = activeRunUpgradeCategory) {
  const grid = document.getElementById("runUpgradeGrid");
  if (!grid || !category) return;
  grid.scrollTop = runUpgradeScrollPositions[category] || 0;
}

function finishRunUpgradeScrollRestore(category = activeRunUpgradeCategory) {
  restoreRunUpgradeScrollPosition(category);
  requestAnimationFrame(() => {
    restoreRunUpgradeScrollPosition(category);
    isRestoringRunUpgradeScroll = false;
  });
}

function setUpgradePanelCollapsed(collapsed) {
  const gameScreen = screens.game || document.getElementById("gameScreen");
  if (!gameScreen) return;
  gameScreen.classList.toggle("upgrade-panel-collapsed", collapsed);
  scheduleTowerPositionUpdate();
}

function toggleUpgradePanel() {
  const gameScreen = screens.game || document.getElementById("gameScreen");
  if (!gameScreen) return;
  setUpgradePanelCollapsed(!gameScreen.classList.contains("upgrade-panel-collapsed"));
}

function renderRunUpgradeTabs() {
  document.querySelectorAll(".tab-cell").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === activeRunUpgradeCategory);
  });
}

function renderMenu() {
  document.getElementById("menuBestWave").textContent = progress.bestWave;
  document.getElementById("menuCoins").textContent = Math.floor(progress.coins);
  document.getElementById("menuMedals").textContent = progress.medals;
  document.getElementById("menuPrestige").textContent = progress.prestige || 0;
  document.getElementById("menuCrystals").textContent = progress.crystals || 0;
  document.getElementById("menuStones").textContent = progress.powerStones || 0;
  document.getElementById("menuParts").textContent = progress.moduleParts || 0;
  const activeRun = hasActiveRun();
  const activeRunInfo = document.getElementById("activeRunInfo");
  const continueBtn = document.getElementById("continueBtn");
  const playBtn = document.getElementById("playBtn");
  continueBtn.classList.toggle("hidden", !activeRun);
  playBtn.innerHTML = `<span class="sprite-icon icon-play"></span> ${activeRun ? "Новый забег" : "Играть"}`;
  activeRunInfo.classList.toggle("hidden", !activeRun);
  if (activeRun) {
    activeRunInfo.innerHTML = `<strong>Активный забег на паузе</strong><span style="display:block; margin-top:4px; font-size:0.85rem; line-height:1.2;">Тир ${game.tier}, волна ${game.wave}, $${Math.floor(game.cash)}. Нажми "Продолжить забег", чтобы вернуться без сброса прогресса.</span>`;
  }

  const tierSelect = document.getElementById("tierSelect");
  const current = tierSelect.value || "1";
  tierSelect.innerHTML = "";
  [1, 2, 3].forEach((tier) => {
    const option = document.createElement("option");
    option.value = String(tier);
    option.textContent = getTierUnlocked(tier) ? `Тир ${tier}` : `Тир ${tier} закрыт`;
    option.disabled = !getTierUnlocked(tier);
    tierSelect.append(option);
  });
  tierSelect.value = getTierUnlocked(Number(current)) ? current : "1";
}

function hasActiveRun() {
  return Boolean(game && !game.ended);
}

function getTierUnlocked(tier) {
  if (tier === 1) return true;
  if (tier === 2) return (progress.tiers[1] || 0) >= 60;
  return (progress.tiers[2] || 0) >= 100;
}

function getModuleMult(stat) {
  let mult = 1.0;
  Object.values(progress.equippedModules).forEach(modId => {
    if (!modId) return;
    const mod = progress.modules.find(m => m.id === modId);
    if (mod) {
      const def = moduleTypes.find(t => t.id === mod.type);
      if (def && def.stat === stat) mult *= def.mults[mod.rarity];
    }
  });
  return mult;
}

function getEquippedUniqueModules() {
  return Object.values(progress.equippedModules)
    .map((modId) => progress.modules.find((mod) => mod.id === modId))
    .filter((mod) => mod?.unique);
}

function hasUniqueModule(id) {
  return getEquippedUniqueModules().some((mod) => mod.unique === id);
}

function getUniqueModulePower(id) {
  const mod = getEquippedUniqueModules().find((item) => item.unique === id);
  return mod ? [1, 1.35, 1.75, 2.25][mod.rarity] : 0;
}

function getPermanentStarterRunLevels() {
  return Object.entries(permanentStarterRunUpgradeMap).reduce((acc, [permanentId, link]) => {
    const permanentLevel = progress.permanent?.[permanentId] || 0;
    const levels = Math.min(link.cap, Math.floor(permanentLevel / link.every));
    if (levels > 0) acc[link.runId] = (acc[link.runId] || 0) + levels;
    return acc;
  }, {});
}

function applyStarterRunUpgradeLevels() {
  const starterLevels = getPermanentStarterRunLevels();
  Object.entries(starterLevels).forEach(([runId, levels]) => {
    for (let i = 0; i < levels; i += 1) {
      if ((game.runUpgrades[runId] || 0) >= (runUpgradeDefs.find((def) => def.id === runId)?.max || 0)) break;
      game.runUpgrades[runId] += 1;
      applyUpgradeStat(runId);
    }
  });
}

function startRun(options = {}) {
  cancelAnimationFrame(animationId);
  resizeGameCanvas();
  arenaGridOffset = { x: 0, y: 0 };
  activeRunUpgradeCategory = "attack";
  runUpgradeScrollPositions = {};
  const tier = Number(document.getElementById("tierSelect").value || 1);
  const p = progress.permanent;
  const eventMode = options.eventMode || null;
  const maxHealth = (100 + p.baseHealth * 8) * (1 + (progress.labs.levels.labHealth || 0) * 0.012) * (eventMode === "glassCore" ? balance.glassCoreHp : 1);
  const prestigeMult = 1 + (progress.prestige || 0) * 0.04;
  const medalDamage = progress.eventShop.medalDamage || 0;
  const medalStart = progress.eventShop.medalStart || 0;
  const labDamageMult = 1 + (progress.labs.levels.labDamage || 0) * 0.01;
  const labSpeedMult = 1 + (progress.labs.levels.labAttackSpeed || 0) * 0.006;
  const labStartCash = (progress.labs.levels.labStartingCash || 0) * 15;
  
  const getCardLevel = (id) => getCardLevelFromCount(progress.cards[id] || 0);
  const cardHpMult = progress.equippedCards.includes("cardHealth") ? 1 + getCardLevel("cardHealth") * 0.25 : 1;
  const cardDefenseBonus = progress.equippedCards.includes("cardDefense") ? getCardLevel("cardDefense") * 0.02 : 0;
  const cardFreeUpgradeBonus = progress.equippedCards.includes("cardFreeUpgrade") ? getCardLevel("cardFreeUpgrade") * 0.03 : 0;
  const cardExtraOrbs = progress.equippedCards.includes("cardExtraOrbs") ? getCardLevel("cardExtraOrbs") : 0;
  const cardWaveSkipBonus = progress.equippedCards.includes("cardWaveSkip") ? getCardLevel("cardWaveSkip") * 0.03 : 0;
  
  game = {
    ended: false,
    tier,
    eventMode,
    tierMult: 1 + (tier - 1) * 0.55,
    wave: 0,
    cash: (p.startingCash * 10 + medalStart * 15 + labStartCash) * getModuleMult("economy"),
    totalCash: 0,
    tower: {
      x: getCanvasEffectiveWidth() / 2,
      y: getCanvasEffectiveHeight() / 2,
      hp: maxHealth * cardHpMult * getModuleMult("health"),
      maxHp: maxHealth * cardHpMult * getModuleMult("health"),
      damage: (10 + p.baseDamage + medalDamage) * prestigeMult * labDamageMult * getModuleMult("damage"),
      attackSpeed: 1 * (1 + p.baseAttackSpeed * 0.015) * labSpeedMult * getModuleMult("speed"),
      range: 160,
      regen: 0,
      critChance: 0.05 + p.criticalChance * 0.005,
      critDamage: 2 + (progress.labs.levels.labCritDamage || 0) * 0.02,
      superCritChance: 0,
      superCritMult: 3,
      multiShot: 0,
      bounceTargets: 2,
      bounceRange: 220,
      damageMeter: 0,
      rapidFireChance: 0,
      rapidFireDuration: 0,
      rapidFireTimer: 0,
      knockback: 0,
      knockbackStrength: 26,
      cashBonus: 0,
      cashWave: 0,
      shotTimer: 0,
      lifesteal: (p.lifesteal || 0) * 0.001,
      absDefense: 0,
      defensePercent: Math.min(0.7, (p.defensePercent || 0) * 0.007 + cardDefenseBonus),
      thorns: (p.thorns || 0) * 0.02,
      bounceChance: 0,
      freeUpgradeChance: (p.freeUpgrade || 0) * 0.004 + cardFreeUpgradeBonus,
      runCoinBonus: 0,
      coinWaveChance: 0,
      orbCount: Math.min(8, cardExtraOrbs),
      orbSpeed: 1.5 + (p.orbSpeed || 0) * 0.08,
      orbAngle: 0,
      deathDefy: 0,
      interestRate: 0,
      maxInterest: 50,
      landmineChance: 0,
      landmineDamage: 2.0,
      packageChance: (p.packageChance || 0) * 0.005,
      packageMax: 0,
      shockWaveCooldown: 0,
      shockWaveTimer: 0,
      shockWaveSize: 260,
      shockWaveStrength: 34,
      enemyAttackSkip: 0,
      enemyHealthSkip: 0,
      waveSkipChance: cardWaveSkipBonus,
      energyShieldCharges: progress.equippedCards.includes("cardEnergyShield") ? 1 + Math.floor(getCardLevel("cardEnergyShield") / 3) : 0,
      secondWindReady: progress.equippedCards.includes("cardSecondWind"),
      deathRayTimer: progress.equippedCards.includes("cardDeathRay") ? Math.max(9, 18 - getCardLevel("cardDeathRay") * 1.5) : 0,
      deathRayCooldown: progress.equippedCards.includes("cardDeathRay") ? Math.max(9, 18 - getCardLevel("cardDeathRay") * 1.5) : 0,
      plasmaCannon: progress.equippedCards.includes("cardPlasmaCannon") ? getCardLevel("cardPlasmaCannon") * 0.05 : 0,
      energyNetDuration: progress.equippedCards.includes("cardEnergyNet") ? 0.8 + getCardLevel("cardEnergyNet") * 0.25 : 0,
      demonTimer: progress.equippedCards.includes("cardDemonMode") ? 4 + getCardLevel("cardDemonMode") * 2 : 0,
      landmineStunDuration: progress.equippedCards.includes("cardLandmineStun") ? 0.6 + getCardLevel("cardLandmineStun") * 0.2 : 0,
    },
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    missiles: [],
    landmines: [],
    effects: [],
    texts: [],
    runUpgrades: Object.fromEntries(runUpgradeDefs.map((u) => [u.id, 0])),
    stats: { kills: 0, bossKills: 0, runUpgrades: 0, cashEarned: 0, protocols: 0, milestones: [], playTime: 0 },
    waveState: "pause",
    reviveWave: 1,
    awaitingRevive: false,
    finalized: false,
    nextWaveTimer: 0.8,
    nextWaveDelay: 0.8,
    waveDuration: 0,
    waveTimeRemaining: 0,
    spawnQueue: [],
    spawnTimer: 0,
    uiTimer: 0,
    paused: false,
    ultimates: buildRunUltimates(),
    goldenCoreTimer: 0,
    blackHoleTimer: 0,
    blackHole: null,
    blackHoleDigestStacks: 0,
    deathWaveHealthBonus: 0,
    synergies: [],
    perks: [],
    perkMultipliers: { towerDamage: 1, enemyHp: 1, enemyDamage: 1, bossDamage: 1 },
    rewardMultipliers: { damage: 1 },
  };
  if (progress.equippedCards.includes("cardRegen")) {
    game.tower.regen *= 1 + getCardLevel("cardRegen") * 0.3;
  }
  if (progress.equippedCards.includes("cardFortress")) {
    game.tower.absDefense *= 1 + getCardLevel("cardFortress") * 0.2;
  }
  applyStarterRunUpgradeLevels();
  game.tower.hp = game.tower.maxHp;
  if (hasUniqueModule("orbitalAugmentation")) {
    game.tower.orbCount = Math.min(10, game.tower.orbCount + 1 + Math.floor(getUniqueModulePower("orbitalAugmentation")));
  }
  game.synergies = getActiveSynergies();
  if (hasSynergy("Заряженный фокус")) game.tower.critChance += 0.05;
  paused = false;
  updateSpeedButtons();
  document.getElementById("hudPlayPauseBtn").textContent = "⏸";
  clearRunOverlays();
  setUpgradePanelCollapsed(false);
  renderRunUpgradeTabs();
  renderRunUpgrades();
  updateHud();
  showScreen("game");
  positionTowerInVisibleArena();
  lastFrame = performance.now();
  animationId = requestAnimationFrame(gameLoop);
  bgm.update();
}

function buildRunUltimates() {
  return ultimateDefs
    .filter((def) => progress.ultimates[def.id]?.owned && progress.ultimates[def.id]?.enabled)
    .slice(0, ultimateLoadoutLimit)
    .map((def) => {
      const level = progress.ultimates[def.id].level;
      const nexusSync = hasUniqueModule("multiverseNexus") && ["goldenCore", "blackHole", "deathWave"].includes(def.id) ? 0.82 : 1;
      const maxTimer = Math.max(4, def.cooldown * Math.pow(0.94, level - 1) * nexusSync);
      return { ...def, level, timer: Math.max(1.5, def.cooldown * 0.5), maxTimer };
    });
}

function getSelectedUltimateIds() {
  return ultimateDefs.filter((def) => progress.ultimates[def.id]?.owned && progress.ultimates[def.id]?.enabled).map((def) => def.id);
}

function getActiveSynergies() {
  const selected = getSelectedUltimateIds();
  return synergyDefs.filter((synergy) => synergy.ids.every((id) => selected.includes(id)));
}

function hasSynergy(name) {
  return game?.synergies?.some((synergy) => synergy.name === name);
}

function spawnWave() {
  game.wave += 1;
  game.waveState = "spawning";
  game.spawnTimer = 0;
  game.spawnQueue = createWaveQueue(game.wave);

  // Вычисляем длительность волны
  const avgDelay = Math.max(balance.spawnMinDelay, balance.spawnBaseDelay - game.wave * balance.spawnDelayWaveReduction);
  let duration = game.spawnQueue.length * avgDelay * 3.6;
  if (duration < 5) duration = 5;
  game.waveDuration = duration;
  game.waveTimeRemaining = duration;

  if (game.wave % 10 === 0) {
    triggerShake();
    audio.play("boss");
    game.waveDuration += 15; // Даем боссу чуть больше времени
    game.waveTimeRemaining = game.waveDuration;
  }
  
  const perkInterval = Math.max(8, Math.round((20 - (progress.labs.levels.labPerkWaves || 0)) * (1 - (game.perkWaveReduction || 0))));
  if (game.wave > 0 && game.wave % perkInterval === 0) {
    offerPerks();
  }
  showWaveToast(game.wave % 10 === 0 ? `Босс-волна ${game.wave}` : `Волна ${game.wave}`);
}

function triggerFreeUpgrade() {
  if (!game || game.ended || Math.random() > game.tower.freeUpgradeChance) return;
  const defs = runUpgradeDefs;
  const target = defs[Math.floor(Math.random() * defs.length)];
  game.runUpgrades[target.id] += 1;
  game.stats.runUpgrades += 1;
  applyUpgradeStat(target.id);
  if (hasUniqueModule("blackHoleDigester")) {
    game.blackHoleDigestStacks = Math.min(12, (game.blackHoleDigestStacks || 0) + getUniqueModulePower("blackHoleDigester"));
  }
  addText(`Бесплатно: ${target.name}`, game.tower.x, game.tower.y - 60, "#55ecff");
  renderRunUpgrades();
}

function setWavePause(seconds, text = "") {
  const waveAccel = progress.equippedCards.includes("cardWaveAccelerator") ? getCardLevelFromCount(progress.cards.cardWaveAccelerator || 0) * 0.08 : 0;
  seconds *= Math.max(0.45, 1 - waveAccel);
  game.waveState = "pause";
  game.nextWaveTimer = seconds;
  game.nextWaveDelay = seconds;
  triggerFreeUpgrade();

  if (game.tower.cashWave > 0) {
    const earned = game.tower.cashWave * (1 + game.tower.cashBonus);
    game.cash += earned;
    game.totalCash += earned;
    game.stats.cashEarned += earned;
    addText(`+$${Math.floor(earned)} волна`, game.tower.x, game.tower.y - 72, "#24b47e");
  }
  if (game.tower.coinWaveChance > 0 && Math.random() < game.tower.coinWaveChance) {
    progress.coins += 1;
    saveProgress();
    addText("+1 монета/волна", game.tower.x, game.tower.y - 88, "#24b47e");
  }

  if (game.tower.waveSkipChance > 0 && game.wave > 0 && game.wave % 10 !== 9 && Math.random() < game.tower.waveSkipChance) {
    game.wave += 1;
    const skipCash = Math.ceil((10 + game.wave * 2.5) * (1 + game.tower.cashBonus));
    game.cash += skipCash;
    game.totalCash += skipCash;
    game.stats.cashEarned += skipCash;
    addText(`Пропуск волны +$${skipCash}`, game.tower.x, game.tower.y - 96, "#ffb020");
    showWaveToast(`Волна ${game.wave} пропущена`);
  }

  // Логика Инвестиций (процент за волну)
  if (game.tower.interestRate > 0) {
    const earned = Math.min(game.tower.maxInterest, game.cash * game.tower.interestRate);
    if (earned > 0) {
      game.cash += earned;
      game.totalCash += earned;
      addText(`+$${Math.floor(earned)} инвест.`, game.tower.x, game.tower.y - 80, "#24b47e");
    }
  }

  if (Math.random() < game.tower.packageChance) {
    const healAmount = game.tower.maxHp * 0.35;
    const maxOverheal = game.tower.maxHp * (1 + game.tower.packageMax);
    if (game.tower.hp < maxOverheal) {
      game.tower.hp = Math.min(maxOverheal, game.tower.hp + healAmount);
      if (hasUniqueModule("galaxyCompressor")) {
        const cut = 2 + getUniqueModulePower("galaxyCompressor") * 2;
        game.ultimates.forEach((ultimate) => (ultimate.timer = Math.max(0.5, ultimate.timer - cut)));
      }
      addEffect("time", game.tower.x, game.tower.y, 0.8, "#ffb020");
      addText("Оверхил!", game.tower.x, game.tower.y - 60, "#ffb020");
    }
  }

  if (text) showWaveToast(text);
}

function getWaveEnemyCount(wave) {
  const balanceLevel = progress.equippedCards.includes("cardEnemyBalance") ? getCardLevelFromCount(progress.cards.cardEnemyBalance || 0) : 0;
  return Math.floor((balance.waveEnemyBase + wave * balance.waveEnemyGrowth + Math.max(0, wave - 8) * 0.22) * (1 + balanceLevel * 0.08));
}

function createWaveQueue(wave) {
  if (wave % 50 === 0) return [{ type: "boss", mega: true }];
  if (wave % 10 === 0) return game.eventMode === "doubleBoss" ? ["boss", "boss"] : ["boss"];
  const queue = [];
  const count = getWaveEnemyCount(wave);
  const pool = game.eventMode === "scoutRush" ? ["scout", "scout", "scout", "grunt"] : getWavePool(wave);
  for (let i = 0; i < count; i += 1) {
    queue.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  if (wave >= 5 && wave % 5 === 0) {
    const eliteType = pool[Math.floor(Math.random() * pool.length)];
    queue.splice(Math.floor(queue.length / 2), 0, { type: eliteType, elite: true });
  }
  return queue;
}

function getWavePool(wave) {
  const pool = ["grunt", "grunt", "scout"];
  if (wave >= 3) pool.push("brute");
  if (wave >= 5) pool.push("shooter");
  if (wave >= 7) pool.push("splitter");
  if (wave >= 9) pool.push("shield");
  if (wave >= 12) pool.push("vampire");
  if (wave >= 15) pool.push("armored");
  if (wave >= 8) pool.push("assassin");
  if (wave >= 18) pool.push("healer");
  if (wave >= 14) pool.push("horn");
  return pool;
}

function spawnEnemy(type, override = {}) {
  if (typeof type === "object") {
    override = type;
    type = override.type;
  }
  const def = enemyDefs[type];
  const spawnPoint = getSpawnPoint();
  const angle = override.angle ?? Math.atan2(game.tower.y - spawnPoint.y, game.tower.x - spawnPoint.x);
  const bossIndex = Math.max(1, Math.floor(game.wave / 10));
  
  let eventMult = game.eventMode === "tournament" ? Math.pow(1.02, game.wave) : 1;
  const hpSkip = type === "boss" ? 0 : game.tower.enemyHealthSkip;
  const scale = (type === "boss" ? Math.pow(balance.bossHpGrowth, bossIndex - 1) : Math.pow(balance.waveHpGrowth, Math.max(0, game.wave - 1)) * (1 - hpSkip)) * game.tierMult * eventMult;
  
  const enemy = {
    id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    name: def.name,
    x: override.x ?? spawnPoint.x,
    y: override.y ?? spawnPoint.y,
    angle,
    angularVelocity: 0,
    hp: (override.hp ?? def.hp) * scale * (type === "boss" ? 1 : game.perkMultipliers.enemyHp),
    maxHp: (override.hp ?? def.hp) * scale * (type === "boss" ? 1 : game.perkMultipliers.enemyHp),
    speed: (override.speed ?? def.speed) * (1 + game.wave * balance.waveSpeedGrowth) * (type === "boss" ? 0.95 : 1) * (game.eventMode === "overclocked" ? balance.overclockedSpeed : 1),
    reward: Math.ceil((override.reward ?? def.reward) * (type === "boss" ? (1 + game.tier * balance.bossTierReward) * (1 + bossIndex * balance.bossRewardGrowth) : 1) * (game.eventMode === "glassCore" ? balance.glassCoreCash : 1) * (1 + (progress.equippedCards.includes("cardEnemyBalance") ? getCardLevelFromCount(progress.cards.cardEnemyBalance || 0) * 0.04 : 0))),
    damage: Math.ceil(def.damage * (type === "boss" ? Math.pow(balance.bossDamageGrowth, bossIndex - 1) : Math.pow(balance.waveDamageGrowth, game.wave - 1)) * game.tierMult * eventMult * game.perkMultipliers.enemyDamage * (1 - game.tower.enemyAttackSkip)),
    radius: override.radius ?? def.radius,
    color: def.color,
    slow: 1,
    shieldHits: type === "shield" ? 3 : 0,
    shootTimer: 1.2 + Math.random(),
    elite: Boolean(override.elite),
    mega: Boolean(override.mega),
    reached: false,
  };
  if (enemy.elite) {
    enemy.name = `Элитный ${enemy.name}`;
    enemy.hp *= 2.6;
    enemy.maxHp *= 2.6;
    enemy.speed *= 1.08;
    enemy.damage = Math.ceil(enemy.damage * 1.7);
    enemy.reward = Math.ceil(enemy.reward * 3.2);
    enemy.radius += 4;
  }
  if (type === "boss" && game.tower.plasmaCannon > 0) {
    enemy.hp *= Math.max(0.35, 1 - game.tower.plasmaCannon);
  }
  if (type === "boss" && game.tower.energyNetDuration > 0) {
    enemy.netTimer = game.tower.energyNetDuration;
    enemy.slow = Math.min(enemy.slow, 0.08);
  }
  if (enemy.mega) {
    enemy.name = "Множитель";
    enemy.hp *= 8.4;
    enemy.maxHp *= 8.4;
    enemy.speed *= 0.9;
    enemy.damage = Math.ceil(enemy.damage * 1.8);
    enemy.reward = Math.ceil(enemy.reward * 3.4);
    enemy.radius += 22;
  }
  if (enemy.type === "horn") {
    enemy.hidden = true;
    enemy.revealed = false;
    enemy.revealTimer = 0;
    enemy.angle += Math.random() * TWO_PI;
  }
  game.enemies.push(enemy);
}

function getSpawnPoint() {
  const width = getCanvasEffectiveWidth();
  const height = getCanvasEffectiveHeight();
  const margin = 34;
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: Math.random() * width, y: -margin };
  if (side === 1) return { x: width + margin, y: Math.random() * height };
  if (side === 2) return { x: Math.random() * width, y: height + margin };
  return { x: -margin, y: Math.random() * height };
}

function gameLoop(now) {
  if (!game || game.ended) return;
  
  const targetFPS = progress.settings.fps60 ? 60 : 30;
  const frameDelay = 1000 / targetFPS;
  const elapsed = now - lastFrame;
  
  if (elapsed < frameDelay) {
    animationId = requestAnimationFrame(gameLoop);
    return;
  }
  
  const dt = Math.min(0.05, elapsed / 1000);
  lastFrame = now - (elapsed % frameDelay);

  if (!paused) {
    let timeToProcess = dt * gameSpeed * (game.perkGameSpeed || 1) * (1 + (progress.labs.levels.labGameSpeed || 0) * 0.01);
    while (timeToProcess > 0 && game && !game.ended) {
      const step = Math.min(0.05, timeToProcess);
      updateGame(step);
      timeToProcess -= step;
    }
  }
  if (!game || game.ended) return;
  drawGame();
  animationId = requestAnimationFrame(gameLoop);
}

function updateGame(dt) {
  if (!game || game.ended) return;
  if (game.deathSequence) {
    updateVisualFeedback(dt);
    game.deathSequence.timer -= dt;
    if (game.deathSequence.timer <= 0) {
      endRun(false, { finalize: false });
      return;
    }
    return;
  }

  if (game.waveState === "reward") {
    updateVisualFeedback(dt);
    updateHud();
    return;
  }

  if (game.waveState === "pause") {
    game.nextWaveTimer -= dt;
    if (game.nextWaveTimer <= 0) spawnWave();
  }

  if (game.waveState === "spawning" || game.waveState === "fighting") {
    game.waveTimeRemaining -= dt;

    if (game.waveState === "spawning") {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0 && game.spawnQueue.length) {
        spawnEnemy(game.spawnQueue.shift());
        game.spawnTimer = Math.max(balance.spawnMinDelay, balance.spawnBaseDelay - game.wave * balance.spawnDelayWaveReduction);
      }
      if (!game.spawnQueue.length) game.waveState = "fighting";
    }

    // Завершение времени волны, переход в фазу подготовки
    if (game.waveTimeRemaining <= 0) {
      setWavePause(game.waveDuration / 2, `Подготовка...`);
    }
  }

  if (game.goldenCoreTimer > 0) {
    game.goldenCoreTimer -= dt;
  }
  if (game.tower.rapidFireTimer > 0) game.tower.rapidFireTimer -= dt;
  if (game.tower.demonTimer > 0) game.tower.demonTimer -= dt;
  if (game.tower.deathRayCooldown > 0) {
    game.tower.deathRayTimer -= dt;
    if (game.tower.deathRayTimer <= 0) triggerDeathRay();
  }
  if (game.blackHoleTimer > 0) {
    game.blackHoleTimer -= dt;
    if (game.blackHoleTimer <= 0) game.blackHole = null;
  }

  game.stats.playTime += dt;
  updateEnemies(dt);
  updateProjectiles(dt);
  updateEnemyProjectiles(dt);
  updateMissiles(dt);
  updateLandmines(dt);
  updateUltimates(dt);
  updateShockWave(dt);

  if (game.tower.regen > 0 && game.tower.hp > 0 && game.tower.hp < game.tower.maxHp) {
    const wormhole = getUniqueModulePower("wormholeRedirector");
    const regenCap = wormhole > 0 ? game.tower.maxHp * (1 + game.tower.packageMax * Math.min(1, wormhole * 0.35)) : game.tower.maxHp;
    game.tower.hp = Math.min(regenCap, game.tower.hp + game.tower.regen * dt);
  }

  towerShoot(dt);

  if (game.tower.hp <= 0) {
    if (tryPreventTowerDeath()) return;
    beginTowerDeathSequence();
    return;
  }
  updateHud();
  game.uiTimer -= dt;
  if (game.uiTimer <= 0) {
    checkCompletedLabs();
    renderRunUpgrades();
    game.uiTimer = 0.35;
  }
}

function tryPreventTowerDeath() {
  if (game.tower.energyShieldCharges > 0) {
    game.tower.energyShieldCharges -= 1;
    game.tower.hp = Math.max(1, game.tower.maxHp * 0.08);
    addEffect("time", game.tower.x, game.tower.y, 0.8, "#55ecff");
    addText("Энергощит!", game.tower.x, game.tower.y - 76, "#55ecff");
    return true;
  }
  if (game.tower.secondWindReady) {
    const lvl = getCardLevelFromCount(progress.cards.cardSecondWind || 0);
    game.tower.secondWindReady = false;
    game.tower.hp = game.tower.maxHp * (0.25 + lvl * 0.1);
    addEffect("reward", game.tower.x, game.tower.y, 1.0, "#ffb020");
    addText("Второе дыхание!", game.tower.x, game.tower.y - 76, "#ffb020");
    return true;
  }
  return false;
}

function triggerTowerDamageFeedback(amount = 0, color = "#ff5c6c") {
  if (!game?.tower) return;
  const shapeId = progress?.customization?.shape || "shape_hex";
  const intensity = Math.min(1.45, Math.max(0.55, amount / Math.max(1, game.tower.maxHp) * 7));
  const t = game.tower;
  t.hitTimer = 0.36;
  t.hitMax = 0.36;
  t.hitIntensity = intensity;
  t.hitColor = color;
  t.hitAngle = Math.atan2(t.y - (game.lastTowerHitY ?? t.y - 1), t.x - (game.lastTowerHitX ?? t.x));
  if (shapeId === "shape_square") t.hitSpin = (t.hitSpin || 0) + 0.35 * intensity;
  if (shapeId === "shape_triangle") t.hitSpin = (t.hitSpin || 0) - 0.48 * intensity;
  if (shapeId === "shape_octa") t.facetPulse = 0.42;
  if (shapeId === "shape_substance") t.blobImpact = 0.46;
  if (shapeId === "shape_pulsar") t.facetPulse = 0.62;
  if (shapeId === "shape_ring") t.hitSpin = (t.hitSpin || 0) + 0.22 * intensity;
  if (shapeId === "shape_crystal") t.facetPulse = 0.7;
  if (shapeId === "shape_blade") t.hitSpin = (t.hitSpin || 0) + 0.72 * intensity;
  if (shapeId === "shape_void") t.blobImpact = 0.36;
}

function beginTowerDeathSequence() {
  if (!game || game.deathSequence) return;
  game.deathSequence = { timer: 1.65, maxTimer: 1.65 };
  game.reviveWave = Math.max(1, game.wave || 1);
  game.tower.hp = 0;
  game.tower.hitTimer = 0;
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.missiles = [];
  game.landmines = [];
  addEffect("towerExplosion", game.tower.x, game.tower.y, 1.25, "#ff5c6c");
  addEffect("towerShock", game.tower.x, game.tower.y, 0.95, "#55ecff");
  addText("Критический взрыв", game.tower.x, game.tower.y - 72, "#ffb020", { life: 1.15, size: 22, floatSpeed: 18 });
  triggerShake();
  audio.play("explosion");
}

function triggerDeathRay() {
  const lvl = getCardLevelFromCount(progress.cards.cardDeathRay || 0);
  const angle = Math.random() * TWO_PI;
  const width = 22 + lvl * 5;
  const origin = { x: game.tower.x, y: game.tower.y };
  game.enemies.slice().forEach((enemy) => {
    const px = enemy.x - origin.x;
    const py = enemy.y - origin.y;
    const forward = px * Math.cos(angle) + py * Math.sin(angle);
    const side = Math.abs(px * Math.sin(angle) - py * Math.cos(angle));
    if (forward > -40 && forward < 220 + lvl * 16 && side < width) {
      const dmg = enemy.type === "boss" ? enemy.maxHp * (0.015 + lvl * 0.006) : enemy.maxHp * (0.34 + lvl * 0.05);
      damageEnemy(enemy, dmg, "deathRay");
    }
  });
  addEffect("beam", game.tower.x, game.tower.y, 0.18, "#ff5c9b", angle);
  game.tower.deathRayTimer = game.tower.deathRayCooldown;
}

function updateShockWave(dt) {
  if (!game.tower.shockWaveCooldown) return;
  game.tower.shockWaveTimer -= dt;
  if (game.tower.shockWaveTimer > 0) return;
  const strength = game.tower.shockWaveStrength || (34 + game.runUpgrades.shockWave * 0.8);
  game.enemies.forEach((enemy) => {
    if (enemy.type === "boss") return;
    const dist = Math.hypot(enemy.x - game.tower.x, enemy.y - game.tower.y);
    if (dist <= Math.max(130, game.tower.shockWaveSize * 0.62)) {
      knockbackEnemy(enemy, strength);
      enemy.slow = Math.min(enemy.slow, 0.72);
    }
  });
  addEffect("shockWave", game.tower.x, game.tower.y, 0.55, "#55ecff");
  game.tower.shockWaveTimer = Math.max(2.4, game.tower.shockWaveCooldown);
}

function updateEnemies(dt) {
  if (game.blackHole) {
    const pull = 95 + game.blackHole.level * 8;
    game.enemies.forEach((enemy) => {
      if (enemy.type === "boss") return;
      const dx = game.blackHole.x - enemy.x;
      const dy = game.blackHole.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist <= game.blackHole.radius) {
        enemy.x += (dx / dist) * pull * dt;
        enemy.y += (dy / dist) * pull * dt;
        enemy.inBlackHole = true;
        enemy.slow = Math.min(enemy.slow, 0.55);
      } else {
        enemy.inBlackHole = false;
      }
    });
  } else {
    game.enemies.forEach((enemy) => (enemy.inBlackHole = false));
  }

  const garlicLevel = progress.labs.levels.labGarlicThorns || 0;
  if (garlicLevel > 0 && game.tower.thorns > 0) {
    game.enemies.forEach((enemy) => {
      if (enemy.type === "vampire" && Math.hypot(enemy.x - game.tower.x, enemy.y - game.tower.y) < 125) {
        damageEnemy(enemy, game.tower.damage * game.tower.thorns * garlicLevel * 0.05 * dt);
      }
    });
  }

  // Обработка Сфер
  if (game.tower.orbCount > 0) {
    game.tower.orbAngle += (game.tower.orbSpeed * 0.72) * dt;
    const orbRadius = 270;
    for (let i = 0; i < game.tower.orbCount; i++) {
      const angle = game.tower.orbAngle + (i / game.tower.orbCount) * TWO_PI;
      const ox = game.tower.x + Math.cos(angle) * orbRadius;
      const oy = game.tower.y + Math.sin(angle) * orbRadius;
      game.enemies.forEach(e => {
        if (Math.hypot(e.x - ox, e.y - oy) < e.radius + 8 && (e.orbHitTimer || 0) <= 0) {
          const orbDamage = e.type === "boss"
            ? game.tower.damage * (4 + game.tower.orbCount * 0.45)
            : game.tower.damage * (3 + game.tower.orbCount * 0.8) * (e.elite ? 0.7 : 1);
          damageEnemy(e, orbDamage);
          e.orbHitTimer = 1.0;
        }
      });
    }
  }

  game.enemies.forEach((enemy) => {
    let targetSlow = 1;
    if (progress.equippedCards.includes("cardSlow")) targetSlow -= getCardLevelFromCount(progress.cards["cardSlow"] || 0) * 0.05;
    
    enemy.slow = Math.min(targetSlow, enemy.slow + dt * 0.5);
    enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
    enemy.orbHitTimer = Math.max(0, (enemy.orbHitTimer || 0) - dt);
    const dx = game.tower.x - enemy.x;
    const dy = game.tower.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (enemy.type === "shooter" && dist < 145) {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0) {
        game.enemyProjectiles.push({
          x: enemy.x,
          y: enemy.y,
          damage: enemy.damage,
          speed: enemy.elite ? 245 : 205,
          color: enemy.elite ? "#ffb020" : "#7d5ce3",
        });
        enemy.shootTimer = 1.85;
        addEffect("shotHit", enemy.x, enemy.y, 0.2, enemy.elite ? "#ffb020" : "#7d5ce3");
      }
      return;
    }

    if (enemy.type === "assassin") {
      enemy.spiralPhase = (enemy.spiralPhase || Math.random() * TWO_PI) + dt * 3.2;
      enemy.x += Math.cos(enemy.spiralPhase) * 44 * dt;
      enemy.y += Math.sin(enemy.spiralPhase) * 44 * dt;
    }
    if (enemy.type === "horn" && enemy.revealTimer > 0) enemy.revealTimer -= dt;
    const step = enemy.speed * enemy.slow * dt;
    enemy.x += (dx / dist) * step;
    enemy.y += (dy / dist) * step;

    if (enemy.type === "healer") {
      if (enemy.healTimer === undefined) enemy.healTimer = 1.0;
      enemy.healTimer -= dt;
      if (enemy.healTimer <= 0) {
        let healed = false;
        game.enemies.forEach(e => {
          if (e !== enemy && e.hp < e.maxHp && Math.hypot(e.x - enemy.x, e.y - enemy.y) < 80) {
            e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.15);
            addEffect("time", e.x, e.y, 0.4, "#24b47e");
            healed = true;
          }
        });
        if (healed) {
          addEffect("time", enemy.x, enemy.y, 0.6, "#24b47e");
          audio.play("coin"); 
        }
        enemy.healTimer = 2.0;
      }
    }

    // Для треугольников (разведчик/ассасин) всегда держим острый угол строго к башне
    if (enemy.type === "scout" || enemy.type === "assassin" || enemy.type === "horn") {
      enemy.angle = Math.atan2(dy, dx) + Math.PI / 2;
      enemy.angularVelocity = 0;
      return;
    }

    // Плавное вращение (физика направления и трение)
    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - (enemy.angle || 0);
    while (angleDiff > Math.PI) angleDiff -= TWO_PI;
    while (angleDiff < -Math.PI) angleDiff += TWO_PI;
    
    if (enemy.angularVelocity === undefined) enemy.angularVelocity = 0;
    enemy.angularVelocity += angleDiff * dt * 4.0; // Легкая тяга повернуться к башне

    enemy.angle = (enemy.angle || 0) + enemy.angularVelocity * dt;
    enemy.angularVelocity *= 0.85; // Затухание (трение) вращения
  });

  // Кэшируем полигоны для физики SAT
  game.enemies.forEach(e => e.poly = getEnemyPolygon(e));

  // Столкновения мобов друг с другом (Точная физика SAT) - 2 итерации для жесткости
  for (let iter = 0; iter < 2; iter++) {
    for (let i = 0; i < game.enemies.length; i++) {
      for (let j = i + 1; j < game.enemies.length; j++) {
        const e1 = game.enemies[i];
        const e2 = game.enemies[j];
        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        // Broad-phase: учитываем выпирающие углы
        if (Math.hypot(dx, dy) > (e1.radius + e2.radius) * 1.5 + 4) continue; 
  
        const mtv = satCollide(e1.poly, e2.poly);
        if (mtv) {
          e1.x -= mtv.axis.x * mtv.overlap * 0.5;
          e1.y -= mtv.axis.y * mtv.overlap * 0.5;
          e2.x += mtv.axis.x * mtv.overlap * 0.5;
          e2.y += mtv.axis.y * mtv.overlap * 0.5;
  
          // Вычисляем момент силы (Torque) на основе смещения от центра
          const cross = dx * mtv.axis.y - dy * mtv.axis.x;
          const torque = cross * mtv.overlap * 0.06;
          e1.angularVelocity += torque;
          e2.angularVelocity += torque;
  
          e1.poly = getEnemyPolygon(e1);
          e2.poly = getEnemyPolygon(e2);
        }
      }
    }
  }

  // Столкновения с башней и мили-атака
  const shapeDef = cosmeticDefs.shapes.find(s => s.id === progress?.customization?.shape) || cosmeticDefs.shapes[0];
  const towerRadius = 22; // Соответствует визуальному телу башни
  const towerPoly = Array.from({length: shapeDef.sides}).map((_, i) => ({
    x: game.tower.x + Math.cos(-Math.PI / shapeDef.sides + i * TWO_PI / shapeDef.sides) * towerRadius,
    y: game.tower.y + Math.sin(-Math.PI / shapeDef.sides + i * TWO_PI / shapeDef.sides) * towerRadius
  }));

  game.enemies.forEach(enemy => {
    if (enemy.meleeTimer === undefined) enemy.meleeTimer = 0;
    if (enemy.meleeTimer > 0) enemy.meleeTimer -= dt;

    const dx = game.tower.x - enemy.x;
    const dy = game.tower.y - enemy.y;
    if (Math.hypot(dx, dy) > (towerRadius + enemy.radius) * 1.5 + 4) return;

    const mtv = satCollide(towerPoly, enemy.poly);
    if (mtv) {
      enemy.x += mtv.axis.x * (mtv.overlap + 0.1);
      enemy.y += mtv.axis.y * (mtv.overlap + 0.1);
      
      const cross = dx * mtv.axis.y - dy * mtv.axis.x;
      const torque = cross * mtv.overlap * 0.08;
      enemy.angularVelocity += torque;
      
      enemy.poly = getEnemyPolygon(enemy);

      if (enemy.meleeTimer <= 0) {
        audio.play("baseHit");
        const actualDamage = Math.max(1, (enemy.damage - game.tower.absDefense)) * Math.max(0.1, (1 - game.tower.defensePercent));
        
        const hitDamage = enemy.type === "horn" ? game.tower.maxHp * 0.5 : actualDamage;
        if (game.tower.hp - hitDamage <= 0 && Math.random() < game.tower.deathDefy) {
          game.tower.hp = 1;
          addText("Игнор смерти!", game.tower.x, game.tower.y - 80, "#ff5c9b");
        } else {
          game.tower.hp -= hitDamage;
          if (game.tower.hp <= 0 && tryPreventTowerDeath()) enemy.meleeTimer = 1.0;
        }
        game.lastTowerHitX = enemy.x;
        game.lastTowerHitY = enemy.y;
        triggerTowerDamageFeedback(hitDamage, enemy.color || "#ff5c6c");

        if (game.tower.thorns > 0) {
          damageEnemy(enemy, game.tower.damage * game.tower.thorns);
        }

        if (enemy.type === "vampire") enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.damage * 1.4);
        addEffect("hit", game.tower.x, game.tower.y, 0.35, "#ff5c6c");
        addText(`-${Math.ceil(hitDamage)}`, game.tower.x, game.tower.y - 48, "#ff5c6c");
        if (enemy.type === "horn") enemy.hp = 0;
        triggerShake();
        enemy.meleeTimer = 1.0; 
      }
    }
  });
  game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
}

function towerShoot(dt) {
  game.tower.shotTimer -= dt;
  if (game.tower.shotTimer > 0) return;
  const rapid = game.tower.rapidFireTimer > 0 ? 0.42 : 1;
  const targets = findTargets(1 + (Math.random() < game.tower.multiShot ? 1 : 0));
  if (!targets.length) return;
  const projectileStyle = progress.customization.shape === "shape_substance" ? "substance" : "normal";
  const shootSound = projectileStyle === "substance" ? "substanceShoot" : "shoot";
  audio.play(shootSound);
  if (projectileStyle === "substance") addEffect("spit", game.tower.x, game.tower.y, 0.18, "#8cff72");

  targets.forEach((target) => {
    const isCrit = Math.random() < game.tower.critChance;
    const isSuperCrit = isCrit && Math.random() < game.tower.superCritChance;
    let damage = game.tower.damage * game.perkMultipliers.towerDamage * (isCrit ? game.tower.critDamage : 1) * (isSuperCrit ? game.tower.superCritMult : 1);
    damage *= game.tower.demonTimer > 0 ? 1.6 : 1;
    if (game.tower.damageMeter > 0) {
      const dist = Math.hypot(target.x - game.tower.x, target.y - game.tower.y);
      damage *= 1 + (dist / 100) * game.tower.damageMeter;
    }
    if (target.type === "boss") damage *= (1 + progress.permanent.bossDamageBonus * 0.03 + (progress.labs.levels.labBossDamage || 0) * 0.02) * game.perkMultipliers.bossDamage;
    else if (game.perkMultipliers.bossDamage > 1) damage *= 0.9; // Пенальти для перка "Убийца боссов"
    game.projectiles.push({
      x: game.tower.x,
      y: game.tower.y,
      target,
      speed: 520 * (1 + (progress.labs.levels.labLightSpeed || 0) * 0.12),
      damage,
      crit: isCrit,
      superCrit: isSuperCrit,
      criticalCoin: isCrit && progress.equippedCards.includes("cardCriticalCoin"),
      style: projectileStyle,
    });
  });

  if (game.tower.rapidFireChance > 0 && Math.random() < game.tower.rapidFireChance) {
    game.tower.rapidFireTimer = Math.max(game.tower.rapidFireTimer, game.tower.rapidFireDuration);
  }

  if (Math.random() < game.tower.landmineChance) {
    const angle = Math.random() * TWO_PI;
    const r = 40 + Math.random() * 160;
    game.landmines.push({ x: game.tower.x + Math.cos(angle)*r, y: game.tower.y + Math.sin(angle)*r, damage: game.tower.damage * game.tower.landmineDamage });
  }

  game.tower.shotTimer = (1 / game.tower.attackSpeed) * rapid * (game.tower.demonTimer > 0 ? 0.72 : 1);
}

function findTargets(count) {
  return [...game.enemies]
    .map((enemy) => ({ enemy, dist: Math.hypot(enemy.x - game.tower.x, enemy.y - game.tower.y) }))
    .filter((item) => item.dist <= game.tower.range && !(item.enemy.type === "horn" && item.enemy.hidden))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count)
    .map((item) => item.enemy);
}

function updateProjectiles(dt) {
  game.projectiles.forEach((p) => {
    if (!game.enemies.includes(p.target)) {
      p.dead = true;
      return;
    }
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = p.speed * dt;
    if (dist <= step + p.target.radius) {
      if (p.criticalCoin) p.target.criticalCoinBonus = true;
      damageEnemy(p.target, p.damage, "projectile", { crit: p.crit, superCrit: p.superCrit });
      
      if (game.tower.lifesteal > 0 && game.tower.hp < game.tower.maxHp) {
        game.tower.hp = Math.min(game.tower.maxHp, game.tower.hp + p.damage * game.tower.lifesteal);
      }

      if (p.bounces === undefined) p.bounces = 0;
      let bounced = false;
      if (p.bounces < game.tower.bounceTargets && Math.random() < game.tower.bounceChance) {
        const newTargets = game.enemies.filter(e => e !== p.target && Math.hypot(e.x - p.x, e.y - p.y) < game.tower.bounceRange);
        if (newTargets.length > 0) {
          p.target = newTargets[Math.floor(Math.random() * newTargets.length)];
          p.bounces += 1;
          if (hasUniqueModule("astralDeliverance")) p.damage *= 1 + 0.18 * getUniqueModulePower("astralDeliverance");
          bounced = true;
        }
      }

      if (!bounced) {
      // Микро-импульс (отталкивание при попадании)
      audio.play(p.superCrit ? "explosion" : (p.crit ? "crit" : "hit"));
      p.target.x += (dx / dist) * (p.superCrit ? 10 : (p.crit ? 6 : 3));
      p.target.y += (dy / dist) * (p.superCrit ? 10 : (p.crit ? 6 : 3));
      p.target.angularVelocity += (Math.random() - 0.5) * (p.superCrit ? 18 : (p.crit ? 12 : 6));

      if (Math.random() < game.tower.knockback && p.target.type !== "armored") knockbackEnemy(p.target, game.tower.knockbackStrength);
      addEffect(p.superCrit ? "superCrit" : (p.crit ? "crit" : "spark"), p.target.x, p.target.y, 0.22, p.superCrit ? "#ff4444" : (p.crit ? "#ffb020" : "#2b8cff"));
      p.dead = true;
      }
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  });
  game.projectiles = game.projectiles.filter((p) => !p.dead);
}

function updateEnemyProjectiles(dt) {
  game.enemyProjectiles.forEach((p) => {
    const dx = game.tower.x - p.x;
    const dy = game.tower.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = p.speed * dt;
    if (dist <= step + 22) {
      audio.play("baseHit");
      const actualDamage = Math.max(1, (p.damage - game.tower.absDefense)) * Math.max(0.1, (1 - game.tower.defensePercent));
      if (game.tower.hp - actualDamage <= 0 && Math.random() < game.tower.deathDefy) {
        game.tower.hp = 1;
        addText("Игнор смерти!", game.tower.x, game.tower.y - 80, "#ff5c9b");
      } else {
        game.tower.hp -= actualDamage;
        if (game.tower.hp <= 0) tryPreventTowerDeath();
      }
      game.lastTowerHitX = p.x;
      game.lastTowerHitY = p.y;
      triggerTowerDamageFeedback(actualDamage, p.color || "#ff5c6c");
      addEffect("hit", game.tower.x, game.tower.y, 0.28, p.color);
      addText(`-${Math.ceil(actualDamage)}`, game.tower.x, game.tower.y - 48, "#ff5c6c");
      triggerShake();
      p.dead = true;
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  });
  game.enemyProjectiles = game.enemyProjectiles.filter((p) => !p.dead);
}

function damageEnemy(enemy, amount, source = "", hit = {}) {
  let finalDamage = amount;
  if (enemy.shieldHits > 0) {
    finalDamage *= 0.35;
    enemy.shieldHits -= 1;
  }
  enemy.hp -= finalDamage;
  if (source) enemy.lastHitSource = source;
  enemy.flash = 0.16;
  enemy.hitAngle = Math.atan2(enemy.y - game.tower.y, enemy.x - game.tower.x);
  const damageText = formatDamageText(finalDamage, hit, enemy.shieldHits > 0);
  addText(
    damageText.value,
    enemy.x + (Math.random() - 0.5) * 12,
    enemy.y - enemy.radius - 10,
    damageText.color,
    damageText.options
  );
  if (enemy.hp <= 0) killEnemy(enemy);
}

function formatDamageText(amount, hit = {}, shielded = false) {
  const value = Math.ceil(amount);
  if (hit.superCrit) {
    return {
      value: `Крит! -${value}`,
      color: "#ff5caa",
      options: { size: 32, weight: 900, life: 0.95, floatSpeed: 42, vx: (Math.random() - 0.5) * 18 },
    };
  }
  if (hit.crit) {
    return {
      value: `Крит! -${value}`,
      color: "#ff5caa",
      options: { size: 28, weight: 900, life: 0.9, floatSpeed: 40, vx: (Math.random() - 0.5) * 16 },
    };
  }
  if (shielded) {
    return {
      value: `-${value}`,
      color: "#ffcf4f",
      options: { size: 21, weight: 900, life: 0.78, vx: (Math.random() - 0.5) * 10 },
    };
  }
  const color = value >= 100 ? "#ffb020" : (value >= 30 ? "#ff5caa" : "#55ecff");
  return {
    value: `-${value}`,
    color,
    options: { size: value >= 100 ? 24 : 21, weight: 900, life: 0.78, vx: (Math.random() - 0.5) * 10 },
  };
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  progress.bestiary[enemy.type] = (progress.bestiary[enemy.type] || 0) + 1;
  game.enemies = game.enemies.filter((item) => item !== enemy);
  const goldenCore = game.ultimates?.find((ultimate) => ultimate.id === "goldenCore");
  const gcCashMult = game.goldenCoreTimer > 0 && goldenCore
    ? Math.min(balance.goldenCoreCashCap + (progress.labs.levels.labGoldenBonus || 0) * 0.04, balance.goldenCoreCashMult + goldenCore.level * balance.goldenCoreCashGrowth + (progress.labs.levels.labGoldenBonus || 0) * 0.04)
    : 1;
  const blackHoleCashMult = enemy.inBlackHole
    ? (hasSynergy("Фарм-синхрон") && game.goldenCoreTimer > 0 ? 1.9 : 1.45) * (1 + (progress.labs.levels.labBlackHoleCoins || 0) * 0.05)
    : 1;
  const digesterMult = 1 + (game.blackHoleDigestStacks || 0) * 0.03;
  const reward = Math.ceil(enemy.reward * (1 + game.tower.cashBonus) * gcCashMult * blackHoleCashMult * digesterMult * getModuleMult("economy"));
  game.cash += reward;
  game.totalCash += reward;
  game.stats.cashEarned += reward;
  game.stats.kills += 1;

  if (enemy.lastHitSource === "deathWave" && (progress.labs.levels.labDeathWaveHealth || 0) > 0) {
    const cap = game.tower.maxHp * Math.min(0.75, (progress.labs.levels.labDeathWaveHealth || 0) * 0.01);
    const gain = Math.min(cap - game.deathWaveHealthBonus, game.tower.maxHp * 0.012);
    if (gain > 0) {
      game.deathWaveHealthBonus += gain;
      game.tower.maxHp += gain;
      game.tower.hp += gain;
    }
  }

  if (enemy.type === "boss") {
    progress.crystals = (progress.crystals || 0) + 1; // Боссы дают 1 Кристалл
    const modulePartMult = 1 + (progress.labs.levels.labModuleParts || 0) * 0.01;
    const parts = Math.floor((5 + Math.floor(Math.random() * 6)) * modulePartMult);
    progress.moduleParts = (progress.moduleParts || 0) + parts;
    audio.play("coin");
  }

  // Случайный дроп монеты
  let coinChance = 0.01; // Для scout, shard
  if (["grunt", "shooter", "splitter"].includes(enemy.type)) coinChance = 0.02;
  if (["brute", "shield", "vampire"].includes(enemy.type)) coinChance = 0.05;
  if (enemy.elite || enemy.type === "boss") coinChance = 0.20;
  const labCoinMult = 1 + (progress.labs.levels.labCoins || 0) * 0.015;

  const critCoinBonus = enemy.criticalCoinBonus ? getCardLevelFromCount(progress.cards.cardCriticalCoin || 0) * 0.03 : 0;
  if (Math.random() < coinChance * (1 + game.tower.runCoinBonus + critCoinBonus) * labCoinMult * getModuleMult("economy")) {
    progress.coins += 1;
    audio.play("coin");
    saveProgress();
    addText("+1 ⊙", enemy.x, enemy.y - enemy.radius - 24, "#24b47e");
  }

  if (enemy.type === "boss") {
    game.stats.bossKills += 1;
    if (game.wave % 20 === 0 && game.waveState !== "reward") offerBossRewards();
  }
  addText(`+${reward}`, enemy.x, enemy.y + enemy.radius + 12, "#24b47e");

  if (enemy.type === "splitter") {
    const angle = Math.atan2(enemy.y - game.tower.y, enemy.x - game.tower.x);
    spawnEnemy("shard", { angle: angle + 0.18, hp: 9, speed: 54, radius: 7, reward: 2 });
    spawnEnemy("shard", { angle: angle - 0.18, hp: 9, speed: 54, radius: 7, reward: 2 });
    const shardA = game.enemies[game.enemies.length - 2];
    const shardB = game.enemies[game.enemies.length - 1];
    shardA.x = enemy.x - 8;
    shardA.y = enemy.y;
    shardB.x = enemy.x + 8;
    shardB.y = enemy.y;
  }
  addEffect("pop", enemy.x, enemy.y, 0.34, enemy.color);
}

// --- Разрешение коллизий по методу SAT (Separating Axis Theorem) ---
function getEnemyPolygon(e) {
  const r = e.radius;
  const a = e.angle || 0;
  const cos = Math.cos(a), sin = Math.sin(a);
  const rotate = (lx, ly) => ({ x: e.x + lx * cos - ly * sin, y: e.y + lx * sin + ly * cos });

  if (e.type === "assassin") return [rotate(0, -r), rotate(r*0.7, r), rotate(-r*0.7, r)];
  if (e.type === "healer") return [rotate(0, -r), rotate(r, 0), rotate(0, r), rotate(-r, 0)];
  if (e.type === "scout") return [rotate(0, -r), rotate(r, r), rotate(-r, r)];
  if (e.type === "grunt") return [rotate(0, -r*1.1), rotate(r*1.1, 0), rotate(0, r*1.1), rotate(-r*1.1, 0)];
  if (e.type === "brute" || e.type === "boss" || e.type === "armored") return [rotate(-r, -r), rotate(r, -r), rotate(r, r), rotate(-r, r)];
  if (e.type === "shooter") return Array.from({length: 6}).map((_, i) => { const a_i = i*TWO_PI/6; return rotate(Math.cos(a_i)*r, Math.sin(a_i)*r); });
  if (e.type === "splitter") return Array.from({length: 5}).map((_, i) => { const a_i = -Math.PI/2 + i*TWO_PI/5; return rotate(Math.cos(a_i)*r, Math.sin(a_i)*r); });
  if (e.type === "shield") return [rotate(0, -r), rotate(r*0.95, -r*0.2), rotate(r*0.68, r), rotate(-r*0.68, r), rotate(-r*0.95, -r*0.2)];
  // Дефолт для Вампиров и Осколков (Восьмиугольник)
  return Array.from({length: 8}).map((_, i) => { const a_i = i*TWO_PI/8; return rotate(Math.cos(a_i)*r, Math.sin(a_i)*r); });
}

function getPolygonAxes(poly) {
  const axes = [];
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    axes.push({ x: -dy / len, y: dx / len }); // Нормаль к грани
  }
  return axes;
}

function projectPolygon(poly, axis) {
  let min = Infinity, max = -Infinity;
  for (const p of poly) {
    const dot = p.x * axis.x + p.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return { min, max };
}

function satCollide(polyA, polyB) {
  const axes = [...getPolygonAxes(polyA), ...getPolygonAxes(polyB)];
  let overlap = Infinity, smallestAxis = null;
  for (const axis of axes) {
    const pA = projectPolygon(polyA, axis), pB = projectPolygon(polyB, axis);
    const o1 = pA.max - pB.min;
    const o2 = pB.max - pA.min;
    if (o1 <= 0 || o2 <= 0) return null; // Найден зазор — коллизии нет
    const o = Math.min(o1, o2);
    if (o < overlap) { overlap = o; smallestAxis = axis; }
  }
  // Убеждаемся, что вектор выталкивания (MTV) направлен от A к B
  const cxA = polyA.reduce((s, p) => s + p.x, 0) / polyA.length, cyA = polyA.reduce((s, p) => s + p.y, 0) / polyA.length;
  const cxB = polyB.reduce((s, p) => s + p.x, 0) / polyB.length, cyB = polyB.reduce((s, p) => s + p.y, 0) / polyB.length;
  if ((cxB - cxA) * smallestAxis.x + (cyB - cyA) * smallestAxis.y < 0) {
    smallestAxis.x = -smallestAxis.x; smallestAxis.y = -smallestAxis.y;
  }
  return { overlap, axis: smallestAxis };
}

function offerBossRewards() {
  const choices = [...bossRewardDefs].sort(() => Math.random() - 0.5).slice(0, 3);
  const overlay = document.getElementById("bossRewardOverlay");
  const list = document.getElementById("bossRewardChoices");
  list.innerHTML = "";
  choices.forEach((reward) => {
    const btn = document.createElement("button");
    btn.className = "reward-choice";
    btn.innerHTML = `<strong>${reward.name}</strong><small style="display:block; margin-top:4px; font-size:0.85rem; line-height:1.2;">${reward.desc}</small>`;
    btn.addEventListener("click", () => applyBossReward(reward));
    list.append(btn);
  });
  game.waveState = "reward";
  paused = false;
  overlay.classList.remove("hidden");
  addEffect("reward", game.tower.x, game.tower.y, 1.2, "#55ecff");
  showWaveToast("Босс побежден: выбери протокол");
}

function applyBossReward(reward) {
  reward.apply();
  game.stats.protocols += 1;
  document.getElementById("bossRewardOverlay").classList.add("hidden");
  setWavePause(2.8);
  addEffect("time", game.tower.x, game.tower.y, 0.8, "#24b47e");
  showWaveToast(`${reward.name}: следующая волна скоро`);
  renderRunUpgrades();
}

function offerPerks() {
  const choices = perkDefs
    .filter((perk) => game.perks.filter((id) => id === perk.id).length < (perk.max || 1))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  if (!choices.length) return;
  const overlay = document.getElementById("perkOverlay");
  const list = document.getElementById("perkChoices");
  list.innerHTML = "";
  choices.forEach((perk) => {
    const btn = document.createElement("button");
    btn.className = "reward-choice";
    btn.innerHTML = `<strong>${perk.name}</strong><small style="display:block; margin-top:4px; font-size:0.85rem; line-height:1.2;">${perk.desc}</small>`;
    btn.addEventListener("click", () => applyPerk(perk));
    list.append(btn);
  });
  game.waveState = "reward";
  paused = false;
  overlay.classList.remove("hidden");
  addEffect("reward", game.tower.x, game.tower.y, 1.2, "#ffb020");
  showWaveToast("Доступен новый Перк!");
}

function applyPerk(perk) {
  game.perks.push(perk.id);
  if (perk.id === "dmg") game.perkMultipliers.towerDamage *= 1.15;
  if (perk.id === "hp") { game.tower.maxHp *= 1.2; game.tower.hp *= 1.2; }
  if (perk.id === "regenPerk") game.tower.regen = Math.max(0.5, game.tower.regen * 1.6);
  if (perk.id === "defense") game.tower.defensePercent = Math.min(0.9, game.tower.defensePercent + 0.04);
  if (perk.id === "coins") game.tower.runCoinBonus += 0.15;
  if (perk.id === "orbPerk") game.tower.orbCount = Math.min(10, game.tower.orbCount + 1);
  if (perk.id === "freeUpPerk") game.tower.freeUpgradeChance += 0.05;
  if (perk.id === "perkWaveReq") game.perkWaveReduction = (game.perkWaveReduction || 0) + 0.2;
  if (perk.id === "gameSpeedPerk") game.perkGameSpeed = (game.perkGameSpeed || 1) + 1;
  if (perk.id === "tradeHp") { game.perkMultipliers.enemyHp *= 0.6; game.perkMultipliers.enemyDamage *= 1.4; }
  if (perk.id === "tradeBoss") { game.perkMultipliers.bossDamage *= 1.5; }
  if (perk.id === "tradeCoinsHp") { game.tower.runCoinBonus += 0.8; game.tower.maxHp *= 0.3; game.tower.hp = Math.min(game.tower.hp, game.tower.maxHp); }

  document.getElementById("perkOverlay").classList.add("hidden");
  showWaveToast(`Перк применен`);
  updateTowerStats();
  game.waveState = "spawning"; // Возобновляем спавн волны
}

function knockbackEnemy(enemy, amount) {
  if (enemy.type === "armored" || enemy.type === "boss") return;
  const dx = enemy.x - game.tower.x;
  const dy = enemy.y - game.tower.y;
  const dist = Math.hypot(dx, dy) || 1;
  enemy.x += (dx / dist) * amount;
  enemy.y += (dy / dist) * amount;
  enemy.angularVelocity += (Math.random() - 0.5) * amount * 0.4;
}

function updateUltimates(dt) {
  game.ultimates.forEach((ultimate) => {
    ultimate.timer -= dt;
    if (ultimate.timer <= 0) {
      triggerUltimate(ultimate);
              ultimate.timer = ultimate.maxTimer;
    }
  });
  updateVisualFeedback(dt);
  renderUltimateHud();
}

function updateVisualFeedback(dt) {
  if (game.tower) {
    game.tower.hitTimer = Math.max(0, (game.tower.hitTimer || 0) - dt);
    game.tower.hitSpin = (game.tower.hitSpin || 0) * Math.pow(0.03, dt);
    game.tower.facetPulse = Math.max(0, (game.tower.facetPulse || 0) - dt);
    game.tower.blobImpact = Math.max(0, (game.tower.blobImpact || 0) - dt);
  }
  game.effects.forEach((effect) => (effect.life -= dt));
  game.effects = game.effects.filter((effect) => effect.life > 0);
  
  // Урон от Ядовитого болота
  game.effects.filter(eff => eff.type === "swamp").forEach(eff => {
    game.enemies.forEach(e => {
      if (Math.hypot(e.x - eff.x, e.y - eff.y) < eff.radius + e.radius) {
        damageEnemy(e, game.tower.damage * 0.4 * dt);
      }
    });
  });

  if (game.blackHole && (progress.labs.levels.labBlackHoleDamage || 0) > 0) {
    const pct = (progress.labs.levels.labBlackHoleDamage || 0) * 0.0012;
    game.enemies.forEach((enemy) => {
      if (enemy.inBlackHole && enemy.type !== "boss") damageEnemy(enemy, enemy.maxHp * pct * dt, "blackHole");
    });
  }

  game.effects.filter(eff => eff.type === "solarSweep").forEach(eff => {
    const currentAngle = (1 - (eff.life / eff.maxLife)) * TWO_PI;
    eff.angle = currentAngle;
    game.enemies.forEach(e => {
      const enemyAngle = Math.atan2(e.y - game.tower.y, e.x - game.tower.x);
      let diff = Math.abs(Math.atan2(Math.sin(enemyAngle - currentAngle), Math.cos(enemyAngle - currentAngle)));
      if (diff < 0.25) {
        const dmgPerSec = game.tower.damage * (15 + eff.level * 5);
        damageEnemy(e, dmgPerSec * dt);
        if (hasSynergy("Орбитальная линза")) e.slow = Math.min(e.slow, 0.45);
      }
    });
  });

  game.texts.forEach((text) => {
    text.life -= dt;
    text.y -= (text.floatSpeed || 34) * dt;
    text.x += (text.vx || 0) * dt;
  });
  game.texts = game.texts.filter((text) => text.life > 0);
}

function triggerUltimate(ultimate) {
  const level = ultimate.level || 1;
  const dmgBonus = 1 + (progress.stoneUpgrades.dmg || 0) * 0.05;
  if (ultimate.id === "stormChain") {
    const extraTargets = hasSynergy("Магнитная дуга") ? 2 : 0;
    const targets = findTargets(4 + level + extraTargets);
    targets.forEach((enemy) => damageEnemy(enemy, game.tower.damage * (4 + level) * dmgBonus));
    if (targets.length > 0) {
      const pts = [{x: game.tower.x, y: game.tower.y}, ...targets.map(t => ({x: t.x, y: t.y}))];
      game.effects.push({ type: "chain", pts, life: 0.4, maxLife: 0.4, color: "#55ecff" });
    }
  }
  if (ultimate.id === "timeField") {
    game.enemies.forEach((enemy) => (enemy.slow = Math.min(enemy.slow, 0.35)));
    addEffect("time", game.tower.x, game.tower.y, 1.5, "#24b47e");
  }
  if (ultimate.id === "missileSwarm") {
    const damageBoost = hasSynergy("Стазис-заряд") ? 1.35 : 1;
    findTargets(5 + level).forEach((enemy) => game.missiles.push({ x: game.tower.x, y: game.tower.y, target: enemy, damage: game.tower.damage * 1.8 * damageBoost * dmgBonus, speed: 330 }));
    addEffect("missile", game.tower.x, game.tower.y, 0.6, "#ff5c6c");
  }
  if (ultimate.id === "solarBeam") {
    game.effects.push({ type: "solarSweep", life: 2.0, maxLife: 2.0, angle: 0, level });
  }
  if (ultimate.id === "goldenCore") {
    game.goldenCoreTimer = 10 + level * 2 + (progress.labs.levels.labGoldenDuration || 0) * 0.4;
    addEffect("time", game.tower.x, game.tower.y, 1.0, "#ffb020");
  }
  if (ultimate.id === "blackHole") {
    const angle = Math.random() * TWO_PI;
    const radius = 95 + level * 7;
    game.blackHole = {
      x: game.tower.x + Math.cos(angle) * 120,
      y: game.tower.y + Math.sin(angle) * 120,
      radius,
      level,
    };
    game.blackHoleTimer = 6 + level + (progress.labs.levels.labBlackHoleDuration || 0) * 0.35;
    game.effects.push({ type: "blackHole", x: game.blackHole.x, y: game.blackHole.y, radius, life: game.blackHoleTimer, maxLife: game.blackHoleTimer, color: "#b375ff" });
  }
  if (ultimate.id === "deathWave") {
    const selectedUltimates = getSelectedUltimateIds();
    const triSync = game.goldenCoreTimer > 0 && game.blackHoleTimer > 0 && ["goldenCore", "blackHole", "deathWave"].every((id) => selectedUltimates.includes(id)) ? 1.25 : 1;
    const waveRadius = 175 + level * 16;
    game.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - game.tower.x, enemy.y - game.tower.y);
      if (dist > waveRadius) return;
      const compressed = enemy.inBlackHole && hasSynergy("Сжатая волна") ? 1.45 : 1;
      damageEnemy(enemy, game.tower.damage * (1.7 + level * 0.35) * dmgBonus * compressed * triSync, "deathWave");
      knockbackEnemy(enemy, 38);
    });
    addEffect("deathWave", game.tower.x, game.tower.y, 1.0, "#ff5c9b");
  }
  if (ultimate.id === "poisonSwamp") {
    for(let i=0; i<3+level; i++) {
      game.effects.push({ type: "swamp", x: game.tower.x + (Math.random()-0.5)*300, y: game.tower.y + (Math.random()-0.5)*300, life: 8, maxLife: 8, color: "#a5ff3b", radius: 70 });
    }
  }
}

function updateMissiles(dt) {
  game.missiles.forEach((m) => {
    if (!game.enemies.includes(m.target)) {
      m.dead = true;
      return;
    }
    const dx = m.target.x - m.x;
    const dy = m.target.y - m.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = m.speed * dt;
    if (dist <= step + m.target.radius) {
      damageEnemy(m.target, m.damage);
      audio.play("explosion");

      // Микро-импульс от попадания ракеты
      m.target.x += (dx / dist) * 5;
      m.target.y += (dy / dist) * 5;
      m.target.angularVelocity += (Math.random() - 0.5) * 8;

      addEffect("pop", m.target.x, m.target.y, 0.28, "#ff5c6c");
      m.dead = true;
    } else {
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
    }
  });
  game.missiles = game.missiles.filter((m) => !m.dead);
}

function updateLandmines(dt) {
  const triggerRadius = 24;
  const blastRadius = 95;

  game.landmines.forEach((mine) => {
    const trigger = game.enemies.find((enemy) => Math.hypot(enemy.x - mine.x, enemy.y - mine.y) <= enemy.radius + triggerRadius);
    if (!trigger) return;

    game.enemies.slice().forEach((enemy) => {
      const dist = Math.hypot(enemy.x - mine.x, enemy.y - mine.y);
      if (dist > blastRadius + enemy.radius) return;
      const falloff = 1 - Math.min(0.65, dist / blastRadius);
      damageEnemy(enemy, mine.damage * falloff);
      if (game.tower.landmineStunDuration > 0) enemy.slow = Math.min(enemy.slow, 0.25);
      if (enemy.type !== "armored") knockbackEnemy(enemy, 18 * falloff);
    });

    audio.play("explosion");
    addEffect("mine", mine.x, mine.y, 0.35, "#ffb020");
    triggerShake();
    mine.dead = true;
  });

  game.landmines = game.landmines.filter((mine) => !mine.dead);
}

function addEffect(type, x, y, life, color, angle = 0) {
  if (progress.settings.reducedMotion && ["pop", "spark", "crit", "shotHit"].includes(type)) return;
  game.effects.push({ type, x, y, life, maxLife: life, color, angle });
}

function addText(value, x, y, color, options = {}) {
  if (!progress.settings.damageNumbers || !game) return;
  game.texts.push({
    value,
    x,
    y,
    color,
    life: options.life || 0.75,
    maxLife: options.life || 0.75,
    size: options.size || 20,
    weight: options.weight || 800,
    glow: options.glow ?? true,
    vx: options.vx || 0,
    floatSpeed: options.floatSpeed || 34,
    stroke: options.stroke ?? true,
  });
}

function triggerShake() {
  if (!progress.settings.screenShake || progress.settings.reducedMotion) return;
  const shell = document.querySelector(".app-shell");
  shell.classList.remove("shake");
  window.requestAnimationFrame(() => shell.classList.add("shake"));
  window.setTimeout(() => shell.classList.remove("shake"), 210);
}

function buyRunUpgrade(id) {
  const def = runUpgradeDefs.find((u) => u.id === id);
  const level = game.runUpgrades[id];
  const cost = getRunUpgradeCost(def, level);
  if (!isRunUpgradeRequirementMet(def)) return;
  if (game.cash < cost || level >= def.max) return;
  game.cash -= cost;
  game.runUpgrades[id] += 1;
  game.stats.runUpgrades += 1;

  applyUpgradeStat(id);
  renderRunUpgrades();
}

function isRunUpgradeRequirementMet(def) {
  const requiredId = runUpgradeRequirements[def?.id];
  return !requiredId || (game?.runUpgrades?.[requiredId] || 0) > 0;
}

function applyUpgradeStat(id) {
  const level = game.runUpgrades[id] - 1; // Уровень до улучшения (для формул)
  const t = game.tower;
  
  const prestigeMult = 1 + (progress.prestige || 0) * 0.04;
  const labDmgMult = 1 + (progress.labs.levels.labDamage || 0) * 0.01;
  const perkDmg = game.perkMultipliers?.towerDamage || 1;
  const rewardDmg = game.rewardMultipliers?.damage || 1;
  
  const getCardLevel = (cardId) => getCardLevelFromCount(progress.cards[cardId] || 0);
  const cardDmgMult = progress.equippedCards.includes("cardDamage") ? 1 + getCardLevel("cardDamage") * 0.2 : 1;
  const cardSpdMult = progress.equippedCards.includes("cardSpeed") ? 1 + getCardLevel("cardSpeed") * 0.15 : 1;
  const cardHpMult = progress.equippedCards.includes("cardHealth") ? 1 + getCardLevel("cardHealth") * 0.25 : 1;
  const cardCashMult = progress.equippedCards.includes("cardCash") ? 1 + getCardLevel("cardCash") * 0.2 : 1;
  const cardCoinMult = progress.equippedCards.includes("cardCoins") ? 1 + getCardLevel("cardCoins") * 0.15 : 1;
  const cardRegenMult = progress.equippedCards.includes("cardRegen") ? 1 + getCardLevel("cardRegen") * 0.3 : 1;
  const cardFortressMult = progress.equippedCards.includes("cardFortress") ? 1 + getCardLevel("cardFortress") * 0.2 : 1;

  if (id === "damage") t.damage += (3 + level * 0.9) * prestigeMult * labDmgMult * perkDmg * rewardDmg * cardDmgMult * getModuleMult("damage");
  if (id === "attackSpeed") t.attackSpeed *= 1.08 * (level === 0 ? cardSpdMult * getModuleMult("speed") : 1);
  if (id === "range") t.range += 12;
  if (id === "maxHealth") {
    const added = 24 * (game.eventMode === "glassCore" ? balance.glassCoreHp : 1) * (game.perks?.includes("hp") ? 1.25 : 1) * cardHpMult * getModuleMult("health");
    t.maxHp += added;
    t.hp += added;
  }
  if (id === "regen") t.regen += 0.5 * cardRegenMult;
  if (id === "critChance") t.critChance += 0.025;
  if (id === "critDamage") t.critDamage += 0.18;
  if (id === "superCritChance") t.superCritChance = Math.min(0.8, t.superCritChance + 0.0075);
  if (id === "superCritMult") t.superCritMult += 0.18;
  if (id === "multiShot") t.multiShot += 0.025;
  if (id === "bounceShot") t.bounceChance += 0.03;
  if (id === "bounceTargets") t.bounceTargets = Math.min(8, t.bounceTargets + 1);
  if (id === "bounceRange") t.bounceRange += 18;
  if (id === "rapidFireChance") t.rapidFireChance = Math.min(0.55, t.rapidFireChance + 0.012);
  if (id === "rapidFireDuration") t.rapidFireDuration += 0.22;
  if (id === "damageMeter") t.damageMeter += 0.006;
  if (id === "knockback") t.knockback += 0.03;
  if (id === "knockbackStrength") t.knockbackStrength += 3.5;
  if (id === "lifesteal") t.lifesteal += 0.004;
  if (id === "absDefense") t.absDefense += (1.5 + level * 1.1) * cardFortressMult;
  if (id === "defensePercent") t.defensePercent = Math.min(0.65, t.defensePercent + 0.012);
  if (id === "thorns") t.thorns += 0.07;
  if (id === "cashBonus") t.cashBonus += 0.05 + (level === 0 ? cardCashMult - 1 : 0);
  if (id === "cashWave") t.cashWave += 8 + level * 1.6;
  if (id === "interestRate") t.interestRate = Math.min(0.12, t.interestRate + 0.0035);
  if (id === "maxInterest") t.maxInterest += 18 + level * 4;
  if (id === "freeUpgrade") t.freeUpgradeChance += 0.008;
  if (id === "runCoinBonus") t.runCoinBonus += 0.05 + (level === 0 ? cardCoinMult - 1 : 0);
  if (id === "coinWave") t.coinWaveChance = Math.min(0.45, t.coinWaveChance + 0.006);
  if (id === "orbCount") t.orbCount = Math.min(10, t.orbCount + 1);
  if (id === "orbSpeed") t.orbSpeed += 0.12;
  if (id === "deathDefy") t.deathDefy = Math.min(0.3, t.deathDefy + 0.015);
  if (id === "landmineChance") t.landmineChance = Math.min(0.45, t.landmineChance + 0.015);
  if (id === "landmineDamage") t.landmineDamage += 0.3;
  if (id === "packageChance") t.packageChance = Math.min(0.35, t.packageChance + 0.01);
  if (id === "packageMax") t.packageMax += 0.1;
  if (id === "shockWave") {
    t.shockWaveCooldown = Math.max(2.4, 7.2 - game.runUpgrades.shockWave * 0.08);
    t.shockWaveSize = 260 + game.runUpgrades.shockWave * 2.4;
    t.shockWaveStrength = 34 + game.runUpgrades.shockWave * 0.9;
    if (t.shockWaveTimer <= 0) t.shockWaveTimer = Math.min(1.2, t.shockWaveCooldown);
  }
  if (id === "enemyAttackSkip") t.enemyAttackSkip = Math.min(0.55, t.enemyAttackSkip + 0.0075);
  if (id === "enemyHealthSkip") t.enemyHealthSkip = Math.min(0.55, t.enemyHealthSkip + 0.0075);
  if (id === "waveSkip") t.waveSkipChance = Math.min(0.42, t.waveSkipChance + 0.006);
}

function getRunUpgradeCost(def, level) {
  const discount = game?.eventMode === "overclocked" ? balance.overclockedUpgradeDiscount : 1;
  const labDiscount = Math.min(0.12, (progress.labs.levels.labUpgradeDiscount || 0) * 0.004);
  return Math.floor(def.base * Math.pow(def.growth, level) * discount * (1 - labDiscount));
}

function renderRunUpgrades() {
  const grid = document.getElementById("runUpgradeGrid");
  const activeDefs = runUpgradeDefs.filter((def) => def.category === activeRunUpgradeCategory);

  // Создаем кнопки с нуля, только если мы переключили вкладку (категорию)
  if (grid.dataset.category !== activeRunUpgradeCategory) {
    saveRunUpgradeScrollPosition(grid.dataset.category);
    isRestoringRunUpgradeScroll = true;
    grid.innerHTML = "";
    grid.dataset.category = activeRunUpgradeCategory;
    
    activeDefs.forEach((def) => {
      const btn = document.createElement("button");
      btn.id = `upgrade-btn-${def.id}`;
      btn.className = "upgrade-card";
      
      const iconWrap = document.createElement("div");
      iconWrap.className = "run-upgrade-icon";
      const iconClass = runUpgradeIconMap[def.id] || defaultRunUpgradeIconClass;
      const iconImg = document.createElement("span");
      iconImg.className = `run-upgrade-icon-img ${iconClass}`;
      iconWrap.append(iconImg);

      const body = document.createElement("div");
      body.className = "run-upgrade-body";

      const title = document.createElement("strong");
      title.className = "run-upgrade-title";
      title.textContent = def.name;

      const desc = document.createElement("span");
      desc.className = "run-upgrade-desc";
      desc.textContent = def.desc;
      body.append(title, desc);

      const meta = document.createElement("div");
      meta.className = "run-upgrade-meta";
      const levelPill = document.createElement("span");
      levelPill.id = `upgrade-level-${def.id}`;
      levelPill.className = "run-upgrade-level";
      const costPill = document.createElement("span");
      costPill.id = `upgrade-info-${def.id}`;
      costPill.className = "run-upgrade-cost";
      
      const infoIcon = document.createElement("div");
      infoIcon.className = "upgrade-info-btn";
      infoIcon.textContent = "i";
      infoIcon.addEventListener("click", (e) => {
        e.stopPropagation(); // Не дает кнопке купиться при клике на 'i'
        openUpgradeInfo(def);
      });

      iconWrap.append(infoIcon);
      meta.append(levelPill, costPill);
      
      btn.append(iconWrap, body, meta);
      btn.addEventListener("click", () => buyRunUpgrade(def.id));
      grid.append(btn);
    });
    finishRunUpgradeScrollRestore();
  }

  // Обновляем данные на уже существующих кнопках (без их пересоздания)
  activeDefs.forEach((def) => {
    const btn = document.getElementById(`upgrade-btn-${def.id}`);
    const info = document.getElementById(`upgrade-info-${def.id}`);
    const levelPill = document.getElementById(`upgrade-level-${def.id}`);
    if (!btn || !info || !levelPill) return;
    
    const level = game?.runUpgrades?.[def.id] || 0;
    const isMax = level >= def.max;
    const cost = getRunUpgradeCost(def, level);
    const requirementMet = isRunUpgradeRequirementMet(def);
    const locked = !game || game.ended || !requirementMet || Boolean(game.cash < cost);
    const state = isMax ? "max" : (!game || game.ended || !requirementMet ? "locked" : (locked ? "default" : "available"));
    
    if (btn.disabled !== (locked || isMax)) btn.disabled = locked || isMax;
    const newClass = `upgrade-card is-${state} ${(locked || isMax) ? "disabled" : ""}`;
    if (btn.className !== newClass) btn.className = newClass;
    
    const infoText = isMax ? `Ур.${level} (МАКС)` : `Ур.${level} · $${cost}`;
    if (info.textContent !== infoText) {
      info.textContent = infoText;
    }
    const levelText = `Ур. ${level} / ${def.max}`;
    if (levelPill.textContent !== levelText) levelPill.textContent = levelText;
    if (isMax) {
      if (info.textContent !== "MAX") info.textContent = "MAX";
    } else {
      const costText = `<span class="run-upgrade-coin" aria-hidden="true"></span>${cost}`;
      if (info.innerHTML !== costText) info.innerHTML = costText;
    }
  });
}

function getStatValueString(id, t) {
  if (!t) return "0";
  switch(id) {
    case "damage": return Math.round(t.damage);
    case "attackSpeed": return t.attackSpeed.toFixed(2) + " выстр/с";
    case "range": return Math.round(t.range) + " px";
    case "critChance": return (t.critChance * 100).toFixed(1) + "%";
    case "critDamage": return "x" + t.critDamage.toFixed(2);
    case "superCritChance": return (t.superCritChance * 100).toFixed(1) + "%";
    case "superCritMult": return "x" + t.superCritMult.toFixed(2);
    case "multiShot": return (t.multiShot * 100).toFixed(1) + "%";
    case "bounceShot": return (t.bounceChance * 100).toFixed(1) + "%";
    case "bounceTargets": return t.bounceTargets + " отск.";
    case "bounceRange": return Math.round(t.bounceRange) + " px";
    case "rapidFireChance": return (t.rapidFireChance * 100).toFixed(1) + "%";
    case "rapidFireDuration": return t.rapidFireDuration.toFixed(1) + "с";
    case "damageMeter": return "+" + (t.damageMeter * 100).toFixed(1) + "%/100px";
    case "orbCount": return t.orbCount + " шт";
    case "orbSpeed": return t.orbSpeed.toFixed(2);
    case "maxHealth": return Math.round(t.maxHp);
    case "regen": return t.regen.toFixed(1) + " ОЗ/с";
    case "absDefense": return Math.round(t.absDefense);
    case "knockback": return (t.knockback * 100).toFixed(1) + "%";
    case "knockbackStrength": return Math.round(t.knockbackStrength) + " px";
    case "lifesteal": return (t.lifesteal * 100).toFixed(1) + "%";
    case "defensePercent": return (t.defensePercent * 100).toFixed(1) + "%";
    case "thorns": return (t.thorns * 100).toFixed(1) + "%";
    case "deathDefy": return (t.deathDefy * 100).toFixed(1) + "%";
    case "landmineChance": return (t.landmineChance * 100).toFixed(1) + "%";
    case "landmineDamage": return "x" + t.landmineDamage.toFixed(2);
    case "cashBonus": return "+" + (t.cashBonus * 100).toFixed(1) + "%";
    case "cashWave": return "$" + Math.round(t.cashWave);
    case "interestRate": return (t.interestRate * 100).toFixed(1) + "%";
    case "maxInterest": return "$" + Math.round(t.maxInterest);
    case "freeUpgrade": return (t.freeUpgradeChance * 100).toFixed(1) + "%";
    case "runCoinBonus": return "+" + (t.runCoinBonus * 100).toFixed(1) + "%";
    case "coinWave": return (t.coinWaveChance * 100).toFixed(1) + "%";
    case "packageChance": return (t.packageChance * 100).toFixed(1) + "%";
    case "packageMax": return "+" + (t.packageMax * 100).toFixed(1) + "%";
    case "shockWave": return t.shockWaveCooldown ? t.shockWaveCooldown.toFixed(1) + "с" : "нет";
    case "enemyAttackSkip": return "-" + (t.enemyAttackSkip * 100).toFixed(1) + "% ATK";
    case "enemyHealthSkip": return "-" + (t.enemyHealthSkip * 100).toFixed(1) + "% HP";
    case "waveSkip": return (t.waveSkipChance * 100).toFixed(1) + "%";
    default: return "";
  }
}

function getNextUpgradeEffectString(id, level) {
  switch(id) {
    case "damage": return `+${(4 + level * 1.4).toFixed(1)} к базовому урону`;
    case "attackSpeed": return `x1.12 к скорости атаки`;
    case "range": return `+12 px`;
    case "critChance": return `+3.5%`;
    case "critDamage": return `+0.22x`;
    case "superCritChance": return `+1.0%`;
    case "superCritMult": return `+0.25x`;
    case "multiShot": return `+4.0%`;
    case "bounceShot": return `+5.0%`;
    case "bounceTargets": return `+1 отскок`;
    case "bounceRange": return `+18 px`;
    case "rapidFireChance": return `+1.2%`;
    case "rapidFireDuration": return `+0.22с`;
    case "damageMeter": return `+0.6%/100px`;
    case "orbCount": return `+1 сфера`;
    case "orbSpeed": return `+0.15 к скорости`;
    case "maxHealth": return `+24 ОЗ`;
    case "regen": return `+0.7 ОЗ/с`;
    case "absDefense": return `+${(2 + level * 1.5).toFixed(1)} к поглощению`;
    case "knockback": return `+4.5%`;
    case "knockbackStrength": return `+3.5 px`;
    case "lifesteal": return `+0.8%`;
    case "defensePercent": return `+2.0%`;
    case "thorns": return `+10.0%`;
    case "deathDefy": return `+1.5%`;
    case "landmineChance": return `+2.0%`;
    case "landmineDamage": return `+0.4x`;
    case "cashBonus": return `+8.0%`;
    case "cashWave": return `+$${Math.round(8 + level * 1.6)}`;
    case "interestRate": return `+0.5%`;
    case "maxInterest": return `+$${25 + level * 5}`;
    case "freeUpgrade": return `+1.5%`;
    case "runCoinBonus": return `+10.0%`;
    case "coinWave": return `+0.6%`;
    case "packageChance": return `+1.5%`;
    case "packageMax": return `+15.0%`;
    case "shockWave": return `волна чаще и сильнее`;
    case "enemyAttackSkip": return `-0.75% урона врагов`;
    case "enemyHealthSkip": return `-0.75% здоровья врагов`;
    case "waveSkip": return `+0.6% шанс пропуска`;
    default: return "";
  }
}

function getPermanentBonusString(id) {
  const p = progress.permanent;
  const style = `style="color:var(--accent-pink); font-size:0.8rem; margin-top:2px; display:block;"`;
  switch(id) {
    case "damage": return `<span ${style}>(Вкл. Постоянное: база ${Math.round((10 + (p.baseDamage || 0) + (progress.eventShop.medalDamage || 0)) * (1 + (progress.prestige || 0) * 0.04) * (1 + (progress.labs.levels.labDamage || 0) * 0.01))})</span>`;
    case "maxHealth": return `<span ${style}>(Вкл. Постоянное: база ${Math.round((100 + (p.baseHealth || 0) * 8) * (1 + (progress.labs.levels.labHealth || 0) * 0.012))})</span>`;
    case "attackSpeed": return `<span ${style}>(Вкл. Постоянное: +${((p.baseAttackSpeed || 0) * 1.5 + (progress.labs.levels.labAttackSpeed || 0) * 0.6).toFixed(1)}%)</span>`;
    case "critChance": return `<span ${style}>(Вкл. Постоянное: +${((p.criticalChance || 0) * 0.5).toFixed(1)}%)</span>`;
    case "lifesteal": return `<span ${style}>(Вкл. Постоянное: +${((p.lifesteal || 0) * 0.1).toFixed(1)}%)</span>`;
    case "defensePercent": return `<span ${style}>(Вкл. Постоянное: +${((p.defensePercent || 0) * 0.7).toFixed(1)}%)</span>`;
    case "thorns": return `<span ${style}>(Вкл. Постоянное: +${(p.thorns || 0) * 2}%)</span>`;
    default: return "";
  }
}

function openUpgradeInfo(def) {
  wasPausedForInfo = false;
  if (game && !game.ended && !paused) {
    togglePause();
    wasPausedForInfo = true;
  }
  const level = game?.runUpgrades?.[def.id] || 0;
  document.getElementById("upgradeInfoCategory").textContent = runUpgradeCategories[def.category].label.toUpperCase();
  document.getElementById("upgradeInfoTitle").textContent = def.name;
  document.getElementById("upgradeInfoDesc").textContent = def.desc;
  document.getElementById("upgradeInfoLevel").textContent = `Уровень: ${level} / ${def.max}`;
  document.getElementById("upgradeInfoEffect").innerHTML = `Текущий стат: <strong>${getStatValueString(def.id, game?.tower)}</strong>${getPermanentBonusString(def.id)}`;
  
  const nextText = level >= def.max ? "Достигнут максимум" : `Следующий уровень: ${getNextUpgradeEffectString(def.id, level)}`;
  document.getElementById("upgradeInfoNext").textContent = nextText;
  document.getElementById("upgradeInfoOverlay").classList.remove("hidden");
}

function openMenuInfo(type, id) {
  let def, level, max, title, desc, currentEffect, nextEffect, categoryLabel;

  if (type === "lab") {
    def = labDefs.find(d => d.id === id);
    level = progress.labs.levels[id] || 0;
    max = def.max;
    categoryLabel = "ЛАБОРАТОРИЯ";
    currentEffect = def.getEffect(level);
    nextEffect = level >= max ? "Достигнут максимум" : `Следующий уровень: ${def.getEffect(level + 1)}`;
  } else if (type === "permanent") {
    def = permanentDefs.find(d => d.id === id);
    level = progress.permanent[id] || 0;
    max = def.max;
    categoryLabel = "ПОСТОЯННОЕ УЛУЧШЕНИЕ";
    currentEffect = getPermanentFullEffect(def, level);
    nextEffect = level >= max ? "Достигнут максимум" : `Следующий уровень: ${getPermanentFullEffect(def, level + 1)}`;
  } else if (type === "ultimate") {
    def = ultimateDefs.find(d => d.id === id);
    level = progress.ultimates[id].level;
    max = "∞";
    categoryLabel = "УЛЬТИМАТИВНОЕ ОРУЖИЕ";
    currentEffect = def.getUpgradeInfo(level);
    nextEffect = `Следующий уровень: ${def.getUpgradeInfo(level + 1)}`;
  } else if (type === "event") {
    def = eventShopDefs.find(d => d.id === id);
    level = progress.eventShop[id] || 0;
    max = def.max;
    categoryLabel = "МАГАЗИН СОБЫТИЙ";
    currentEffect = def.getEffect(level);
    nextEffect = level >= max ? "Достигнут максимум" : `Следующий уровень: ${def.getEffect(level + 1)}`;
  }

  document.getElementById("upgradeInfoCategory").textContent = categoryLabel;
  document.getElementById("upgradeInfoTitle").textContent = def.name;
  document.getElementById("upgradeInfoDesc").textContent = def.desc;
  document.getElementById("upgradeInfoLevel").textContent = `Уровень: ${level} / ${max}`;
  document.getElementById("upgradeInfoEffect").innerHTML = `Текущий эффект: <strong>${currentEffect}</strong>`;
  document.getElementById("upgradeInfoNext").textContent = nextEffect;
  document.getElementById("upgradeInfoOverlay").classList.remove("hidden");
}

function buyPermanentUpgrade(id) {
  const def = permanentDefs.find((u) => u.id === id);
  const level = progress.permanent[id] || 0;
  const cost = getPermanentCost(def, level);
  if (level >= def.max || progress.coins < cost) return;
  progress.coins -= cost;
  progress.spentCoins = (progress.spentCoins || 0) + cost;
  progress.permanent[id] += 1;
  saveProgress();
  renderPermanentShop();
}

function getPermanentCost(def, level) {
  const early = Math.min(level, 20);
  const mid = Math.max(0, Math.min(level - 20, 40));
  const late = Math.max(0, level - 60);
  return Math.floor(def.base * Math.pow(def.scale, early) * Math.pow(def.scale + 0.06, mid) * Math.pow(def.scale + 0.14, late));
}

function getPermanentStarterText(id, level = progress.permanent?.[id] || 0) {
  const link = permanentStarterRunUpgradeMap[id];
  if (!link) return "";
  const starterLevels = Math.min(link.cap, Math.floor(level / link.every));
  const nextAt = starterLevels >= link.cap ? "кап достигнут" : `след. на ур. ${Math.ceil((level + 1) / link.every) * link.every}`;
  return `Старт: +${starterLevels} ${link.label} (${nextAt})`;
}

function getPermanentFullEffect(def, level) {
  const starterText = getPermanentStarterText(def.id, level);
  return starterText ? `${def.getEffect(level)} · ${starterText}` : def.getEffect(level);
}

function getStarterRunLoadoutSummary() {
  const starterLevels = getPermanentStarterRunLevels();
  const entries = Object.entries(starterLevels)
    .map(([runId, level]) => `${runUpgradeDefs.find((def) => def.id === runId)?.name || runId} +${level}`);
  return entries.length ? entries.join(", ") : "пока нет стартовых уровней";
}

// --- ЛАБОРАТОРИЯ ---
function getLabCost(def, level) {
  const early = Math.min(level, 15);
  const mid = Math.max(0, Math.min(level - 15, 25));
  const late = Math.max(0, level - 40);
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, early) * Math.pow(def.costGrowth + 0.05, mid) * Math.pow(def.costGrowth + 0.1, late));
}
function getLabTime(def, level) {
  const raw = def.baseTime * Math.pow(def.timeGrowth, level);
  const labSpeed = 1 - Math.min(0.4, (progress?.labs?.levels?.labLabSpeed || 0) * 0.01);
  const softCap = 7 * 24 * 3600;
  const capped = raw > softCap ? softCap + Math.sqrt(raw - softCap) * 30 : raw;
  return Math.floor(capped * labSpeed);
}
function getLabSlotLimit() {
  const best = progress?.bestWave || 0;
  const waveSlots = 1 + (best >= 25 ? 1 : 0) + (best >= 60 ? 1 : 0) + (best >= 100 ? 1 : 0);
  return Math.max(progress?.labs?.slots || 1, waveSlots);
}
function getNextLabSlotText() {
  const best = progress?.bestWave || 0;
  if (best < 25) return `следующий слот на волне 25 (${best}/25)`;
  if (best < 60) return `следующий слот на волне 60 (${best}/60)`;
  if (best < 100) return `следующий слот на волне 100 (${best}/100)`;
  return "все слоты по волнам открыты";
}
function formatLabTime(sec) {
  if (sec < 60) return `${Math.ceil(sec)}с`;
  if (sec < 3600) return `${Math.floor(sec/60)}м ${Math.floor(sec%60)}с`;
  return `${Math.floor(sec/3600)}ч ${Math.floor((sec%3600)/60)}м`;
}

function checkCompletedLabs() {
  const now = Date.now();
  let changed = false;
  progress.labs.active = progress.labs.active.filter(task => {
    if (now >= task.finishTime) {
      progress.labs.levels[task.id] = (progress.labs.levels[task.id] || 0) + 1;
      changed = true;
      const def = labDefs.find(l => l.id === task.id);
      if (game && !game.ended && !paused) showWaveToast(`Изучено: ${def?.name}!`);
      return false; // Удаляем из активных
    }
    return true;
  });
  if (changed) saveProgress();
}

function startLabResearch(id) {
  if (progress.labs.active.length >= getLabSlotLimit()) return;
  const def = labDefs.find(l => l.id === id);
  const level = progress.labs.levels[id] || 0;
  const cost = getLabCost(def, level);
  if (progress.coins < cost || level >= def.max) return;
  
  progress.coins -= cost;
  progress.spentCoins = (progress.spentCoins || 0) + cost;
  const durationSec = getLabTime(def, level);
  progress.labs.active.push({ id, finishTime: Date.now() + durationSec * 1000, totalTime: durationSec });
  saveProgress();
  renderLabs();
}

function renderLabs() {
  if (!screens.labs.classList.contains("active")) return;
  checkCompletedLabs();
  document.getElementById("labCoins").textContent = Math.floor(progress.coins);
  
  const activeContainer = document.getElementById("labActiveSlots");
  const labSlotLimit = getLabSlotLimit();
  activeContainer.innerHTML = `<div class="lab-active-panel"><strong>Активные исследования (${progress.labs.active.length} / ${labSlotLimit})</strong><span class="lab-slot-hint">${getNextLabSlotText()}</span>`;
  if (progress.labs.active.length === 0) {
    activeContainer.innerHTML += `<div class="lab-active-empty">Слоты свободны. Начни исследование ниже.</div>`;
  } else {
    const now = Date.now();
    progress.labs.active.forEach(task => {
      const def = labDefs.find(l => l.id === task.id);
      const level = progress.labs.levels[task.id] || 0;
      const iconClass = labIconMap[task.id] || "icon-labs";
      const remainingSec = Math.max(0, (task.finishTime - now) / 1000);
      const pct = Math.max(0, Math.min(100, 100 - (remainingSec / task.totalTime) * 100));
      activeContainer.innerHTML += `
        <div class="lab-active-task">
          <div class="lab-active-icon"><i class="sprite-icon ${iconClass}"></i></div>
          <div class="lab-active-body">
            <div class="lab-active-head">
              <strong>${def.name}</strong>
              <span>Ур. ${level}</span>
            </div>
            <div class="lab-active-time">Осталось: ${formatLabTime(remainingSec)}</div>
          </div>
          <div class="lab-progress" style="--progress-percent:${pct}%"><div class="lab-progress-fill"></div></div>
        </div>`;
    });
  }
  activeContainer.innerHTML += `</div>`;

  const list = document.getElementById("labList");
  list.innerHTML = "";
  labDefs.forEach(def => {
    const level = progress.labs.levels[def.id] || 0;
    const isResearching = progress.labs.active.some(t => t.id === def.id);
    const cost = getLabCost(def, level);
    const time = getLabTime(def, level);
    const isMax = level >= def.max;
    const slotBlocked = progress.labs.active.length >= labSlotLimit;
    const canStudy = progress.coins >= cost && !isResearching && !isMax && !slotBlocked;
    const iconClass = labIconMap[def.id] || "icon-labs";
    const card = document.createElement("div");
    card.className = `shop-card lab-upgrade-card ${canStudy ? "can-study" : ""} ${progress.coins < cost && !isMax ? "cant-study" : ""} ${isResearching ? "researching" : ""} ${isMax ? "is-max" : ""}`;
    card.innerHTML = `<button class="upgrade-info-btn lab-info-btn" data-info-type="lab" data-info-id="${def.id}" type="button" aria-label="Информация"></button>
      <div class="lab-card-head">
        <div class="lab-icon-frame"><i class="sprite-icon lab-upgrade-icon ${iconClass}"></i></div>
        <div class="lab-title-block">
          <strong>${def.name}</strong>
          <span>Ур. ${level}</span>
        </div>
      </div>
      <p>${def.desc}</p>
      <div class="lab-card-bottom">
        <div class="lab-effect">Сейчас: ${def.getEffect(level)}</div>
        <div class="lab-effect lab-next-effect">${isMax ? "Максимум изучен" : `После исследования: ${def.getEffect(level + 1)}`}</div>
        <div class="lab-card-footer">
          <div class="lab-time"><span class="lab-meta-icon">◷</span><span>${isMax ? "Макс." : formatLabTime(time)}</span></div>
          <div class="lab-cost"><i class="sprite-icon icon-coin" aria-hidden="true"></i><span>${cost}</span></div>
        </div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "lab-buy-btn";
    btn.textContent = level >= def.max ? "Макс" : (isResearching ? "В процессе" : "Изучить");
    btn.disabled = !canStudy;
    btn.addEventListener("click", () => startLabResearch(def.id));
    card.querySelector(".lab-card-bottom").append(btn);
    list.append(card);
  });
}

setInterval(() => { if (screens.labs.classList.contains("active")) renderLabs(); }, 1000);

// --- КАРТОЧКИ (Gacha) ---
function getCardLevelFromCount(count) {
  if (count < 1) return 0;
  if (count < 4) return 1;
  if (count < 10) return 2;
  if (count < 25) return 3;
  if (count < 50) return 4;
  return 5; // Max level
}

function pullCard() {
  if (progress.crystals < CARD_PULL_COST) return;
  progress.crystals -= CARD_PULL_COST;
  const randomDef = cardDefs[Math.floor(Math.random() * cardDefs.length)];
  progress.cards[randomDef.id] = (progress.cards[randomDef.id] || 0) + 1;
  saveProgress();
  renderCards();
  showCardPullOverlay(randomDef);
}

function showCardPullOverlay(def) {
  const overlay = document.getElementById("cardPullOverlay");
  const stage = document.getElementById("cardPullStage");
  const title = document.getElementById("cardPullTitle");
  const result = document.getElementById("cardPullResult");
  const icon = document.getElementById("cardPullIcon");
  const closeBtn = document.getElementById("closeCardPullBtn");
  const count = progress.cards[def.id] || 0;
  const lvl = getCardLevelFromCount(count);
  const revealDelay = progress.settings?.reducedMotion ? 120 : 1150;

  stage.textContent = "Синхронизация колоды";
  title.textContent = "Вытягиваем карту...";
  result.classList.remove("revealed");
  closeBtn.classList.remove("ready");
  closeBtn.disabled = true;
  icon.className = `sprite-icon ${getCardIconClass(def.id)}`;
  document.getElementById("cardPullName").textContent = def.name;
  document.getElementById("cardPullLevel").textContent = `Ур. ${lvl} (${lvl}/5)`;
  document.getElementById("cardPullEffect").textContent = lvl > 0 ? def.getEffect(lvl) : def.desc;

  overlay.classList.remove("hidden");
  overlay.classList.remove("revealed");
  overlay.classList.add("drawing");

  window.setTimeout(() => {
    overlay.classList.remove("drawing");
    overlay.classList.add("revealed");
    result.classList.add("revealed");
    stage.textContent = "Вобана!";
    title.textContent = "Карта выпала";
    closeBtn.disabled = false;
    closeBtn.classList.add("ready");
    showWaveToast(`Выбито: ${def.name}!`);
  }, revealDelay);
}

function closeCardPullOverlay() {
  document.getElementById("cardPullOverlay").classList.add("hidden");
}

function equipCard(id) {
  if ((progress.cards[id] || 0) <= 0) return;
  if (progress.equippedCards.includes(id)) {
    progress.equippedCards = progress.equippedCards.filter(c => c !== id);
  } else {
    if (progress.equippedCards.length >= progress.cardSlots) return;
    progress.equippedCards.push(id);
  }
  saveProgress();
  renderCards();
}

function unlockCardSlot() {
  const cost = CARD_SLOT_COSTS[progress.cardSlots];
  if (!cost || progress.crystals < cost) return;
  progress.crystals -= cost;
  progress.cardSlots += 1;
  saveProgress();
  renderCards();
}

function renderCards() {
  document.getElementById("cardsCrystals").textContent = progress.crystals || 0;
  const pullBtn = document.getElementById("pullCardBtn");
  const canPull = (progress.crystals || 0) >= CARD_PULL_COST;
  pullBtn.disabled = !canPull;
  pullBtn.classList.toggle("disabled", !canPull);
  
  const slotsGrid = document.getElementById("cardSlotsGrid");
  slotsGrid.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement("div");
    slot.className = "card-slot";
    if (i < progress.cardSlots) {
      const cardId = progress.equippedCards[i];
      if (cardId) {
        const def = cardDefs.find(c => c.id === cardId);
        const lvl = getCardLevelFromCount(progress.cards[cardId]);
        slot.className = "card-slot equipped";
        slot.innerHTML = `<div class="card-slot-icon"><i class="sprite-icon ${getCardIconClass(cardId)}"></i></div><strong>${def.name}</strong><span>Ур. ${lvl}</span><i>${def.getEffect(lvl)}</i>`;
        slot.addEventListener("click", () => equipCard(cardId));
      } else {
        slot.className = "card-slot";
        slot.innerHTML = `<b class="card-slot-plus">+</b><span>Пустой слот</span>`;
      }
    } else if (i === progress.cardSlots) {
      slot.className = "card-slot locked unlockable";
      slot.innerHTML = `<i class="card-lock"></i><strong>Разблокировать</strong><span><b>${CARD_SLOT_COSTS[i]} ♦</b></span>`;
      slot.addEventListener("click", unlockCardSlot);
    } else {
      slot.className = "card-slot locked hard-locked";
      slot.innerHTML = `<i class="card-lock"></i><strong>Заблокировано</strong>`;
    }
    slotsGrid.append(slot);
  }

  const invGrid = document.getElementById("cardsInventory");
  invGrid.innerHTML = "";
  cardDefs.forEach(def => {
    const count = progress.cards[def.id] || 0;
    const lvl = getCardLevelFromCount(count);
    const isEquipped = progress.equippedCards.includes(def.id);
    const canEquip = count > 0 && !isEquipped && progress.equippedCards.length < progress.cardSlots;
    const card = document.createElement("div");
    card.className = `card-item ${count > 0 ? "owned" : "locked"} ${isEquipped ? "equipped-inv" : ""} ${canEquip ? "can-equip" : ""}`;
    card.innerHTML = `<div class="card-owned-check" aria-hidden="true"></div>
      <div class="card-icon-frame"><i class="sprite-icon ${getCardIconClass(def.id)}"></i></div>
      <div class="card-copy">
        <strong>${def.name}</strong>
        <span>Ур. ${lvl} (${lvl}/5)</span>
      </div>
      <i class="card-desc">${lvl > 0 ? def.getEffect(lvl) : def.desc}</i>`;
    if (count > 0) card.addEventListener("click", () => equipCard(def.id));
    invGrid.append(card);
  });
}

// --- МОДУЛИ ---
function pullModule() {
  if (progress.moduleParts < 50) return;
  progress.moduleParts -= 50;
  const typeDef = moduleTypes[Math.floor(Math.random() * moduleTypes.length)];
  const r = Math.random();
  const rarity = r > 0.95 ? 2 : (r > 0.7 ? 1 : 0); // 5% Epic, 25% Rare, 70% Common
  const uniquePool = moduleUniqueDefs.filter((def) => def.type === typeDef.id);
  const unique = rarity >= 1 && uniquePool.length && Math.random() < (rarity >= 2 ? 0.7 : 0.25)
    ? uniquePool[Math.floor(Math.random() * uniquePool.length)].id
    : null;
  const mod = { id: Date.now() + Math.random(), type: typeDef.id, rarity, unique };
  progress.modules.push(mod);
  saveProgress();
  renderModules();
  audio.play("crit");
  showWaveToast(`Получен модуль: ${unique ? moduleUniqueDefs.find((def) => def.id === unique).name : typeDef.name} (${rarityNames[rarity]})!`);
}

function equipModule(id, type) {
  if (progress.equippedModules[type] === id) progress.equippedModules[type] = null;
  else progress.equippedModules[type] = id;
  saveProgress();
  renderModules();
}

function mergeModules() {
  let merged = true;
  let mergeCount = 0;
  while(merged) {
    merged = false;
    for (const type of moduleTypes) {
      for (let r = 0; r < 3; r++) { // 0=Common, 1=Rare, 2=Epic. Max is 3=Legendary.
        const matches = progress.modules.filter(m => m.type === type.id && m.rarity === r && !Object.values(progress.equippedModules).includes(m.id));
        if (matches.length >= 3) {
          for (let i = 0; i < 3; i++) {
            const idx = progress.modules.findIndex(m => m.id === matches[i].id);
            progress.modules.splice(idx, 1);
          }
          progress.modules.push({ id: Date.now()+Math.random(), type: type.id, rarity: r+1, unique: matches.find((m) => m.unique)?.unique || null });
          merged = true;
          mergeCount++;
        }
      }
    }
  }
  if (mergeCount > 0) {
    saveProgress();
    renderModules();
    audio.play("crit");
    showWaveToast(`Успешных слияний: ${mergeCount}!`);
  } else {
    showWaveToast("Не хватает дубликатов.");
  }
}

function renderModules() {
  document.getElementById("modulesParts").textContent = progress.moduleParts || 0;
  const slotsGrid = document.getElementById("moduleSlotsGrid");
  slotsGrid.innerHTML = "";
  moduleTypes.forEach(def => {
    const eqId = progress.equippedModules[def.id];
    const slot = document.createElement("div");
    if (eqId) {
      const mod = progress.modules.find(m => m.id === eqId);
      const unique = moduleUniqueDefs.find((item) => item.id === mod.unique);
      slot.className = `card-slot equipped rarity-${mod.rarity}`;
      slot.innerHTML = `<strong>${unique?.name || def.name}</strong><span>${rarityNames[mod.rarity]}</span><i style="margin-top:2px; font-size:0.85rem; line-height:1.15;">${unique?.desc || def.desc} ${def.mults[mod.rarity]}x</i>`;
      slot.addEventListener("click", () => equipModule(eqId, def.id));
    } else {
      slot.className = "card-slot";
      slot.innerHTML = `<span>Слот<br><b>${def.name}</b></span>`;
    }
    slotsGrid.append(slot);
  });

  const invGrid = document.getElementById("modulesInventory");
  invGrid.innerHTML = "";
  progress.modules.forEach(mod => {
    const def = moduleTypes.find(t => t.id === mod.type);
    const unique = moduleUniqueDefs.find((item) => item.id === mod.unique);
    const isEq = Object.values(progress.equippedModules).includes(mod.id);
    const card = document.createElement("div");
    card.className = `card-item owned rarity-${mod.rarity} ${isEq ? "equipped-inv" : ""}`;
    card.innerHTML = `<strong>${unique?.name || def.name}</strong><span>${rarityNames[mod.rarity]}</span><i style="margin-top:2px; font-size:0.85rem; line-height:1.15;">${unique?.desc || def.desc} ${def.mults[mod.rarity]}x</i>`;
    card.addEventListener("click", () => equipModule(mod.id, def.id));
    invGrid.append(card);
  });
}

function renderCustomization() {
  document.getElementById("customMedals").textContent = progress.medals;
  
  const shapesGrid = document.getElementById("customShapes");
  shapesGrid.innerHTML = "";
  cosmeticDefs.shapes.forEach(def => {
    const owned = progress.unlockedCosmetics.includes(def.id);
    const equipped = progress.customization.shape === def.id;
    const card = document.createElement("div");
    card.className = `card-item ${owned ? "owned" : ""} ${equipped ? "equipped-inv" : ""}`;
    card.innerHTML = `<strong>${def.name}</strong><span>${def.label || `${def.sides} граней`}</span><i style="margin-top:2px; font-size:0.85rem; line-height:1.15;">${owned ? (equipped ? "Надето" : "Выбрать") : `${def.cost} Медалей`}</i>`;
    card.addEventListener("click", () => handleCosmeticClick(def.id, "shape", def.cost));
    shapesGrid.append(card);
  });

  const colorsGrid = document.getElementById("customColors");
  colorsGrid.innerHTML = "";
  cosmeticDefs.colors.forEach(def => {
    const owned = progress.unlockedCosmetics.includes(def.id);
    const equipped = progress.customization.color === def.id;
    const card = document.createElement("div");
    card.className = `card-item ${owned ? "owned" : ""} ${equipped ? "equipped-inv" : ""}`;
    card.innerHTML = `<div style="width:20px;height:20px;border-radius:10px;background:${def.color};margin:0 auto 4px;box-shadow:0 0 10px ${def.color};"></div><strong>${def.name}</strong><i style="margin-top:2px; font-size:0.85rem; line-height:1.15;">${owned ? (equipped ? "Надето" : "Выбрать") : `${def.cost} Медалей`}</i>`;
    card.addEventListener("click", () => handleCosmeticClick(def.id, "color", def.cost));
    colorsGrid.append(card);
  });
}

function handleCosmeticClick(id, type, cost) {
  if (!progress.unlockedCosmetics.includes(id)) {
    if (progress.medals < cost) return;
    progress.medals -= cost;
    progress.spentMedals = (progress.spentMedals || 0) + cost;
    progress.unlockedCosmetics.push(id);
  }
  progress.customization[type] = id;
  saveProgress();
  renderCustomization();
  drawIdleArena(); // Обновляем ядро прямо в меню!
}

function renderPermanentShop() {
  document.getElementById("permCoins").textContent = Math.floor(progress.coins);
  const nextMilestone = milestoneDefs.find((milestone) => !progress.milestones[milestone.id]);
  document.getElementById("prestigePanel").innerHTML =
    `<div style="display:flex; align-items:center; gap:12px;">
       <i class="sprite-icon icon-prestige" style="width:42px; height:42px;"></i>
       <div>
         <strong>Престиж ${progress.prestige || 0}</strong>
         <span style="display:block; font-size:0.85rem; margin-top:4px; line-height:1.2;">Каждое очко престижа дает +4% урона башни. Старт забега: ${getStarterRunLoadoutSummary()}. ${nextMilestone ? `Следующий рубеж: волна ${nextMilestone.wave}, награда ${nextMilestone.text}.` : "Все текущие рубежи получены."}</span>
       </div>
     </div>`;
  const list = document.getElementById("permanentList");
  list.innerHTML = "";
  permanentDefs.forEach((def) => {
    const level = progress.permanent[def.id] || 0;
    const cost = getPermanentCost(def, level);
    const card = document.createElement("div");
    const canBuy = progress.coins >= cost && level < def.max;
    const progressPercent = Math.max(0, Math.min(100, (level / def.max) * 100));
    const iconClass = permanentIconMap[def.id] || "icon-tower-upgrade";
    card.className = `shop-card permanent-upgrade-card ${canBuy ? "can-buy" : "disabled"}`;
    card.innerHTML = `<button class="upgrade-info-btn permanent-info-btn" data-info-type="permanent" data-info-id="${def.id}" type="button" aria-label="Информация"></button>
      <div class="permanent-card-head">
        <div class="permanent-icon-frame"><i class="sprite-icon permanent-upgrade-icon ${iconClass}"></i></div>
        <div class="permanent-title-block">
          <strong>${def.name}</strong>
          <span>Ур. ${level}</span>
        </div>
      </div>
      <div class="permanent-progress" style="--progress-percent:${progressPercent}%" aria-hidden="true"><i></i></div>
      <p>${def.desc}</p>
      <div class="permanent-effect">Сейчас: ${def.getEffect(level)}</div>
      ${getPermanentStarterText(def.id, level) ? `<div class="permanent-effect permanent-starter-effect">${getPermanentStarterText(def.id, level)}</div>` : ""}
      <div class="permanent-card-footer">
        <div class="permanent-price ${level >= def.max ? "is-max" : ""}">
          ${level >= def.max ? "Макс." : `<i class="sprite-icon icon-coin" aria-hidden="true"></i><span>${cost}</span>`}
        </div>
      </div>`;
    const btn = document.createElement("button");
    btn.className = "permanent-buy-btn";
    btn.textContent = level >= def.max ? "Макс" : "Купить";
    btn.disabled = !canBuy;
    btn.addEventListener("click", () => buyPermanentUpgrade(def.id));
    card.append(btn);
    list.append(card);
  });
}

function buyStoneUpgrade(type) {
  const cost = type === "dmg" ? 10 : 25;
  if (progress.powerStones < cost) return;
  progress.powerStones -= cost;
  progress.stoneUpgrades[type] = (progress.stoneUpgrades[type] || 0) + 1;
  // Пересчитываем КД
  if (type === "cd") {
    ultimateDefs.forEach(def => {
      if (progress.ultimates[def.id]) progress.ultimates[def.id].cooldown = Math.max(1, def.cooldown - progress.stoneUpgrades.cd * 0.5);
    });
  }
  saveProgress();
  renderUltimateShop();
}

function renderUltimateShop() {
  document.getElementById("ultimateCoins").textContent = Math.floor(progress.coins);
  const selectedIds = getSelectedUltimateIds();
  
  document.getElementById("ultimateStones").textContent = progress.powerStones || 0;
  const stoneShop = document.getElementById("stoneShopList");
  stoneShop.innerHTML = `
    <div class="shop-card ultimate-stone-card"><div class="ultimate-stone-head"><strong>Урон УО</strong><span>Ур. ${progress.stoneUpgrades.dmg || 0}</span></div><p>+5% урона ультимативного оружия за уровень</p><div class="ultimate-stone-footer"><div class="ultimate-stone-price"><i class="sprite-icon icon-stone" aria-hidden="true"></i><span>10</span></div>
    <button class="primary-btn ultimate-stone-btn" onclick="buyStoneUpgrade('dmg')" ${progress.powerStones < 10 ? "disabled" : ""}>Купить</button></div></div>
    <div class="shop-card ultimate-stone-card"><div class="ultimate-stone-head"><strong>КД УО</strong><span>Ур. ${progress.stoneUpgrades.cd || 0}</span></div><p>-0.5с перезарядки ультимативного оружия за уровень</p><div class="ultimate-stone-footer"><div class="ultimate-stone-price"><i class="sprite-icon icon-stone" aria-hidden="true"></i><span>25</span></div>
    <button class="primary-btn ultimate-stone-btn" onclick="buyStoneUpgrade('cd')" ${progress.powerStones < 25 ? "disabled" : ""}>Купить</button></div></div>
  `;

  document.getElementById("ultimateLoadoutInfo").innerHTML =
    `<strong>Загрузка ${selectedIds.length}/${ultimateLoadoutLimit}</strong><span>Выбери до 3 открытых оружий перед забегом.</span>`;
  document.getElementById("ultimateSelectedIcons").innerHTML = Array.from({ length: ultimateLoadoutLimit }, (_, index) => {
    const id = selectedIds[index];
    return id
      ? `<span class="ultimate-selected-icon"><i class="sprite-icon ${getUltimateIconClass(id)}"></i></span>`
      : `<span class="ultimate-selected-icon empty"></span>`;
  }).join("");
  const list = document.getElementById("ultimateList");
  list.innerHTML = "";
  ultimateDefs.forEach((def) => {
    const data = progress.ultimates[def.id];
    const nextCost = data.owned ? Math.floor(def.cost * Math.pow(1.9, data.level)) : def.cost;
    const canBuy = progress.coins >= nextCost;
    const isLockedByCost = !data.owned && !canBuy;
    const iconClass = getUltimateIconClass(def.id);
    const card = document.createElement("div");
    card.className = `shop-card ultimate-upgrade-card ${canBuy ? "can-buy" : ""} ${isLockedByCost ? "disabled" : ""} ${data.owned && !canBuy ? "cant-upgrade" : ""} ${data.enabled && data.owned ? "selected" : ""}`;
    card.innerHTML = `<button class="upgrade-info-btn ultimate-info-btn" data-info-type="ultimate" data-info-id="${def.id}" type="button" aria-label="Информация"></button>
      <div class="ultimate-card-head">
        <div class="ultimate-icon-frame"><i class="sprite-icon ultimate-upgrade-icon ${iconClass}"></i></div>
        <div class="ultimate-title-block">
          <strong>${def.name}</strong>
          <span>${data.owned ? `Ур. ${data.level}` : "Не открыто"}</span>
        </div>
      </div>
      <p>${def.desc}</p>
      <div class="ultimate-effect">${def.getUpgradeInfo(data.level)}</div>
      <div class="ultimate-card-footer">
        <div class="ultimate-price"><i class="sprite-icon icon-coin" aria-hidden="true"></i><span>${nextCost}</span></div>
        <div class="ultimate-cooldown">КД ${def.cooldown}с</div>
      </div>`;
    const actions = document.createElement("div");
    actions.className = "shop-actions ultimate-actions";
    if (data.owned) actions.classList.add("has-toggle");
    const btn = document.createElement("button");
    btn.className = "ultimate-buy-btn";
    btn.textContent = data.owned ? "Улучшить" : "Открыть";
    btn.disabled = !canBuy;
    btn.addEventListener("click", () => buyUltimate(def.id));
    actions.append(btn);
    if (data.owned) {
      const toggle = document.createElement("button");
      toggle.className = `toggle-btn ultimate-toggle-btn ${data.enabled ? "" : "off"}`;
      toggle.textContent = data.enabled ? "В загрузке" : "Резерв";
      toggle.disabled = !data.enabled && selectedIds.length >= ultimateLoadoutLimit;
      toggle.addEventListener("click", () => toggleUltimate(def.id));
      actions.append(toggle);
    }
    card.append(actions);
    list.append(card);
  });
}

function buyUltimate(id) {
  const def = ultimateDefs.find((u) => u.id === id);
  const data = progress.ultimates[id];
  const cost = data.owned ? Math.floor(def.cost * Math.pow(1.9, data.level)) : def.cost;
  if (progress.coins < cost) return;
  progress.coins -= cost;
  progress.spentCoins = (progress.spentCoins || 0) + cost;
  data.owned = true;
  data.level += 1;
  data.enabled = data.enabled || getSelectedUltimateIds().length < ultimateLoadoutLimit;
  saveProgress();
  renderUltimateShop();
}

function toggleUltimate(id) {
  const data = progress.ultimates[id];
  if (!data.enabled && getSelectedUltimateIds().length >= ultimateLoadoutLimit) return;
  data.enabled = !data.enabled;
  saveProgress();
  renderUltimateShop();
}

function normalizeUltimateLoadout() {
  let selected = 0;
  ultimateDefs.forEach((def) => {
    const data = progress.ultimates[def.id];
    if (!data?.owned || !data.enabled) return;
    selected += 1;
    if (selected > ultimateLoadoutLimit) data.enabled = false;
  });
}

function renderEvents() {
  document.getElementById("eventMedals").textContent = progress.medals;
  renderDailyQuests();
  renderEventModes();
  renderEventShop();
  const list = document.getElementById("eventList");
  list.innerHTML = "";
  const heading = document.createElement("div");
  heading.className = "info-panel";
  heading.innerHTML = `<strong>Миссии</strong><span style="display:block; font-size:0.85rem; margin-top:4px;">Лучший ивент-счет: ${progress.events.bestScore || 0}</span>`;
  list.append(heading);
  eventDefs.forEach((mission) => {
    const value = getMissionValue(mission);
    const complete = value >= mission.target;
    const claimed = progress.events.claimed[mission.id];
    const card = document.createElement("div");
    card.className = `mission-card ${complete ? "done" : ""}`;
    card.innerHTML = `<strong>${mission.name}</strong><span style="font-size:0.85rem; line-height:1.2; margin-top:2px;">${Math.min(value, mission.target)} / ${mission.target} - награда ${mission.rewardMedals} медалей, <b style="color:var(--accent-pink)">${mission.rewardCrystals} ♦</b> ${claimed ? "- получено" : ""}</span>`;
    if (complete && !claimed) {
      const btn = document.createElement("button");
      btn.textContent = "Забрать";
      btn.className = "secondary-btn wide";
      btn.addEventListener("click", () => claimMission(mission));
      card.append(btn);
    }
    list.append(card);
  });
}

function renderDailyQuests() {
  const list = document.getElementById("dailyQuestsList");
  list.innerHTML = "";
  const heading = document.createElement("div");
  heading.className = "info-panel";
  heading.innerHTML = `<strong>Ежедневные задания</strong><span style="display:block; font-size:0.85rem; margin-top:4px;">Обновляются каждый день. Выполняй, чтобы получать Кристаллы.</span>`;
  list.append(heading);
  progress.dailyQuests.list.forEach((quest) => {
    const complete = quest.current >= quest.target;
    const card = document.createElement("div");
    card.className = `mission-card ${complete ? "done" : ""}`;
    card.innerHTML = `<strong>${quest.name}</strong><span style="font-size:0.85rem; line-height:1.2; margin-top:2px;">${quest.desc} (${quest.current} / ${quest.target}) - <b style="color:var(--accent-pink)">+${quest.reward} ♦</b> ${quest.claimed ? "получено" : ""}</span>`;
    if (complete && !quest.claimed) {
      const btn = document.createElement("button");
      btn.textContent = "Забрать";
      btn.className = "secondary-btn wide";
      btn.addEventListener("click", () => {
        quest.claimed = true;
        progress.crystals += quest.reward;
        saveProgress();
        renderEvents();
        audio.play("coin");
      });
      card.append(btn);
    }
    list.append(card);
  });
}

function renderEventModes() {
  const list = document.getElementById("eventModes");
  list.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "info-panel";
  intro.innerHTML = `<strong>Ивент-забеги</strong><span style="display:block; font-size:0.85rem; margin-top:4px;">Особые локальные модификаторы. Ивент-счет превращается в медали после поражения.</span>`;
  list.append(intro);
  eventModeDefs.forEach((mode) => {
    const card = document.createElement("div");
    card.className = "shop-card featured";
    card.innerHTML = `<div><strong>${mode.name}</strong><div style="font-size:0.85rem; line-height:1.2; margin-bottom:4px; margin-top:2px;">${mode.desc}</div><span style="font-size:0.8rem;">Лучший счет: ${progress.events[`${mode.id}Best`] || 0}</span></div>`;
    const btn = document.createElement("button");
    btn.textContent = "Старт";
    btn.addEventListener("click", () => startRun({ eventMode: mode.id }));
    card.append(btn);
    list.append(card);
  });
}

function renderEventShop() {
  const list = document.getElementById("eventShop");
  list.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "info-panel";
  intro.innerHTML = `<strong>Магазин медалей</strong><span style="display:block; font-size:0.85rem; margin-top:4px;">Трать медали на постоянные бонусы аккаунта.</span>`;
  list.append(intro);
  eventShopDefs.forEach((def) => {
    const level = progress.eventShop[def.id] || 0;
    const cost = getEventShopCost(def, level);
    const card = document.createElement("div");
    card.className = `shop-card ${progress.medals < cost ? "disabled" : ""}`;
    card.innerHTML = `<div>
      <div class="upgrade-head">
        <strong>${def.name} Ур.${level}</strong>
        <div class="upgrade-info-btn" data-info-type="event" data-info-id="${def.id}">i</div>
      </div>
      <div style="font-size:0.85rem; line-height:1.2; margin-bottom:4px;">${def.desc}</div>
      <div style="color:var(--accent-cyan); font-size:0.85rem; margin-top:2px;">Эффект: ${def.getEffect(level)}</div>
      <span style="font-size:0.8rem;">${level >= def.max ? "Макс. уровень" : `${cost} медалей`}</span>
    </div>`;
    const btn = document.createElement("button");
    btn.textContent = level >= def.max ? "Макс" : "Купить";
    btn.disabled = level >= def.max || progress.medals < cost;
    btn.addEventListener("click", () => buyEventShop(def.id));
    card.append(btn);
    list.append(card);
  });
}

function getEventShopCost(def, level) {
  return Math.floor(def.cost * Math.pow(1.45, level));
}

function buyEventShop(id) {
  const def = eventShopDefs.find((item) => item.id === id);
  const level = progress.eventShop[id] || 0;
  const cost = getEventShopCost(def, level);
  if (level >= def.max || progress.medals < cost) return;
  progress.medals -= cost;
  progress.spentMedals = (progress.spentMedals || 0) + cost;
  progress.eventShop[id] += 1;
  saveProgress();
  renderEvents();
}

function getMissionValue(mission) {
  if (mission.metric === "bestWave") return progress.bestWave;
  return progress.events[mission.metric] || 0;
}

function claimMission(mission) {
  progress.events.claimed[mission.id] = true;
  progress.medals += mission.rewardMedals || 0;
  progress.crystals = (progress.crystals || 0) + (mission.rewardCrystals || 0);
  saveProgress();
  renderEvents();
}

function clearRunOverlays() {
  document.getElementById("bossBar").classList.add("hidden");
  document.getElementById("ultimateHud").innerHTML = "";
  document.getElementById("bossRewardOverlay").classList.add("hidden");
  document.getElementById("perkOverlay").classList.add("hidden");
  closeGameGearMenu();
}

function buildRunSummary(commit = false) {
  if (!game) return null;
  const reachedWave = Math.max(0, game.wave);
  const tierReward = 1 + (game.tier - 1) * 0.65;
  const coinBonus = 1 + progress.permanent.coinBonus * 0.02;
  const medalCoinBonus = 1 + (progress.eventShop.medalCoins || 0) * 0.03;
  const labCoinMult = 1 + (progress.labs.levels.labCoins || 0) * 0.015;
  const waveCoins = Math.pow(reachedWave, 1.18) * balance.coinWaveBonus;
  const killCoins = game.stats.kills * balance.coinKillRate;
  const bossCoins = game.stats.bossKills * (balance.coinBossBonus + game.tier * 8);
  const earnedCoins = Math.floor((game.totalCash * balance.coinCashRate + waveCoins + killCoins + bossCoins) * tierReward * coinBonus * medalCoinBonus * labCoinMult);
  const eventScore = calculateEventScore(reachedWave);
  const earnedMedals = game.eventMode ? Math.max(1, Math.floor(eventScore / 120)) : 0;
  const milestoneRewards = grantMilestones(reachedWave, commit);
  const bestWave = commit ? Math.max(progress.bestWave, reachedWave) : Math.max(progress.bestWave, reachedWave);
  return { reachedWave, earnedCoins, earnedMedals, milestoneRewards, bestWave, eventScore };
}

function finalizeRunRewards() {
  if (!game || game.finalized) return buildRunSummary(false);
  const summary = buildRunSummary(true);
  game.finalized = true;

  if (game.eventMode === "tournament") {
    progress.powerStones += Math.floor(summary.reachedWave / 10);
  }

  trackDailyQuest("kills", game.stats.kills);
  trackDailyQuest("bosses", game.stats.bossKills);
  trackDailyQuest("waves", summary.reachedWave);
  trackDailyQuest("upgrades", game.stats.runUpgrades);

  progress.coins += summary.earnedCoins;
  progress.medals += summary.earnedMedals;
  progress.playTime = (progress.playTime || 0) + game.stats.playTime;
  progress.totalKills = (progress.totalKills || 0) + game.stats.kills;
  progress.totalBosses = (progress.totalBosses || 0) + game.stats.bossKills;
  progress.bestWave = Math.max(progress.bestWave, summary.reachedWave);
  progress.tiers[game.tier] = Math.max(progress.tiers[game.tier] || 0, summary.reachedWave);
  progress.events.kills += game.stats.kills;
  progress.events.bossKills += game.stats.bossKills;
  progress.events.runUpgrades += game.stats.runUpgrades;
  progress.events.maxRunUpgrades = Math.max(progress.events.maxRunUpgrades || 0, game.stats.runUpgrades);
  progress.events.cashEarned += game.stats.cashEarned;
  if (game.eventMode) {
    progress.events.bestScore = Math.max(progress.events.bestScore || 0, summary.eventScore);
    progress.events[`${game.eventMode}Best`] = Math.max(progress.events[`${game.eventMode}Best`] || 0, summary.eventScore);
  }
  saveProgress();
  summary.bestWave = progress.bestWave;
  return summary;
}

function renderDefeatScreen(summary, canRevive) {
  document.getElementById("resultWave").textContent = summary.reachedWave;
  document.getElementById("resultCoins").textContent = formatRunRewards(summary.earnedCoins, summary.earnedMedals, summary.milestoneRewards);
  document.getElementById("resultBest").textContent = summary.bestWave;
  document.getElementById("resultKills").textContent = game.stats.kills;
  document.getElementById("resultBosses").textContent = game.stats.bossKills;
  document.getElementById("resultCash").textContent = Math.floor(game.totalCash);
  document.getElementById("revivePanel").classList.toggle("hidden", !canRevive);
}

function endRun(manualQuit = false, options = {}) {
  if (!game || game.ended) return;
  const shouldFinalize = options.finalize !== false;
  game.ended = true;
  game.awaitingRevive = !shouldFinalize && !manualQuit;
  paused = false;
  cancelAnimationFrame(animationId);
  const summary = shouldFinalize ? finalizeRunRewards() : buildRunSummary(false);
  renderDefeatScreen(summary, game.awaitingRevive);
  clearRunOverlays();
  showScreen("defeat");
  bgm.update();

  const againBtn = document.getElementById("againBtn");
  if (progress.settings.autoRestart && !manualQuit) {
    let countdown = 3;
    againBtn.textContent = `Авто-рестарт (${countdown})...`;
    const restartInterval = setInterval(() => {
      if (!screens.defeat.classList.contains("active")) {
        clearInterval(restartInterval);
        againBtn.textContent = "Играть снова";
        return;
      }
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(restartInterval);
        againBtn.textContent = "Играть снова";
        restartFromDefeat();
      } else {
        againBtn.textContent = `Авто-рестарт (${countdown})...`;
      }
    }, 1000);
  } else {
    againBtn.textContent = "Играть снова";
  }
}

function restartFromDefeat() {
  const eventMode = game?.eventMode || null;
  if (game) finalizeRunRewards();
  startRun({ eventMode });
}

function exitDefeatToMenu() {
  if (game) finalizeRunRewards();
  returnToMenu();
}

function reviveRun() {
  if (!game?.awaitingRevive || game.finalized) return;
  const reviveWave = Math.max(1, game.reviveWave || game.wave || 1);
  game.ended = false;
  game.awaitingRevive = false;
  game.deathSequence = null;
  game.tower.hp = Math.max(1, game.tower.maxHp * 0.42);
  game.tower.hitTimer = 0;
  game.tower.rapidFireTimer = 0;
  game.enemies = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.missiles = [];
  game.landmines = [];
  game.effects = [];
  game.texts = [];
  game.spawnQueue = [];
  game.spawnTimer = 0;
  game.wave = reviveWave - 1;
  game.waveState = "pause";
  game.nextWaveTimer = 0.7;
  game.nextWaveDelay = 0.7;
  game.waveDuration = 0;
  game.waveTimeRemaining = 0;
  paused = false;
  document.getElementById("hudPlayPauseBtn").textContent = "⏸";
  clearRunOverlays();
  showScreen("game");
  positionTowerInVisibleArena();
  updateHud();
  renderRunUpgrades();
  showWaveToast(`Воскрешение: волна ${reviveWave}`);
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
  bgm.update();
}

function returnToMenu() {
  cancelAnimationFrame(animationId);
  game = null;
  paused = false;
  clearRunOverlays();
  showScreen("menu");
  drawIdleArena();
  bgm.update();
}

function pauseRunToMenu() {
  if (!hasActiveRun()) {
    returnToMenu();
    return;
  }
  cancelAnimationFrame(animationId);
  paused = true;
  document.getElementById("hudPlayPauseBtn").textContent = "▶";
  closeGameGearMenu();
  showScreen("menu");
}

function continueRun() {
  if (!hasActiveRun()) return;
  paused = false;
  document.getElementById("hudPlayPauseBtn").textContent = "⏸";
  closeGameGearMenu();
  showScreen("game");
  updateHud();
  renderRunUpgrades();
  lastFrame = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
  bgm.update();
}

function toggleGameGearMenu() {
  document.getElementById("gameGearMenu").classList.toggle("hidden");
}

function closeGameGearMenu() {
  document.getElementById("gameGearMenu")?.classList.add("hidden");
}

function openGameSettings() {
  if (hasActiveRun()) {
    cancelAnimationFrame(animationId);
    paused = true;
    document.getElementById("hudPlayPauseBtn").textContent = "▶";
  }
  closeGameGearMenu();
  showScreen("settings");
}

function formatRunRewards(coins, medals, milestones) {
  const parts = [`${coins} монет`];
  if (medals) parts.push(`${medals} медалей`);
  if (milestones.length) parts.push(`Рубежи: ${milestones.join("; ")}`);
  return parts.join(" | ");
}

function calculateEventScore(reachedWave) {
  if (!game.eventMode) return 0;
  const mode = eventModeDefs.find((item) => item.id === game.eventMode);
  return Math.floor((reachedWave * 20 + game.stats.kills * 2 + game.stats.bossKills * 80 + game.totalCash * 0.12) * (mode?.reward || 1));
}

function grantMilestones(reachedWave, commit = true) {
  const gained = [];
  milestoneDefs.forEach((milestone) => {
    if (reachedWave < milestone.wave || progress.milestones[milestone.id]) return;
    if (commit) {
      progress.milestones[milestone.id] = true;
      progress.coins += milestone.reward.coins || 0;
      progress.medals += milestone.reward.medals || 0;
      progress.prestige = (progress.prestige || 0) + (milestone.reward.prestige || 0);
      progress.crystals = (progress.crystals || 0) + (milestone.reward.crystals || 0);
      game.stats.milestones.push(milestone.text);
    }
    gained.push(milestone.text);
  });
  return gained;
}

function updateHud() {
  const t = game.tower;
  document.getElementById("hudWave").textContent = game.wave;
  document.getElementById("hudHealth").textContent = `${Math.max(0, Math.ceil(t.hp))}/${Math.ceil(t.maxHp)} ${t.hp > t.maxHp ? '🔥' : ''}`;
  document.getElementById("hudHealthFill").style.width = `${Math.max(0, Math.min(100, (Math.min(t.hp, t.maxHp) / t.maxHp) * 100))}%`;
  
  const overhealPct = Math.max(0, Math.min(100, ((t.hp - t.maxHp) / (t.maxHp * t.packageMax || 1)) * 100));
  document.getElementById("hudOverhealFill").style.width = t.hp > t.maxHp ? `${overhealPct}%` : "0%";
  document.getElementById("hudCash").textContent = Math.floor(game.cash);
  document.getElementById("hudCoins").textContent = Math.floor(progress.coins);
  document.getElementById("hudCrystals").textContent = progress.crystals || 0;
  document.getElementById("hudStones").textContent = progress.powerStones || 0;
  document.getElementById("hudParts").textContent = progress.moduleParts || 0;
  document.getElementById("hudDamage").textContent = Math.round(t.damage);
  document.getElementById("hudRegen").textContent = t.regen.toFixed(1);
  document.getElementById("hudCoinMult").textContent = (1 + t.cashBonus).toFixed(2);
  document.getElementById("hudEnemyPower").textContent = getWaveThreatText();
  document.getElementById("hudWaveTimer").style.width = `${getWaveTimerPercent()}%`;
  
  const timerEl = document.getElementById("hudWaveTimer");
  if (game.waveState === "pause") timerEl.classList.add("prep");
  else timerEl.classList.remove("prep");

  updateBossBar();
  updateTowerStats();
}

function updateTowerStats() {
  if (!game) return;
  const t = game.tower;
  const synergies = game.synergies.length ? game.synergies.map((item) => item.name).join(", ") : "нет";
  const mode = game.eventMode ? eventModeDefs.find((item) => item.id === game.eventMode)?.name : "Обычный";
  document.getElementById("towerStats").textContent =
        `Урон ${Math.round(t.damage)} | Крит ${Math.round(t.critChance * 100)}% | С-Крит ${Math.round(t.superCritChance * 100)}% | Броня ${Math.round(t.absDefense)} / ${Math.round(t.defensePercent * 100)}% | Инвест ${Math.round(t.interestRate * 100)}%`;
}

function getWaveTimerPercent() {
  if (!game) return 0;
  if (game.waveState === "pause") {
    const delay = game.nextWaveDelay || game.nextWaveTimer || 1;
    // При паузе (подготовке) полоса ЗАПОЛНЯЕТСЯ от 0 до 100%
    return Math.max(0, Math.min(100, ((delay - game.nextWaveTimer) / delay) * 100));
  }
  if (game.waveState === "reward") return 100;
  
  // При активной волне полоса ОПУСТОШАЕТСЯ от 100 до 0%
  return Math.max(0, Math.min(100, (game.waveTimeRemaining / game.waveDuration) * 100));
}

function getWaveThreatText() {
  if (!game) return "ATK 0 / HP 0";
  let maxAtk = 0;
  let maxHp = 0;

  game.enemies.forEach(e => {
    if (e.damage > maxAtk) maxAtk = e.damage;
    if (e.maxHp > maxHp) maxHp = e.maxHp;
  });

  const bossIndex = Math.max(1, Math.floor(game.wave / 10));
  game.spawnQueue.forEach(item => {
    const type = typeof item === "string" ? item : item.type;
    const elite = typeof item === "object" ? item.elite : false;
    const def = enemyDefs[type];
    const scale = type === "boss" ? Math.pow(balance.bossHpGrowth, bossIndex - 1) * game.tierMult : Math.pow(balance.waveHpGrowth, Math.max(0, game.wave - 1)) * game.tierMult;
    let hp = def.hp * scale;
    let damage = def.damage * (type === "boss" ? Math.pow(balance.bossDamageGrowth, bossIndex - 1) : Math.pow(balance.waveDamageGrowth, Math.max(0, game.wave - 1))) * game.tierMult;
    if (elite) { hp *= 2.6; damage *= 1.7; }
    if (hp > maxHp) maxHp = hp;
    if (damage > maxAtk) maxAtk = damage;
  });
  
  return `ATK ${Math.ceil(maxAtk)} / HP ${Math.ceil(maxHp)}`;
}

function updateBossBar() {
  const boss = game.enemies.find((enemy) => enemy.type === "boss");
  const bar = document.getElementById("bossBar");
  if (!boss) {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");
  document.getElementById("bossFill").style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
}

function getUltimateIcon(id) {
  const iconClassMap = {
    stormChain: "icon-ultimate-storm-chain",
    timeField: "icon-ultimate-time-field",
    missileSwarm: "icon-ultimate-missile-swarm",
    solarBeam: "icon-ultimate-solar-beam",
    goldenCore: "icon-ultimate-golden-core",
    blackHole: "icon-ultimate-black-hole",
    deathWave: "icon-ultimate-death-wave",
    poisonSwamp: "icon-ultimate-poison-swamp",
  };
  const iconClass = iconClassMap[id] || "icon-tower-upgrade";
  return `<i class="sprite-icon ${iconClass}" aria-hidden="true"></i>`;
}

function getUltimateIconClass(id) {
  const iconClassMap = {
    stormChain: "icon-ultimate-storm-chain",
    timeField: "icon-ultimate-time-field",
    missileSwarm: "icon-ultimate-missile-swarm",
    solarBeam: "icon-ultimate-solar-beam",
    goldenCore: "icon-ultimate-golden-core",
    blackHole: "icon-ultimate-black-hole",
    deathWave: "icon-ultimate-death-wave",
    poisonSwamp: "icon-ultimate-poison-swamp",
  };
  return iconClassMap[id] || "icon-tower-upgrade";
}

function renderProfile() {
  document.getElementById("playerIdDisplay").textContent = "ID: " + progress.playerId;
  
  const totalSecs = Math.floor(progress.playTime || 0);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  document.getElementById("statPlayTime").textContent = `${hours}ч ${mins}м`;
  document.getElementById("statTotalKills").textContent = (progress.totalKills || 0).toLocaleString();
  document.getElementById("statTotalBosses").textContent = (progress.totalBosses || 0).toLocaleString();
  document.getElementById("statSpentCoins").textContent = (progress.spentCoins || 0).toLocaleString();
  document.getElementById("statSpentMedals").textContent = (progress.spentMedals || 0).toLocaleString();

}

function getBestiaryIconSvg(type, color) {
  if (type === "scout") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 29,28 3,28" fill="${color}"/></svg>`;
  if (type === "assassin") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 24,28 8,28" fill="${color}"/></svg>`;
  if (type === "grunt") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><rect x="7" y="7" width="18" height="18" transform="rotate(45 16 16)" fill="${color}"/></svg>`;
  if (type === "brute" || type === "boss" || type === "armored") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="${color}"/></svg>`;
  if (type === "shooter") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 24.7,8 24.7,18 16,29 7.3,18 7.3,8" fill="${color}"/></svg>`;
  if (type === "splitter") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 19.5,11.2 28.5,11.8 21.5,17.6 24,27 16,21.8 8,27 10.5,17.6 3.5,11.8 12.5,11.2" fill="${color}"/></svg>`;
  if (type === "shield") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 28,12 24,28 8,28 4,12" fill="${color}"/></svg>`;
  if (type === "healer") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><polygon points="16,3 29,16 16,29 3,16" fill="${color}"/></svg>`;
  if (type === "vampire") return `<svg class="bestiary-icon" viewBox="0 0 32 32"><path d="M16 5 C24 5 28 10 28 16 C28 22 24 27 16 29 C8 27 4 22 4 16 C4 10 8 5 16 5Z" fill="${color}"/></svg>`;
  return `<svg class="bestiary-icon" viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="${color}"/></svg>`;
}

function renderGuide() {
  const list = document.getElementById("guideBestiaryList");
  const details = document.getElementById("guideBestiaryDetails");
  if (!list || !details) return;
  list.innerHTML = "";
  details.classList.add("hidden");
  Object.keys(enemyDefs).forEach((type) => {
    const def = enemyDefs[type];
    const kills = progress.bestiary[type] || 0;
    const row = document.createElement("div");
    row.className = "shop-card bestiary-row";
    row.innerHTML = `
      <div class="bestiary-left">
        ${getBestiaryIconSvg(type, def.color)}
        <div>
          <strong>${def.name}</strong>
          <div style="font-size:0.8rem; color: var(--text-muted);">Убито: ${kills.toLocaleString()}</div>
        </div>
      </div>
      <button class="secondary-btn" style="padding:6px 10px;" data-enemy-info="${type}">i</button>
    `;
    row.querySelector("button")?.addEventListener("click", () => {
      const extra = type === "horn" ? "Подсказка: иногда нужен не урон, а действие игрока." : "Особенности и сопротивления зависят от типа.";
      details.innerHTML = `<strong>${def.name}</strong><span>${enemyDescs[type] || ""}</span><span>ОЗ: <b>${def.hp}</b> • Скорость: <b>${def.speed}</b> • Урон: <b>${def.damage}</b> • Радиус тела: <b>${def.radius}</b></span><span>${extra}</span>`;
      details.classList.remove("hidden");
    });
    list.append(row);
  });
}

function renderUltimateHud() {
  const hud = document.getElementById("ultimateHud");
  if (!game || !game.ultimates.length) {
    hud.innerHTML = "";
    return;
  }
  hud.innerHTML = game.ultimates
    .map((u) => {
      const progressPct = Math.max(0, Math.min(1, 1 - (u.timer / u.maxTimer)));
      const revealPct = Math.round(progressPct * 100);
      const iconClass = getUltimateIconClass(u.id);
      return `<div class="ultimate-circle ${u.timer <= 0.2 ? "ready" : ""}">
          <div class="ultimate-inner">
            <span class="ultimate-icon" aria-hidden="true">
              <i class="sprite-icon ultimate-icon-base ${iconClass}"></i>
              <i class="sprite-icon ultimate-icon-ready ${iconClass}" style="clip-path: inset(${100 - revealPct}% 0 0 0);"></i>
            </span>
          </div>
        </div>`;
    })
    .join("");
}

function renderSettings() {
  document.getElementById("damageNumbersToggle").checked = progress.settings.damageNumbers;
  document.getElementById("screenShakeToggle").checked = progress.settings.screenShake;
  document.getElementById("reducedMotionToggle").checked = progress.settings.reducedMotion;
  document.getElementById("musicToggle").checked = progress.settings.music;
  document.getElementById("soundToggle").checked = progress.settings.sound;
  document.getElementById("fpsToggle").checked = progress.settings.fps60;
  document.getElementById("autoRestartToggle").checked = progress.settings.autoRestart;
  document.getElementById("musicVolumeSlider").value = progress.settings.musicVolume ?? 0.8;
  document.getElementById("soundVolumeSlider").value = progress.settings.soundVolume ?? 0.8;
  document.getElementById("saveToolStatus").textContent = "Экспорт, импорт или сброс локального прогресса.";
}

function updateSetting(key, value) {
  progress.settings[key] = value;
  saveProgress();
  if (key === "music" || key === "sound" || key === "musicVolume" || key === "soundVolume") bgm.update();
}

function exportSave() {
  const saveData = JSON.stringify(progress);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(saveData).then(() => {
      document.getElementById("saveToolStatus").textContent = "Код сохранения скопирован в буфер обмена!";
    }).catch(() => fallbackExport(saveData));
  } else {
    fallbackExport(saveData);
  }
}

function fallbackExport(data) {
  prompt("Скопируй этот код и сохрани его в надежном месте:", data);
  document.getElementById("saveToolStatus").textContent = "Код выведен в диалоговое окно.";
}

function importSave() {
  const input = prompt("Вставь код сохранения сюда:");
  if (!input) return;
  try {
    const imported = JSON.parse(input.trim());
    applyImportedData(imported);
    document.getElementById("saveToolStatus").textContent = "Сохранение успешно импортировано.";
  } catch {
    document.getElementById("saveToolStatus").textContent = "Импорт не удался: неверные данные сохранения.";
  }
}

function applyImportedData(imported) {
  cancelAnimationFrame(animationId);
  game = null;
  paused = false;
  progress = { ...defaultProgress(), ...imported };
  progress.permanent = { ...defaultProgress().permanent, ...progress.permanent };
  progress.ultimates = { ...defaultProgress().ultimates, ...progress.ultimates };
  progress.events = { ...defaultProgress().events, ...progress.events };
  progress.eventShop = { ...defaultProgress().eventShop, ...progress.eventShop };
  progress.milestones = { ...defaultProgress().milestones, ...progress.milestones };
  progress.settings = { ...defaultProgress().settings, ...progress.settings };
  normalizeUltimateLoadout();
  saveProgress();
  renderSettings();
  renderMenu();
  drawIdleArena();
}

function saveToTgCloud() {
  if (!tg?.CloudStorage) return;
  tg.CloudStorage.setItem(STORAGE_KEY, JSON.stringify(progress), (err, success) => {
    if (success) document.getElementById("saveToolStatus").textContent = "Успешно сохранено в Telegram Cloud!";
    else document.getElementById("saveToolStatus").textContent = "Ошибка сохранения в облако Telegram.";
  });
}

function loadFromTgCloud() {
  if (!tg?.CloudStorage) return;
  tg.CloudStorage.getItem(STORAGE_KEY, (err, value) => {
    if (err || !value) {
      document.getElementById("saveToolStatus").textContent = "Облачное сохранение не найдено.";
      return;
    }
    try {
      applyImportedData(JSON.parse(value));
      document.getElementById("saveToolStatus").textContent = "Прогресс загружен из Telegram Cloud!";
    } catch {
      document.getElementById("saveToolStatus").textContent = "Ошибка данных из облака Telegram.";
    }
  });
}

function resetSave() {
  if (!confirm("ВНИМАНИЕ! Это полностью удалит весь твой прогресс, монеты и покупки. Продолжить?")) {
    return;
  }
  cancelAnimationFrame(animationId);
  game = null;
  paused = false;
  progress = defaultProgress();
  saveProgress();
  renderSettings();
  renderMenu();
  drawIdleArena();
  document.getElementById("saveToolStatus").textContent = "Прогресс сброшен.";
}

function setDebugStatus(text) {
  document.getElementById("debugStatus").textContent = text;
}

function debugAddCoins() {
  progress.coins += 10000;
  progress.medals += 10000;
  progress.crystals += 10000;
  progress.powerStones += 500;
  progress.moduleParts += 1000;
  saveProgress();
  renderMenu();
  if (screens.permanent.classList.contains("active")) renderPermanentShop();
  if (screens.ultimate.classList.contains("active")) renderUltimateShop();
  if (screens.events.classList.contains("active")) renderEvents();
  if (screens.cards.classList.contains("active")) renderCards();
  if (screens.custom.classList.contains("active")) renderCustomization();
  setDebugStatus("+10000 Монет, Медалей и Кристаллов добавлено.");
}

function debugUnlockUltimates() {
  ultimateDefs.forEach((def, index) => {
    progress.ultimates[def.id].owned = true;
    progress.ultimates[def.id].level = Math.max(1, progress.ultimates[def.id].level);
    progress.ultimates[def.id].enabled = index < ultimateLoadoutLimit;
  });
  saveProgress();
  setDebugStatus("Все ультимативное оружие открыто.");
}

function debugJumpWave10() {
  if (!game || game.ended) {
    startRun();
  }
  game.wave = 9;
  game.enemies = [];
  game.projectiles = [];
  game.enemyProjectiles = [];
  game.missiles = [];
  game.spawnQueue = [];
  game.waveState = "pause";
  game.nextWaveTimer = 0.1;
  showScreen("game");
  setDebugStatus("Текущий забег перенесен к 10-й волне.");
}

function debugKillRun() {
  if (!game || game.ended) {
    setDebugStatus("Нет активного забега для завершения.");
    return;
  }
  game.tower.hp = 0;
  beginTowerDeathSequence();
  setDebugStatus("Текущий забег завершен.");
}

function togglePause() {
  paused = !paused;
  document.getElementById("hudPlayPauseBtn").textContent = paused ? "▶" : "⏸";
  closeGameGearMenu();
  bgm.update();
}

function increaseSpeed() {
  const index = gameSpeedSteps.findIndex((speed) => speed > gameSpeed + 0.001);
  if (index !== -1) gameSpeed = gameSpeedSteps[index];
  updateSpeedButtons();
}

function decreaseSpeed() {
  for (let i = gameSpeedSteps.length - 1; i >= 0; i -= 1) {
    if (gameSpeedSteps[i] < gameSpeed - 0.001) {
      gameSpeed = gameSpeedSteps[i];
      break;
    }
  }
  updateSpeedButtons();
}

function updateSpeedButtons() {
  const speedLabel = Number.isInteger(gameSpeed) ? String(gameSpeed) : String(gameSpeed).replace(".", ",");
  document.getElementById("hudSpeedUpBtn").textContent = "▶ x" + speedLabel;
  document.getElementById("hudSpeedDownBtn").classList.toggle("hidden", gameSpeed <= 1);
}

function quitRun() {
  if (!game || game.ended) return;
  closeGameGearMenu();
  endRun(true);
}

function showWaveToast(text) {
  const toast = document.getElementById("waveToast");
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 900);
}

function drawGame() {
  const width = getCanvasEffectiveWidth();
  const height = getCanvasEffectiveHeight();
  ctx.clearRect(0, 0, width, height);
  drawArena();
  drawEffects();
  drawTower();
  drawEnemies();
  drawProjectiles();
  drawFloatingTexts();
}

function drawIdleArena() {
  const width = getCanvasEffectiveWidth();
  const height = getCanvasEffectiveHeight();
  ctx.clearRect(0, 0, width, height);
  drawArena();
  drawTower();
}

function drawArena() {
  const width = getCanvasEffectiveWidth();
  const height = getCanvasEffectiveHeight();
  ctx.save();

  const backdrop = ctx.createLinearGradient(0, 0, width, height);
  backdrop.addColorStop(0, "#05091a");
  backdrop.addColorStop(0.46, "#071129");
  backdrop.addColorStop(1, "#02040d");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.38,
    0,
    width * 0.5,
    height * 0.38,
    Math.max(width, height) * 0.72
  );
  glow.addColorStop(0, "rgba(85, 236, 255, 0.12)");
  glow.addColorStop(0.28, "rgba(110, 72, 255, 0.08)");
  glow.addColorStop(1, "rgba(1, 4, 11, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const gridStep = 48;
  const startX = ((arenaGridOffset.x % gridStep) + gridStep) % gridStep;
  const startY = ((arenaGridOffset.y % gridStep) + gridStep) % gridStep;
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#55ecff";
  ctx.lineWidth = 1;
  for (let x = startX - gridStep; x <= width + gridStep; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = startY - gridStep; y <= height + gridStep; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#ff5caa";
  ctx.lineWidth = 2;
  const majorStep = gridStep * 4;
  const majorX = ((arenaGridOffset.x % majorStep) + majorStep) % majorStep;
  const majorY = ((arenaGridOffset.y % majorStep) + majorStep) % majorStep;
  for (let x = majorX - majorStep; x <= width + majorStep; x += majorStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = majorY - majorStep; y <= height + majorStep; y += majorStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "rgba(85, 236, 255, 0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "rgba(255, 92, 170, 0.75)";
  ctx.beginPath();
  ctx.moveTo(width * 0.72, 0);
  ctx.lineTo(width * 0.58, height);
  ctx.stroke();

  ctx.restore();
}

function drawTower() {
  const t = game?.tower || { x: getCanvasEffectiveWidth() / 2, y: getCanvasEffectiveHeight() / 2, range: 160, hp: 100, maxHp: 100 };
  const shapeDef = cosmeticDefs.shapes.find(s => s.id === progress?.customization?.shape) || cosmeticDefs.shapes[0];
  const colorDef = cosmeticDefs.colors.find(c => c.id === progress?.customization?.color) || cosmeticDefs.colors[0];
  const sides = shapeDef.sides;
  let mainColor = colorDef.color;
  let darkColor = colorDef.dark;
  if (shapeDef.substance) {
    mainColor = "#8cff72";
    darkColor = "#2d4f1d";
  }
  const hitK = t.hitTimer && t.hitMax ? t.hitTimer / t.hitMax : 0;
  const hitPulse = Math.sin(hitK * Math.PI);
  const hitIntensity = t.hitIntensity || 0;
  const hitAngle = t.hitAngle || 0;
  const deathK = game?.deathSequence ? 1 - (game.deathSequence.timer / game.deathSequence.maxTimer) : 0;
  const bodyAlpha = game?.deathSequence ? Math.max(0, 1 - deathK * 1.35) : 1;
  const bodyScale = 1 + hitPulse * 0.1 * hitIntensity + deathK * 0.55;
  const bodyOffsetX = Math.cos(hitAngle) * hitPulse * 5 * hitIntensity;
  const bodyOffsetY = Math.sin(hitAngle) * hitPulse * 5 * hitIntensity;
  const bodyRotation = (t.hitSpin || 0) * hitPulse + Math.sin(hitK * Math.PI * 5) * hitPulse * 0.08 * hitIntensity;

  ctx.save();
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.range, 0, TWO_PI);
  ctx.fillStyle = mainColor;
  ctx.globalAlpha = 0.035;
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.globalAlpha = 0.34;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.globalAlpha = 0.11;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.range * 0.68, 0, TWO_PI);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  ctx.save();
  ctx.translate(t.x + bodyOffsetX, t.y + bodyOffsetY);
  ctx.rotate(bodyRotation);
  ctx.scale(bodyScale, shapeDef.substance ? 1 + hitPulse * 0.16 * hitIntensity : bodyScale);
  ctx.translate(-t.x, -t.y);
  ctx.globalAlpha = bodyAlpha;

  if (shapeDef.substance) {
    const time = performance.now() / 420;
    const blobRadius = 24;

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.beginPath();
    const blobPoints = 14;
    for (let i = 0; i <= blobPoints; i += 1) {
      const angle = (i / blobPoints) * TWO_PI;
      const wobble = Math.sin(angle * 3 + time) * 5 + Math.cos(angle * 5 - time * 1.25) * 4;
      const r = blobRadius + wobble;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(180, 255, 160, 0.95)";
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.strokeStyle = "rgba(110, 220, 130, 0.95)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 10, 0, TWO_PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let j = 0; j < 4; j += 1) {
      const a = time * 1.4 + j * TWO_PI / 4;
      const radius = blobRadius + 10 + j * 4;
      const bx = t.x + Math.cos(a) * radius;
      const by = t.y + Math.sin(a) * radius;
      ctx.beginPath();
      ctx.arc(bx, by, 2 + Math.sin(time * 1.7 + j) * 1.2, 0, TWO_PI);
      ctx.fillStyle = "rgba(180, 255, 160, 0.45)";
      ctx.fill();
    }
  } else if (shapeDef.style === "star") {
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.05;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (i / 10) * TWO_PI;
      const r = (i % 2 === 0 ? 28 : 13) * pulse;
      const x = t.x + Math.cos(angle) * r;
      const y = t.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = darkColor;
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, TWO_PI);
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (shapeDef.style === "ring") {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 27, 0, TWO_PI);
    ctx.fillStyle = darkColor;
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 14, 0, TWO_PI);
    ctx.fillStyle = "rgba(1, 7, 18, 0.96)";
    ctx.fill();
    ctx.strokeStyle = "rgba(233, 253, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const a = performance.now() / 520 + i * TWO_PI / 4;
      ctx.beginPath();
      ctx.arc(t.x + Math.cos(a) * 27, t.y + Math.sin(a) * 27, 3, 0, TWO_PI);
      ctx.fillStyle = i % 2 ? mainColor : "#ffffff";
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  } else if (shapeDef.style === "crystal") {
    const points = [
      [0, -32], [18, -9], [12, 27], [0, 34], [-12, 27], [-18, -9]
    ];
    ctx.beginPath();
    points.forEach(([px, py], i) => {
      const x = t.x + px;
      const y = t.y + py;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = darkColor;
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.strokeStyle = "rgba(233, 253, 255, 0.64)";
    ctx.lineWidth = 1.5;
    [[0, -32], [0, 34], [18, -9], [-18, -9], [12, 27], [-12, 27]].forEach(([px, py], i, arr) => {
      if (i % 2 !== 0) return;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + 2);
      ctx.lineTo(t.x + px, t.y + py);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  } else if (shapeDef.style === "blade") {
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    for (let i = 0; i < 4; i += 1) {
      const a = i * TWO_PI / 4 + performance.now() / 980;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(33, -5);
      ctx.lineTo(22, 8);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? "rgba(233, 253, 255, 0.78)" : darkColor;
      ctx.fill();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10, 0, TWO_PI);
    ctx.fillStyle = "rgba(233, 253, 255, 0.95)";
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (shapeDef.style === "void") {
    const time = performance.now() / 360;
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = -Math.PI / 2 + (i / sides) * TWO_PI;
      const r = 22 + Math.sin(time + i * 1.7) * 5;
      const x = t.x + Math.cos(angle) * r;
      const y = t.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(2, 2, 12, 0.96)";
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 10 + Math.sin(time * 1.6) * 2, 0, TWO_PI);
    ctx.fillStyle = "rgba(255, 92, 178, 0.78)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(t.x, t.y, 29, time, time + Math.PI * 0.72);
    ctx.strokeStyle = "rgba(85, 236, 255, 0.65)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = -Math.PI / sides + (i / sides) * TWO_PI;
      const x = t.x + Math.cos(angle) * 22;
      const y = t.y + Math.sin(angle) * 22;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = darkColor;
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 16;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
      const angle = Math.PI / sides + (i / sides) * TWO_PI;
      const x = t.x + Math.cos(angle) * 12;
      const y = t.y + Math.sin(angle) * 12;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(233, 253, 255, 0.92)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (hitPulse > 0.01) {
    if (shapeDef.substance) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 28 + hitPulse * 30, 0, TWO_PI);
      ctx.strokeStyle = `rgba(180, 255, 160, ${0.55 * hitPulse})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (shapeDef.id === "shape_triangle") {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * hitPulse})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        const a = -Math.PI / 2 + i * TWO_PI / 3 + hitPulse * 0.4;
        ctx.beginPath();
        ctx.moveTo(t.x + Math.cos(a) * 16, t.y + Math.sin(a) * 16);
        ctx.lineTo(t.x + Math.cos(a) * (42 + hitPulse * 18), t.y + Math.sin(a) * (42 + hitPulse * 18));
        ctx.stroke();
      }
    } else if (shapeDef.id === "shape_square") {
      ctx.strokeStyle = `rgba(255, 176, 32, ${0.7 * hitPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(t.x - 30 - hitPulse * 8, t.y - 30 - hitPulse * 8, 60 + hitPulse * 16, 60 + hitPulse * 16);
    } else if (shapeDef.id === "shape_octa") {
      ctx.strokeStyle = `rgba(85, 236, 255, ${0.68 * hitPulse})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) {
        const a = i * TWO_PI / 8;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.x + Math.cos(a) * (36 + hitPulse * 14), t.y + Math.sin(a) * (36 + hitPulse * 14));
        ctx.stroke();
      }
    } else if (shapeDef.style === "star" || shapeDef.style === "crystal") {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.72 * hitPulse})`;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < sides; i += 1) {
        const a = -Math.PI / 2 + i * TWO_PI / sides;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.x + Math.cos(a) * (38 + hitPulse * 16), t.y + Math.sin(a) * (38 + hitPulse * 16));
        ctx.stroke();
      }
    } else if (shapeDef.style === "ring" || shapeDef.style === "void") {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 31 + hitPulse * 22, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 92, 178, ${0.62 * hitPulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (shapeDef.style === "blade") {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.76 * hitPulse})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i += 1) {
        const a = i * TWO_PI / 4 + hitPulse * 0.8;
        ctx.beginPath();
        ctx.moveTo(t.x + Math.cos(a) * 18, t.y + Math.sin(a) * 18);
        ctx.lineTo(t.x + Math.cos(a) * (48 + hitPulse * 18), t.y + Math.sin(a) * (48 + hitPulse * 18));
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(t.x, t.y, 29 + hitPulse * 17, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.72 * hitPulse})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  ctx.restore();

  if (game?.goldenCoreTimer > 0) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 45, 0, TWO_PI);
    ctx.fillStyle = "rgba(255, 176, 32, 0.25)";
    ctx.fill();
    ctx.shadowColor = "#ffb020";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#ffb020";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Отрисовка Орбит и Сфер
  if (game?.tower.orbCount > 0) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 180, 0, TWO_PI);
    ctx.strokeStyle = "rgba(85, 236, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < game.tower.orbCount; i++) {
      const angle = game.tower.orbAngle + (i / game.tower.orbCount) * TWO_PI;
      const ox = t.x + Math.cos(angle) * 180;
      const oy = t.y + Math.sin(angle) * 180;
      ctx.beginPath();
      ctx.arc(ox, oy, 8, 0, TWO_PI);
      ctx.fillStyle = "#ff5c6c";
      ctx.shadowColor = "#ff5c6c";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}

function drawEnemies() {
  if (!game) return;
  game.enemies.forEach((enemy) => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.flash > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(enemy.hitAngle || 0) * -enemy.radius * 1.4, Math.sin(enemy.hitAngle || 0) * -enemy.radius * 1.4);
      ctx.lineTo(Math.cos(enemy.hitAngle || 0) * enemy.radius * 1.4, Math.sin(enemy.hitAngle || 0) * enemy.radius * 1.4);
      ctx.stroke();
    }
    
    ctx.save();
      ctx.rotate(enemy.angle || 0);

      ctx.fillStyle = enemy.flash > 0 ? "#ffffff" : enemy.color;
      ctx.strokeStyle = enemy.shieldHits > 0 ? "#ffffff" : "#ff7ab8";
      ctx.lineWidth = enemy.shieldHits > 0 ? 4 : 2;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = enemy.flash > 0 ? 18 : 10;
      ctx.beginPath();
      if (enemy.type === "scout") {
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(enemy.radius, enemy.radius);
        ctx.lineTo(-enemy.radius, enemy.radius);
        ctx.closePath();
      } else if (enemy.type === "grunt") {
        ctx.rotate(Math.PI / 4);
        ctx.rect(-enemy.radius * 0.78, -enemy.radius * 0.78, enemy.radius * 1.56, enemy.radius * 1.56);
        ctx.rotate(-Math.PI / 4);
      } else if (enemy.type === "brute" || enemy.type === "boss" || enemy.type === "armored") {
        ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      } else if (enemy.type === "shooter") {
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * TWO_PI;
          const x = Math.cos(a) * enemy.radius;
          const y = Math.sin(a) * enemy.radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (enemy.type === "splitter") {
        for (let i = 0; i < 5; i += 1) {
          const a = -Math.PI / 2 + (i / 5) * TWO_PI;
          const r = i % 2 === 0 ? enemy.radius : enemy.radius * 0.55;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (enemy.type === "shield") {
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(enemy.radius * 0.95, -enemy.radius * 0.2);
        ctx.lineTo(enemy.radius * 0.68, enemy.radius);
        ctx.lineTo(-enemy.radius * 0.68, enemy.radius);
        ctx.lineTo(-enemy.radius * 0.95, -enemy.radius * 0.2);
        ctx.closePath();
      } else if (enemy.type === "assassin") {
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(enemy.radius * 0.7, enemy.radius);
        ctx.lineTo(-enemy.radius * 0.7, enemy.radius);
        ctx.closePath();
      } else if (enemy.type === "healer") {
        ctx.moveTo(0, -enemy.radius);
        ctx.lineTo(enemy.radius, 0);
        ctx.lineTo(0, enemy.radius);
        ctx.lineTo(-enemy.radius, 0);
        ctx.closePath();
      } else if (enemy.type === "vampire") {
        ctx.moveTo(0, -enemy.radius);
        ctx.bezierCurveTo(enemy.radius, -enemy.radius * 0.8, enemy.radius, enemy.radius * 0.3, 0, enemy.radius);
        ctx.bezierCurveTo(-enemy.radius, enemy.radius * 0.3, -enemy.radius, -enemy.radius * 0.8, 0, -enemy.radius);
      } else {
        ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
      }
      ctx.fill();
      ctx.stroke();
      
      ctx.restore(); // Сбрасываем вращение для иконки Элиты и полоски ХП

    if (enemy.elite) {
      ctx.strokeStyle = "#ffb020";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 7, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = "#ffb020";
      ctx.font = "700 12px 'Exo 2', system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Э", 0, 4);
    }
    ctx.shadowBlur = 0;
    const barWidth = enemy.radius * 2.4;
    const barY = -enemy.radius - 12;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(-barWidth / 2, barY, barWidth, 4);
    ctx.fillStyle = enemy.hp / enemy.maxHp > 0.35 ? "#55ecff" : "#ff5c9b";
    ctx.fillRect(-barWidth / 2, barY, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 4);
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, barY, barWidth, 4);
    ctx.restore();
  });
}

function drawProjectiles() {
  if (!game) return;
  const colorDef = cosmeticDefs.colors.find(c => c.id === progress?.customization?.color) || cosmeticDefs.colors[0];
  ctx.save();
  game.projectiles.forEach((p) => {
    if (p.style === "substance") {
      const drift = Math.sin(performance.now() / 220 + p.x * 0.02) * 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(drift);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, TWO_PI);
      ctx.fillStyle = p.superCrit ? "rgba(255,68,68,0.95)" : (p.crit ? "rgba(255,176,32,0.95)" : "rgba(140, 255, 114, 0.95)");
      ctx.shadowColor = "rgba(140, 255, 114, 0.9)";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.ellipse(-2, -1, 2, 1.5, 0, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.superCrit ? 8 : (p.crit ? 6 : 4), 0, TWO_PI);
      ctx.fillStyle = p.superCrit ? "#ff4444" : (p.crit ? "#ffb020" : colorDef.color);
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fill();
    }
  });
  game.missiles.forEach((m) => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, 5, 0, TWO_PI);
    ctx.fillStyle = "#ff5c6c";
    ctx.shadowColor = "#ff5c6c";
    ctx.shadowBlur = 14;
    ctx.fill();
  });
  game.enemyProjectiles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, TWO_PI);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  // Отрисовка Мин
  game.landmines.forEach((m) => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, 4, 0, TWO_PI);
    ctx.fillStyle = "#ffb020";
    ctx.shadowColor = "#ffb020";
    ctx.shadowBlur = 8;
    ctx.fill();
  });
  ctx.restore();
}

function drawEffects() {
  if (!game) return;
  game.effects.forEach((effect) => {
    const k = effect.life / effect.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = effect.type === "beam" ? 12 : 3;
    if (effect.type === "beam") {
      ctx.beginPath();
      ctx.moveTo(effect.x, effect.y);
      ctx.lineTo(effect.x + Math.cos(effect.angle) * 400, effect.y + Math.sin(effect.angle) * 400);
      ctx.stroke();
    } else if (effect.type === "reward") {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 170 + 24, 0, TWO_PI);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 95 + 16, 0, TWO_PI);
      ctx.stroke();
    } else if (effect.type === "deathWave") {
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 450, 0, TWO_PI);
      ctx.stroke();
    } else if (effect.type === "solarSweep") {
      ctx.lineWidth = 14;
      ctx.strokeStyle = "rgba(255, 227, 110, 0.8)";
      ctx.beginPath();
      ctx.moveTo(game.tower.x, game.tower.y);
      ctx.lineTo(game.tower.x + Math.cos(effect.angle) * 500, game.tower.y + Math.sin(effect.angle) * 500);
      ctx.stroke();
    } else if (effect.type === "chain") {
      ctx.lineWidth = 4 * k;
      ctx.strokeStyle = effect.color;
      ctx.beginPath();
      effect.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (effect.type === "swamp") {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, TWO_PI);
      ctx.fillStyle = "rgba(165, 255, 59, 0.25)";
      ctx.fill();
    } else if (effect.type === "blackHole") {
      const pulse = 0.82 + Math.sin(performance.now() / 140) * 0.08;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * pulse, 0, TWO_PI);
      ctx.fillStyle = "rgba(179, 117, 255, 0.16)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(85, 236, 255, 0.55)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 18 + (1 - k) * 18, 0, TWO_PI);
      ctx.fillStyle = "#05050c";
      ctx.fill();
    } else if (effect.type === "shockWave") {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 270 + 24, 0, TWO_PI);
      ctx.strokeStyle = "rgba(85, 236, 255, 0.8)";
      ctx.stroke();
    } else if (effect.type === "towerShock") {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 230 + 18, 0, TWO_PI);
      ctx.strokeStyle = `rgba(85, 236, 255, ${0.85 * k})`;
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * 135 + 8, 0, TWO_PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * k})`;
      ctx.stroke();
    } else if (effect.type === "towerExplosion") {
      const burst = 1 - k;
      ctx.fillStyle = `rgba(255, 92, 108, ${0.28 * k})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 34 + burst * 95, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 176, 32, ${0.9 * k})`;
      ctx.lineWidth = 5;
      for (let i = 0; i < 14; i += 1) {
        const a = i * TWO_PI / 14 + burst * 0.3;
        const inner = 18 + burst * 28;
        const outer = 42 + burst * (120 + (i % 3) * 16);
        ctx.beginPath();
        ctx.moveTo(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner);
        ctx.lineTo(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * k})`;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 16 + burst * 20, 0, TWO_PI);
      ctx.fill();
    } else if (effect.type === "spit") {
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(effect.x, effect.y, (1 - k) * 26 + 8, (1 - k) * 12 + 4, Math.sin(performance.now() / 250) * 0.4, 0, TWO_PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, (1 - k) * (effect.type === "superCrit" ? 110 : 70) + 8, 0, TWO_PI);
      if (["gravity", "time", "storm"].includes(effect.type)) ctx.stroke();
      else ctx.fill();
    }
    ctx.restore();
  });
}

function drawFloatingTexts() {
  if (!game || !game.texts.length) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  game.texts.forEach((text) => {
    const alpha = Math.max(0, text.life / text.maxLife);
    const lift = 1 - alpha;
    ctx.globalAlpha = Math.min(1, alpha * 1.25);
    ctx.font = `${text.weight || 800} ${text.size || 20}px 'Exo 2', system-ui`;
    ctx.lineJoin = "round";
    if (text.stroke) {
      ctx.strokeStyle = "rgba(3, 5, 14, 0.9)";
      ctx.lineWidth = Math.max(3, (text.size || 20) * 0.16);
      ctx.strokeText(text.value, text.x + 2, text.y + 2);
    }
    if (text.glow) {
      ctx.shadowColor = text.color;
      ctx.shadowBlur = 10 + lift * 8;
    }
    ctx.fillStyle = text.color;
    ctx.fillText(text.value, text.x, text.y);
    ctx.shadowBlur = 0;
  });
  ctx.restore();
}

initGame();
