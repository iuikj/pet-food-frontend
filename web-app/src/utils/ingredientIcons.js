/**
 * 食材图标注册表与解析器
 *
 * 设计目标：
 * - 统一图标来源，支持未来扩展（遵循开闭原则）
 * - icon_key 格式：`<library>:<name>`，如 `emoji:fish` / `mi:restaurant`
 * - 回落链：image_url > icon_key > 名称关键字 > 分类默认 > 🥘
 * - 零远程依赖（符合 frontend/CLAUDE.md 本地化要求）
 */

// ─────────────────────────── EMOJI 映射 ───────────────────────────

/** icon_key = `emoji:<key>` → emoji 字符 */
export const EMOJI_MAP = {
    // 肉类
    beef: '🥩',
    chicken: '🍗',
    turkey: '🦃',
    duck: '🦆',
    lamb: '🍖',
    pork: '🥓',
    bacon: '🥓',
    sausage: '🌭',
    rabbit: '🐰',
    // 水产
    fish: '🐟',
    salmon: '🐟',
    cod: '🐟',
    tuna: '🐟',
    shrimp: '🦐',
    crab: '🦀',
    lobster: '🦞',
    squid: '🦑',
    oyster: '🦪',
    // 蛋奶
    egg: '🥚',
    fried_egg: '🍳',
    milk: '🥛',
    cheese: '🧀',
    butter: '🧈',
    yogurt: '🥛',
    // 蔬菜
    broccoli: '🥦',
    carrot: '🥕',
    cucumber: '🥒',
    zucchini: '🥒',
    pumpkin: '🎃',
    corn: '🌽',
    tomato: '🍅',
    eggplant: '🍆',
    pepper: '🌶️',
    bell_pepper: '🫑',
    mushroom: '🍄',
    leafy_green: '🥬',
    lettuce: '🥬',
    cabbage: '🥬',
    spinach: '🥬',
    onion: '🧅',
    garlic: '🧄',
    potato: '🥔',
    sweet_potato: '🍠',
    bean: '🫘',
    pea: '🫛',
    // 水果
    apple: '🍎',
    banana: '🍌',
    blueberry: '🫐',
    strawberry: '🍓',
    watermelon: '🍉',
    grape: '🍇',
    pear: '🍐',
    peach: '🍑',
    orange: '🍊',
    kiwi: '🥝',
    avocado: '🥑',
    // 谷物与主食
    rice: '🍚',
    wheat: '🌾',
    oat: '🌾',
    bread: '🍞',
    noodle: '🍜',
    // 油脂与坚果
    oil: '🫒',
    olive: '🫒',
    nut: '🌰',
    peanut: '🥜',
    almond: '🌰',
    // 补剂与调味
    salt: '🧂',
    herb: '🌿',
    tea: '🍵',
    water: '💧',
    supplement: '💊',
    powder: '🥣',
    // 其他
    bone: '🦴',
    paw: '🐾',
    cat: '🐱',
    dog: '🐶',
    mixed: '🥘',
    unknown: '🍽️',
};

// ─────────────────── Material Icons Round 白名单 ───────────────────

/**
 * icon_key = `mi:<name>` → 直接渲染 Material Icons Round ligature。
 * 仅列出与食材 / 饮食相关且命中率高的图标；picker 会用此清单作为候选项。
 */
export const MI_WHITELIST = [
    'restaurant',
    'restaurant_menu',
    'kitchen',
    'lunch_dining',
    'dinner_dining',
    'brunch_dining',
    'breakfast_dining',
    'bakery_dining',
    'ramen_dining',
    'set_meal',
    'icecream',
    'cake',
    'coffee',
    'local_drink',
    'water_drop',
    'eco',
    'grass',
    'spa',
    'local_florist',
    'park',
    'nutrition',
    'blender',
    'outdoor_grill',
    'soup_kitchen',
    'egg',
    'egg_alt',
    'liquor',
    'wine_bar',
    'local_dining',
    'pets',
];

// ─────────────────────── 名称关键字推断 ───────────────────────

/**
 * 名称关键字 → 默认 icon_key。
 * 用于 FoodItem/Ingredient 无 icon_key 时的兜底推断。
 */
