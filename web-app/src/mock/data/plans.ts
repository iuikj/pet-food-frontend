/**
 * 计划生成 Mock 数据
 * 数据结构与后端 PetDietPlan / WeeklyDietPlan Pydantic 模型对齐
 */
import type { SSEEvent, TaskResponse } from '../../api/types';

/** SSE 事件序列（模拟 V1 三阶段流水线，总时长约 20 秒） */
export interface MockSSEEvent extends SSEEvent {
  delayMs: number;
}

// ── 后端结构的 Mock 数据：WeeklyDietPlan[] ──

const mockWeeklyPlans = [
  {
    oder: 1,
    diet_adjustment_principle: '以易消化、低过敏的蛋白质为主，帮助肠胃适应新食谱。重点排除鸡肉相关食材。',
    weekly_diet_plan: {
      daily_diet_plans: [
        {
          oder: 1,
          time: '8:00 AM',
          food_items: [
            {
              name: '深海鳕鱼',
              weight: 80,
              macro_nutrients: { protein: 16.0, fat: 0.8, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.01, vitamin_c: 0, vitamin_d: 0.005, calcium: 20, iron: 0.4, sodium: 60, potassium: 350, cholesterol: 50, additional_nutrients: { 'Omega-3': 1.2 } },
              recommend_reason: '富含 Omega-3，可有效缓解皮肤炎症，增强被毛光泽。',
            },
            {
              name: '贝贝南瓜',
              weight: 30,
              macro_nutrients: { protein: 0.3, fat: 0.1, carbohydrates: 5.0, dietary_fiber: 1.5 },
              micro_nutrients: { vitamin_a: 0.12, vitamin_c: 4.0, vitamin_d: 0, calcium: 15, iron: 0.3, sodium: 1, potassium: 200, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '提供优质可溶性膳食纤维，温和促进肠道蠕动。',
            },
            {
              name: '西兰花碎',
              weight: 10,
              macro_nutrients: { protein: 0.3, fat: 0, carbohydrates: 0.7, dietary_fiber: 0.3 },
              micro_nutrients: { vitamin_a: 0.04, vitamin_c: 9.0, vitamin_d: 0, calcium: 5, iron: 0.1, sodium: 3, potassium: 32, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '补充维生素 C 及抗氧化物质，增强免疫力。',
            },
          ],
          cook_method: '清蒸 — 鳕鱼与南瓜同层蒸 15 分钟，西兰花最后 3 分钟加入',
        },
        {
          oder: 2,
          time: '1:00 PM',
          food_items: [
            {
              name: '火鸡胸肉',
              weight: 90,
              macro_nutrients: { protein: 22.5, fat: 1.8, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 10, iron: 1.2, sodium: 55, potassium: 280, cholesterol: 60, additional_nutrients: {} },
              recommend_reason: '低脂高蛋白替代鸡肉，适合过敏体质。',
            },
            {
              name: '胡萝卜',
              weight: 20,
              macro_nutrients: { protein: 0.2, fat: 0, carbohydrates: 2.0, dietary_fiber: 0.6 },
              micro_nutrients: { vitamin_a: 0.8, vitamin_c: 1.2, vitamin_d: 0, calcium: 8, iron: 0.1, sodium: 10, potassium: 65, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '富含 β-胡萝卜素，有益视力和皮肤健康。',
            },
          ],
          cook_method: '蒸煮 — 火鸡肉至全熟，胡萝卜切碎混合，不添加任何调味料',
        },
        {
          oder: 3,
          time: '7:00 PM',
          food_items: [
            {
              name: '瘦牛肉',
              weight: 100,
              macro_nutrients: { protein: 26.0, fat: 3.5, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 12, iron: 2.8, sodium: 55, potassium: 350, cholesterol: 70, additional_nutrients: { '锌': 4.5 } },
              recommend_reason: '优质红肉蛋白，富含铁和锌，支持肌肉和免疫系统。',
            },
            {
              name: '青豆',
              weight: 15,
              macro_nutrients: { protein: 0.8, fat: 0.1, carbohydrates: 2.0, dietary_fiber: 0.8 },
              micro_nutrients: { vitamin_a: 0.03, vitamin_c: 2.0, vitamin_d: 0, calcium: 5, iron: 0.2, sodium: 1, potassium: 40, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '低碳水蔬菜，补充膳食纤维。',
            },
            {
              name: '糙米',
              weight: 20,
              macro_nutrients: { protein: 1.5, fat: 0.5, carbohydrates: 15.0, dietary_fiber: 0.7 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 3, iron: 0.3, sodium: 1, potassium: 40, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '提供缓释碳水化合物和 B 族维生素。',
            },
          ],
          cook_method: '炖煮 — 牛肉焯水后与糙米同煮，青豆最后加入焖 5 分钟',
        },
      ],
    },
    weekly_special_adjustment_note: '本周为适应期，若出现软便请减少南瓜和糙米用量。',
    suggestions: [
      '观察是否有任何皮肤瘙痒反应（虽然已剔除常见过敏源）',
      '每日保持至少 30 分钟的低强度散步',
      '建议搭配关节保养补充剂（葡萄糖胺）',
    ],
  },
  {
    oder: 2,
    diet_adjustment_principle: '逐步增加 Omega-3 脂肪酸摄入，强化关节保养，同时引入鸭肉作为新蛋白源。',
    weekly_diet_plan: {
      daily_diet_plans: [
        {
          oder: 1,
          time: '8:00 AM',
          food_items: [
            {
              name: '三文鱼',
              weight: 85,
              macro_nutrients: { protein: 17.0, fat: 5.5, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.01, vitamin_c: 0, vitamin_d: 0.01, calcium: 12, iron: 0.3, sodium: 50, potassium: 360, cholesterol: 55, additional_nutrients: { 'Omega-3': 2.0, 'DHA': 0.8 } },
              recommend_reason: '三文鱼是最优 Omega-3 来源，每百克含 2g+ 不饱和脂肪酸。',
            },
            {
              name: '燕麦',
              weight: 25,
              macro_nutrients: { protein: 2.5, fat: 1.5, carbohydrates: 16.0, dietary_fiber: 2.5 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 10, iron: 0.8, sodium: 2, potassium: 60, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '缓释能量，搭配优质蛋白提供持久饱腹感。',
            },
            {
              name: '菠菜',
              weight: 10,
              macro_nutrients: { protein: 0.3, fat: 0, carbohydrates: 0.4, dietary_fiber: 0.2 },
              micro_nutrients: { vitamin_a: 0.47, vitamin_c: 2.8, vitamin_d: 0, calcium: 10, iron: 0.3, sodium: 7, potassium: 56, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '铁和叶酸的优质来源，支持血红蛋白合成。',
            },
          ],
          cook_method: '熬粥 — 燕麦煮至软糯，三文鱼蒸熟后拆碎拌入，菠菜焯水切碎',
        },
        {
          oder: 2,
          time: '1:00 PM',
          food_items: [
            {
              name: '鸭胸肉',
              weight: 95,
              macro_nutrients: { protein: 19.0, fat: 4.0, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.02, vitamin_c: 0, vitamin_d: 0, calcium: 11, iron: 1.5, sodium: 60, potassium: 300, cholesterol: 65, additional_nutrients: {} },
              recommend_reason: '新蛋白质来源，营养密度高，适合轮换饮食策略。',
            },
            {
              name: '红薯',
              weight: 30,
              macro_nutrients: { protein: 0.5, fat: 0.1, carbohydrates: 8.0, dietary_fiber: 1.0 },
              micro_nutrients: { vitamin_a: 0.7, vitamin_c: 2.4, vitamin_d: 0, calcium: 12, iron: 0.2, sodium: 5, potassium: 120, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '天然甜味蔬菜，富含 β-胡萝卜素和膳食纤维。',
            },
          ],
          cook_method: '蒸煮 — 鸭肉去皮后蒸煮至全熟，红薯蒸软后捣成泥',
        },
        {
          oder: 3,
          time: '7:00 PM',
          food_items: [
            {
              name: '牛腱肉',
              weight: 100,
              macro_nutrients: { protein: 26.0, fat: 3.0, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 10, iron: 2.5, sodium: 50, potassium: 340, cholesterol: 65, additional_nutrients: { '锌': 4.0 } },
              recommend_reason: '高蛋白低脂红肉，富含铁质和 B12。',
            },
            {
              name: '胡萝卜',
              weight: 15,
              macro_nutrients: { protein: 0.1, fat: 0, carbohydrates: 1.5, dietary_fiber: 0.4 },
              micro_nutrients: { vitamin_a: 0.6, vitamin_c: 0.9, vitamin_d: 0, calcium: 6, iron: 0.1, sodium: 8, potassium: 50, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '富含胡萝卜素，有益皮肤健康。',
            },
            {
              name: '西葫芦',
              weight: 15,
              macro_nutrients: { protein: 0.2, fat: 0, carbohydrates: 0.5, dietary_fiber: 0.2 },
              micro_nutrients: { vitamin_a: 0.02, vitamin_c: 1.7, vitamin_d: 0, calcium: 3, iron: 0.1, sodium: 1, potassium: 26, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '低碳水蔬菜，水分含量高，有助水合。',
            },
          ],
          cook_method: '炖汤 — 牛腱肉与蔬菜慢炖 30 分钟，自然冷却后喂食',
        },
      ],
    },
    weekly_special_adjustment_note: '本周引入鸭肉，注意观察是否出现消化不适。',
    suggestions: [
      '每日搭配鱼油胶囊 1 粒，强化 Omega-3 摄入',
      '保持规律运动，关节保养效果更佳',
      '食材过渡期建议新旧搭配（3:7 逐渐调整到 7:3）',
    ],
  },
  {
    oder: 3,
    diet_adjustment_principle: '多样化蛋白质来源（鱼、鸭、牛、羊），丰富营养谱，并增加微量元素补充。',
    weekly_diet_plan: {
      daily_diet_plans: [
        {
          oder: 1,
          time: '8:00 AM',
          food_items: [
            {
              name: '鳕鱼',
              weight: 80,
              macro_nutrients: { protein: 16.0, fat: 0.8, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.01, vitamin_c: 0, vitamin_d: 0.005, calcium: 20, iron: 0.4, sodium: 60, potassium: 350, cholesterol: 50, additional_nutrients: {} },
              recommend_reason: '延续第一周的优质白肉蛋白。',
            },
            {
              name: '土豆',
              weight: 20,
              macro_nutrients: { protein: 0.4, fat: 0, carbohydrates: 3.4, dietary_fiber: 0.4 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 2.0, vitamin_d: 0, calcium: 2, iron: 0.1, sodium: 1, potassium: 80, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '优质碳水来源，易消化。',
            },
            {
              name: '豌豆',
              weight: 10,
              macro_nutrients: { protein: 0.5, fat: 0, carbohydrates: 1.4, dietary_fiber: 0.5 },
              micro_nutrients: { vitamin_a: 0.03, vitamin_c: 4.0, vitamin_d: 0, calcium: 3, iron: 0.1, sodium: 1, potassium: 25, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '植物蛋白补充，增加食物多样性。',
            },
          ],
          cook_method: '蒸制 — 鳕鱼与蔬菜混合蒸煮后压成饼状，方便进食',
        },
        {
          oder: 2,
          time: '1:00 PM',
          food_items: [
            {
              name: '羊肉',
              weight: 90,
              macro_nutrients: { protein: 18.0, fat: 6.0, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 8, iron: 2.0, sodium: 60, potassium: 270, cholesterol: 70, additional_nutrients: { '锌': 3.5 } },
              recommend_reason: '新增蛋白质源，温补性质适合关节保养。',
            },
            {
              name: '南瓜',
              weight: 25,
              macro_nutrients: { protein: 0.2, fat: 0.1, carbohydrates: 4.0, dietary_fiber: 1.2 },
              micro_nutrients: { vitamin_a: 0.1, vitamin_c: 3.3, vitamin_d: 0, calcium: 12, iron: 0.2, sodium: 1, potassium: 160, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '富含纤维和维生素 A，保护消化道黏膜。',
            },
          ],
          cook_method: '炖煮 — 羊肉焯水去膻后与南瓜同炖，捣成泥状',
        },
        {
          oder: 3,
          time: '7:00 PM',
          food_items: [
            {
              name: '三文鱼',
              weight: 95,
              macro_nutrients: { protein: 19.0, fat: 6.2, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.01, vitamin_c: 0, vitamin_d: 0.012, calcium: 14, iron: 0.35, sodium: 55, potassium: 400, cholesterol: 58, additional_nutrients: { 'Omega-3': 2.3 } },
              recommend_reason: '持续补充 Omega-3，强化关节保养效果。',
            },
            {
              name: '糙米',
              weight: 25,
              macro_nutrients: { protein: 1.9, fat: 0.6, carbohydrates: 18.5, dietary_fiber: 0.9 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 4, iron: 0.4, sodium: 1, potassium: 50, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '缓释碳水，搭配鱼肉营养更均衡。',
            },
            {
              name: '西兰花',
              weight: 10,
              macro_nutrients: { protein: 0.3, fat: 0, carbohydrates: 0.7, dietary_fiber: 0.3 },
              micro_nutrients: { vitamin_a: 0.04, vitamin_c: 9.0, vitamin_d: 0, calcium: 5, iron: 0.1, sodium: 3, potassium: 32, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '抗氧化蔬菜，增强免疫。',
            },
          ],
          cook_method: '蒸拌 — 三文鱼蒸熟拆碎，糙米煮软，西兰花焯水后混合',
        },
      ],
    },
    weekly_special_adjustment_note: '首次引入羊肉，若消化正常可在第四周维持；若不适则替换回鸭肉。',
    suggestions: [
      '搭配关节宝（葡萄糖胺）1 粒 + 鱼油 1 粒',
      '可适当增加户外活动时间至 40 分钟',
      '注意观察便便颜色和成型度',
    ],
  },
  {
    oder: 4,
    diet_adjustment_principle: '根据前三周表现优化配比，形成稳定饮食模式。巩固关节保养成果。',
    weekly_diet_plan: {
      daily_diet_plans: [
        {
          oder: 1,
          time: '8:00 AM',
          food_items: [
            {
              name: '鳕鱼',
              weight: 85,
              macro_nutrients: { protein: 17.0, fat: 0.9, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0.01, vitamin_c: 0, vitamin_d: 0.005, calcium: 22, iron: 0.4, sodium: 63, potassium: 370, cholesterol: 52, additional_nutrients: {} },
              recommend_reason: '保持 Omega-3 摄入，巩固皮肤健康成果。',
            },
            {
              name: '菠菜',
              weight: 15,
              macro_nutrients: { protein: 0.4, fat: 0, carbohydrates: 0.5, dietary_fiber: 0.3 },
              micro_nutrients: { vitamin_a: 0.7, vitamin_c: 4.2, vitamin_d: 0, calcium: 15, iron: 0.4, sodium: 10, potassium: 84, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '叶酸和铁的良好来源。',
            },
            {
              name: '小米',
              weight: 20,
              macro_nutrients: { protein: 1.8, fat: 0.6, carbohydrates: 14.0, dietary_fiber: 0.3 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 3, iron: 0.5, sodium: 1, potassium: 35, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '养胃易消化的碳水来源。',
            },
          ],
          cook_method: '粥品 — 小米煮粥，鳕鱼蒸熟拆碎，菠菜焯水切碎拌入',
        },
        {
          oder: 2,
          time: '1:00 PM',
          food_items: [
            {
              name: '火鸡胸肉',
              weight: 95,
              macro_nutrients: { protein: 23.8, fat: 1.9, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 11, iron: 1.3, sodium: 58, potassium: 295, cholesterol: 63, additional_nutrients: {} },
              recommend_reason: '稳定的低脂高蛋白来源。',
            },
            {
              name: '胡萝卜',
              weight: 15,
              macro_nutrients: { protein: 0.1, fat: 0, carbohydrates: 1.5, dietary_fiber: 0.4 },
              micro_nutrients: { vitamin_a: 0.6, vitamin_c: 0.9, vitamin_d: 0, calcium: 6, iron: 0.1, sodium: 8, potassium: 50, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '维生素 A 持续补充。',
            },
            {
              name: '豌豆',
              weight: 10,
              macro_nutrients: { protein: 0.5, fat: 0, carbohydrates: 1.4, dietary_fiber: 0.5 },
              micro_nutrients: { vitamin_a: 0.03, vitamin_c: 4.0, vitamin_d: 0, calcium: 3, iron: 0.1, sodium: 1, potassium: 25, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '绿色蔬菜补充，丰富食物色彩。',
            },
          ],
          cook_method: '蒸煮 — 火鸡肉蒸熟切丁，蔬菜焯水后混合',
        },
        {
          oder: 3,
          time: '7:00 PM',
          food_items: [
            {
              name: '瘦牛肉',
              weight: 100,
              macro_nutrients: { protein: 26.0, fat: 3.5, carbohydrates: 0, dietary_fiber: 0 },
              micro_nutrients: { vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, calcium: 12, iron: 2.8, sodium: 55, potassium: 350, cholesterol: 70, additional_nutrients: { '锌': 4.5 } },
              recommend_reason: '红肉蛋白和矿物质收官。',
            },
            {
              name: '红薯',
              weight: 25,
              macro_nutrients: { protein: 0.4, fat: 0.1, carbohydrates: 6.5, dietary_fiber: 0.8 },
              micro_nutrients: { vitamin_a: 0.6, vitamin_c: 2.0, vitamin_d: 0, calcium: 10, iron: 0.2, sodium: 4, potassium: 100, cholesterol: 0, additional_nutrients: {} },
              recommend_reason: '温和碳水来源，促进消化。',
            },
          ],
          cook_method: '炖煮 — 牛肉与红薯慢炖，捣碎混合',
        },
      ],
    },
    weekly_special_adjustment_note: '本周为巩固期，食材配比已趋于稳定。下月可延续此食谱框架微调。',
    suggestions: [
      '继续搭配关节宝 1 粒 + 鱼油 1 粒',
      '记录本月体重变化，为下月计划提供参考',
      '若皮肤状况持续改善，可适当减少鱼油补充',
    ],
  },
];

export const mockSSEEvents: MockSSEEvent[] = [
  // === Phase 1: 研究阶段 ===
  { type: 'task_created', task_id: 'mock-task-001', message: '任务已创建', progress: 0, delayMs: 500 },
  { type: 'research_starting', message: '开始调研宠物营养需求...', progress: 5, delayMs: 1500 },
  { type: 'research_task_delegating', task_name: '调研金毛犬基础营养需求', message: '正在分析品种特征和营养需求...', progress: 10, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研过敏食材替代方案', message: '正在搜索鸡肉过敏替代蛋白源...', progress: 18, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研关节保养营养方案', message: '正在分析 Omega-3 和关节营养素...', progress: 25, delayMs: 1500 },
  { type: 'research_finalizing', message: '调研完成，正在生成四周差异化方案...', progress: 30, delayMs: 1500 },

  // === Phase 2: 周计划阶段（4 周并行，node/task_name 与后端对齐） ===
  { type: 'dispatching', message: '分发四周计划任务...', progress: 35, delayMs: 800 },
  { type: 'week_planning', node: 'week_agent_1', task_name: '第1周饮食计划', detail: { week: 1 }, message: '第1周: 基础适应期食谱制定中...', progress: 40, delayMs: 1200 },
  { type: 'week_planning', node: 'week_agent_2', task_name: '第2周饮食计划', detail: { week: 2 }, message: '第2周: 营养强化期食谱制定中...', progress: 43, delayMs: 800 },
  { type: 'week_searching', node: 'week_agent_1', task_name: '第1周饮食计划', detail: { week: 1 }, message: '第1周: 正在搜索低敏蛋白食材...', progress: 46, delayMs: 1000 },
  { type: 'week_planning', node: 'week_agent_3', task_name: '第3周饮食计划', detail: { week: 3 }, message: '第3周: 多样化食谱制定中...', progress: 48, delayMs: 800 },
  { type: 'week_searching', node: 'week_agent_2', task_name: '第2周饮食计划', detail: { week: 2 }, message: '第2周: 正在搜索 Omega-3 食材...', progress: 50, delayMs: 900 },
  { type: 'week_completed', node: 'week_agent_1', task_name: '第1周饮食计划', detail: { week: 1 }, message: '第1周食谱已完成', progress: 55, delayMs: 800 },
  { type: 'week_planning', node: 'week_agent_4', task_name: '第4周饮食计划', detail: { week: 4 }, message: '第4周: 巩固优化期食谱制定中...', progress: 58, delayMs: 800 },
  { type: 'week_searching', node: 'week_agent_3', task_name: '第3周饮食计划', detail: { week: 3 }, message: '第3周: 正在搜索多样化蛋白源...', progress: 60, delayMs: 900 },
  { type: 'week_completed', node: 'week_agent_2', task_name: '第2周饮食计划', detail: { week: 2 }, message: '第2周食谱已完成', progress: 65, delayMs: 800 },
  { type: 'week_searching', node: 'week_agent_4', task_name: '第4周饮食计划', detail: { week: 4 }, message: '第4周: 正在搜索关节保养食材...', progress: 68, delayMs: 900 },
  { type: 'week_completed', node: 'week_agent_3', task_name: '第3周饮食计划', detail: { week: 3 }, message: '第3周食谱已完成', progress: 73, delayMs: 800 },
  { type: 'week_writing', node: 'week_agent_4', task_name: '第4周饮食计划', detail: { week: 4 }, message: '第4周: 正在撰写饮食计划...', progress: 76, delayMs: 1000 },
  { type: 'week_completed', node: 'week_agent_4', task_name: '第4周饮食计划', detail: { week: 4 }, message: '第4周食谱已完成', progress: 78, delayMs: 800 },

  // === Phase 3: 汇总阶段 ===
  { type: 'gathering', message: '收集所有周计划数据...', progress: 85, delayMs: 1000 },
  { type: 'structuring', message: '正在生成结构化报告...', progress: 92, delayMs: 1500 },
  // completed 事件：携带 detail.plans（与后端 gather 节点一致）
  {
    type: 'completed',
    message: '针对金毛犬的个性化月度饮食计划，重点关注鸡肉过敏替代方案和关节保养营养补充。四周食谱已根据营养均衡原则差异化设计。',
    detail: { plans: mockWeeklyPlans },
    progress: 100,
    delayMs: 300,
  },
  { type: 'task_completed', task_id: 'mock-task-001', message: '饮食计划生成完成！', progress: 100, delayMs: 500 },
];

/** 计划生成完成后的任务状态 */
export const mockCompletedTask: TaskResponse = {
  id: 'mock-task-001',
  task_type: 'plan_generation',
  status: 'completed',
  progress: 100,
  current_node: 'done',
  input_data: {},
  output_data: { plan_id: 'mock-plan-001' },
  started_at: new Date(Date.now() - 25000).toISOString(),
  completed_at: new Date().toISOString(),
  created_at: new Date(Date.now() - 30000).toISOString(),
};

/** 完整的 PetDietPlan 结果（与后端结构对齐，用于轮询降级和 REST 获取场景） */
export const mockPlanResult = {
  id: 'mock-plan-001',
  user_id: 'mock-user-001',
  // PetDietPlan 结构
  pet_information: {
    pet_type: 'dog',
    pet_breed: '金毛寻回犬',
    pet_age: 36,
    pet_weight: 28.5,
    health_status: '对鸡肉过敏，关节需要保养',
  },
  ai_suggestions: '针对金毛犬的个性化月度饮食计划，重点关注鸡肉过敏替代方案和关节保养营养补充。四周食谱已根据营养均衡原则差异化设计。',
  pet_diet_plan: {
    monthly_diet_plan: mockWeeklyPlans,
  },
  created_at: new Date().toISOString(),
};