const NAME_KEYWORD_RULES = [
    // 水产
    [['三文鱼', '鲑鱼', 'salmon'], 'emoji:salmon'],
    [['鳕鱼', 'cod'], 'emoji:cod'],
    [['金枪鱼', '吞拿', 'tuna'], 'emoji:tuna'],
    [['虾', 'shrimp'], 'emoji:shrimp'],
    [['蟹', 'crab'], 'emoji:crab'],
    [['龙虾', 'lobster'], 'emoji:lobster'],
    [['鱿鱼', '章鱼', 'squid', 'octopus'], 'emoji:squid'],
    [['生蚝', '牡蛎', 'oyster'], 'emoji:oyster'],
    [['鱼'], 'emoji:fish'],
    // 肉
    [['鸡胸', '鸡肉', '鸡'], 'emoji:chicken'],
    [['火鸡', 'turkey'], 'emoji:turkey'],
    [['鸭肉', '鸭'], 'emoji:duck'],
    [['兔肉', '兔'], 'emoji:rabbit'],
    [['羊肉', '羊'], 'emoji:lamb'],
    [['牛肉', '牛腱', '牛'], 'emoji:beef'],
    [['培根', 'bacon'], 'emoji:bacon'],
    [['香肠', '肠'], 'emoji:sausage'],
    [['猪肉', '猪'], 'emoji:pork'],
    // 蛋奶
    [['鸡蛋', '蛋'], 'emoji:egg'],
    [['奶酪', '芝士', 'cheese'], 'emoji:cheese'],
    [['酸奶', 'yogurt'], 'emoji:yogurt'],
    [['牛奶', 'milk'], 'emoji:milk'],
    [['黄油', 'butter'], 'emoji:butter'],
    // 蔬菜
    [['西兰花', 'broccoli'], 'emoji:broccoli'],
    [['胡萝卜', '萝卜'], 'emoji:carrot'],
    [['黄瓜', 'cucumber'], 'emoji:cucumber'],
    [['西葫芦', '南瓜'], 'emoji:pumpkin'],
    [['玉米', 'corn'], 'emoji:corn'],
    [['番茄', '西红柿', 'tomato'], 'emoji:tomato'],
    [['茄子', 'eggplant'], 'emoji:eggplant'],
    [['蘑菇', '香菇', 'mushroom'], 'emoji:mushroom'],
    [['菠菜', 'spinach'], 'emoji:spinach'],
    [['生菜', '白菜', '卷心菜', 'lettuce', 'cabbage'], 'emoji:leafy_green'],
    [['洋葱', 'onion'], 'emoji:onion'],
    [['大蒜', '蒜'], 'emoji:garlic'],
    [['红薯', '地瓜'], 'emoji:sweet_potato'],
    [['土豆', '马铃薯'], 'emoji:potato'],
    [['豌豆', '青豆', '黄豆', '豆'], 'emoji:bean'],
    // 水果
    [['苹果', 'apple'], 'emoji:apple'],
    [['香蕉', 'banana'], 'emoji:banana'],
    [['蓝莓', 'blueberry'], 'emoji:blueberry'],
    [['草莓', 'strawberry'], 'emoji:strawberry'],
    [['西瓜', 'watermelon'], 'emoji:watermelon'],
    [['葡萄', 'grape'], 'emoji:grape'],
    [['梨', 'pear'], 'emoji:pear'],
    [['桃', 'peach'], 'emoji:peach'],
    [['橙', '橘', 'orange'], 'emoji:orange'],
    [['猕猴桃', 'kiwi'], 'emoji:kiwi'],
    [['牛油果', 'avocado'], 'emoji:avocado'],
    // 谷物
    [['米饭', '糙米', '白米'], 'emoji:rice'],
    [['米'], 'emoji:rice'],
    [['燕麦', 'oat'], 'emoji:oat'],
    [['小米', '麦'], 'emoji:wheat'],
    [['面包', 'bread'], 'emoji:bread'],
    [['面条', '意面', 'noodle', 'pasta'], 'emoji:noodle'],
    // 油脂
    [['橄榄油', '橄榄', 'olive'], 'emoji:olive'],
    [['油'], 'emoji:oil'],
    [['花生', 'peanut'], 'emoji:peanut'],
    [['杏仁', 'almond'], 'emoji:almond'],
    [['坚果', 'nut'], 'emoji:nut'],
    // 补剂
    [['牛磺酸', '补剂', '片剂', 'taurine'], 'emoji:supplement'],
    [['粉', 'powder'], 'emoji:powder'],
    [['骨粉', '骨头', 'bone'], 'emoji:bone'],
    [['盐'], 'emoji:salt'],
    [['茶', 'tea'], 'emoji:tea'],
    [['水'], 'emoji:water'],
];

/**
 * 分类 → 默认 icon_key。
 * 当名称无法匹配时，尝试从 category / sub_category 推断。
 */
const CATEGORY_FALLBACK = {
    // 大类
    白肉: 'emoji:chicken',
    红肉: 'emoji:beef',
    内脏: 'emoji:beef',
    海鲜: 'emoji:fish',
    蛋类: 'emoji:egg',
    蔬菜: 'emoji:leafy_green',
    水果: 'emoji:apple',
    谷物: 'emoji:rice',
    主食: 'emoji:rice',
    骨头: 'emoji:bone',
    补剂: 'emoji:supplement',
    油脂: 'emoji:oil',
};

// ────────────────────────────── API ──────────────────────────────

/**
 * 解析 icon_key 为渲染结果：
 * - `emoji:<key>` → { type: 'emoji', value: '🐟' }
 * - `mi:<name>`   → { type: 'mi',    value: 'restaurant' }
 * - 其他格式或未命中 → null
 */
export function parseIconKey(iconKey) {
    if (!iconKey || typeof iconKey !== 'string') return null;
    const colon = iconKey.indexOf(':');
    if (colon < 0) return null;
    const library = iconKey.slice(0, colon);
    const name = iconKey.slice(colon + 1);
    if (!library || !name) return null;

    if (library === 'emoji') {
        const emoji = EMOJI_MAP[name];
        return emoji ? { type: 'emoji', value: emoji } : null;
    }
    if (library === 'mi') {
        // 不强制在白名单内，允许任意合法 Material Icons Round ligature 名
        return { type: 'mi', value: name };
    }
    return null;
}

/**
 * 按名称关键字推断 icon_key。
 */
function inferFromName(name) {
    if (!name) return null;
    const lower = String(name).toLowerCase();
    for (const [keywords, key] of NAME_KEYWORD_RULES) {
        for (const kw of keywords) {
            if (name.includes(kw) || lower.includes(kw.toLowerCase())) {
                return key;
            }
        }
    }
    return null;
}

/**
 * 按分类推断 icon_key。sub_category 优先于 category。
 */
function inferFromCategory(category, subCategory) {
    if (subCategory && CATEGORY_FALLBACK[subCategory]) return CATEGORY_FALLBACK[subCategory];
    if (category && CATEGORY_FALLBACK[category]) return CATEGORY_FALLBACK[category];
    return null;
}

/**
 * 统一解析器：按 icon_key > 名称 > 分类 > 默认 的优先级返回可渲染的 icon_key。
 *
 * @param {object} input
 * @param {string} [input.icon_key]       显式设置的 icon_key
 * @param {string} [input.name]           食材名称（用于兜底推断）
 * @param {string} [input.category]       大类
 * @param {string} [input.sub_category]   子类
 * @returns {string}                      总是返回一个可渲染的 icon_key
 */
export function resolveIconKey({ icon_key, name, category, sub_category } = {}) {
    if (icon_key && parseIconKey(icon_key)) return icon_key;
    const byName = inferFromName(name);
    if (byName) return byName;
    const byCat = inferFromCategory(category, sub_category);
    if (byCat) return byCat;
    return 'emoji:mixed';
}

/** 所有可选的 emoji key（用于 picker） */
export function listEmojiKeys() {
    return Object.keys(EMOJI_MAP);
}

/** 所有可选的 Material Icons 名（白名单，用于 picker） */
export function listMaterialIconKeys() {
    return MI_WHITELIST;
}
