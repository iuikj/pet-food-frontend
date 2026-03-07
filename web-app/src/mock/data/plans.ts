/**
 * 计划生成 Mock 数据
 * 包含 SSE 事件序列 和 最终计划结果
 */
import type { SSEEvent, TaskResponse } from '../../api/types';

/** SSE 事件序列（模拟 V1 三阶段流水线，总时长约 20 秒） */
export interface MockSSEEvent extends SSEEvent {
  delayMs: number;
}

export const mockSSEEvents: MockSSEEvent[] = [
  // === Phase 1: 研究阶段 ===
  { type: 'task_created', task_id: 'mock-task-001', message: '任务已创建', progress: 0, delayMs: 500 },
  { type: 'research_starting', message: '开始调研宠物营养需求...', progress: 5, delayMs: 1500 },
  { type: 'research_task_delegating', task_name: '调研金毛犬基础营养需求', message: '正在分析品种特征和营养需求...', progress: 10, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研过敏食材替代方案', message: '正在搜索鸡肉过敏替代蛋白源...', progress: 18, delayMs: 2000 },
  { type: 'research_task_delegating', task_name: '调研关节保养营养方案', message: '正在分析 Omega-3 和关节营养素...', progress: 25, delayMs: 1500 },
  { type: 'research_finalizing', message: '调研完成，正在生成四周差异化方案...', progress: 30, delayMs: 1500 },

  // === Phase 2: 周计划阶段（4 周并行） ===
  { type: 'dispatching', message: '分发四周计划任务...', progress: 35, delayMs: 800 },
  { type: 'week_planning', detail: { week: 1 }, message: '第 1 周：基础适应期食谱制定中...', progress: 40, delayMs: 1500 },
  { type: 'week_planning', detail: { week: 2 }, message: '第 2 周：营养强化期食谱制定中...', progress: 48, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 1 }, message: '第 1 周食谱已完成', progress: 55, delayMs: 1000 },
  { type: 'week_planning', detail: { week: 3 }, message: '第 3 周：多样化食谱制定中...', progress: 60, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 2 }, message: '第 2 周食谱已完成', progress: 65, delayMs: 1000 },
  { type: 'week_planning', detail: { week: 4 }, message: '第 4 周：巩固优化期食谱制定中...', progress: 70, delayMs: 1200 },
  { type: 'week_completed', detail: { week: 3 }, message: '第 3 周食谱已完成', progress: 75, delayMs: 1000 },
  { type: 'week_completed', detail: { week: 4 }, message: '第 4 周食谱已完成', progress: 80, delayMs: 1000 },

  // === Phase 3: 汇总阶段 ===
  { type: 'gathering', message: '收集所有周计划数据...', progress: 85, delayMs: 1000 },
  { type: 'structuring', message: '正在生成结构化报告...', progress: 92, delayMs: 1500 },
  // final_result 在 task_completed 之前发送
  { type: 'final_result', data: null, message: '发送最终结果', progress: 98, delayMs: 300 },  // data 会在 handler 中被覆盖
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

/** 完整的计划结果数据（含每日食谱详情） */
export const mockPlanResult = {
  id: 'mock-plan-001',
  user_id: 'mock-user-001',
  pet_type: 'dog' as const,
  pet_breed: '金毛寻回犬',
  pet_age: 3,
  pet_weight: 28.5,
  health_status: '对鸡肉过敏，关节需要保养',
  content: {
    plan_name: '专属月度营养计划',
    duration: '4 周',
    summary: '针对金毛犬的个性化月度饮食计划，重点关注鸡肉过敏替代方案和关节保养营养补充。',
    tips: [
      '本周专注于控制碳水化合物摄入，以启动减重过程。',
      '观察是否有任何皮肤瘙痒反应（虽然已剔除常见过敏源）。',
      '记得每天保持至少 30 分钟的低强度散步。',
    ],
    weeks: [
      {
        week: 1,
        theme: '基础适应期',
        description: '以易消化、低过敏的蛋白质为主，帮助肠胃适应新食谱。',
        daily_calories: 1350,
        daily_water: 500,
        protein: 'High',
        fat: 'Low',
        carbs: 'Med',
        meals: [
          {
            name: '清蒸深海鳕鱼配南瓜',
            time: '8:00 AM',
            ingredients: [
              { name: '鳕鱼', amount: '80g' },
              { name: '南瓜', amount: '30g' },
              { name: '西兰花', amount: '10g' },
            ],
            tip: '鳕鱼富含 Omega-3，有助于改善皮肤状况。南瓜提供膳食纤维，帮助消化。',
          },
          {
            name: '火鸡肉胡萝卜泥',
            time: '1:00 PM',
            ingredients: [
              { name: '火鸡肉', amount: '90g' },
              { name: '胡萝卜', amount: '20g' },
            ],
            cooking_tip: '蒸煮火鸡肉至全熟，将胡萝卜切碎混合，避免添加任何调味料。',
          },
          {
            name: '牛肉青豆拌饭',
            time: '7:00 PM',
            ingredients: [
              { name: '瘦牛肉', amount: '100g' },
              { name: '青豆', amount: '15g' },
              { name: '糙米', amount: '20g' },
            ],
            supplement: '关节宝 (Glucosamine) 1粒',
          },
        ],
      },
      {
        week: 2,
        theme: '营养强化期',
        description: '逐步增加 Omega-3 脂肪酸摄入，强化关节保养。',
        daily_calories: 1400,
        daily_water: 520,
        protein: 'High',
        fat: 'Med',
        carbs: 'Low',
        meals: [
          {
            name: '三文鱼燕麦粥',
            time: '8:00 AM',
            ingredients: [
              { name: '三文鱼', amount: '85g' },
              { name: '燕麦', amount: '25g' },
              { name: '菠菜', amount: '10g' },
            ],
            tip: '三文鱼是优质 Omega-3 来源，搭配燕麦提供缓释能量。',
          },
          {
            name: '鸭肉红薯泥',
            time: '1:00 PM',
            ingredients: [
              { name: '鸭胸肉', amount: '95g' },
              { name: '红薯', amount: '30g' },
            ],
            cooking_tip: '鸭肉去皮后蒸煮，红薯蒸软后捣成泥。',
          },
          {
            name: '牛肉蔬菜汤',
            time: '7:00 PM',
            ingredients: [
              { name: '牛腱肉', amount: '100g' },
              { name: '胡萝卜', amount: '15g' },
              { name: '西葫芦', amount: '15g' },
            ],
            supplement: '鱼油胶囊 1粒',
          },
        ],
      },
      {
        week: 3,
        theme: '多样化周',
        description: '引入更多蛋白质来源（鱼、鸭、牛肉），丰富营养谱。',
        daily_calories: 1380,
        daily_water: 510,
        protein: 'High',
        fat: 'Med',
        carbs: 'Med',
        meals: [
          {
            name: '鳕鱼蔬菜饼',
            time: '8:00 AM',
            ingredients: [
              { name: '鳕鱼', amount: '80g' },
              { name: '土豆', amount: '20g' },
              { name: '豌豆', amount: '10g' },
            ],
            tip: '将鳕鱼和蔬菜混合蒸煮后压成饼状，方便进食。',
          },
          {
            name: '羊肉南瓜糊',
            time: '1:00 PM',
            ingredients: [
              { name: '羊肉', amount: '90g' },
              { name: '南瓜', amount: '25g' },
            ],
            cooking_tip: '羊肉焯水去膻后炖煮，搭配南瓜泥。',
          },
          {
            name: '三文鱼糙米饭',
            time: '7:00 PM',
            ingredients: [
              { name: '三文鱼', amount: '95g' },
              { name: '糙米', amount: '25g' },
              { name: '西兰花', amount: '10g' },
            ],
            supplement: '关节宝 (Glucosamine) 1粒 + 鱼油 1粒',
          },
        ],
      },
      {
        week: 4,
        theme: '巩固优化期',
        description: '根据前三周表现优化配比，形成稳定饮食模式。',
        daily_calories: 1360,
        daily_water: 500,
        protein: 'High',
        fat: 'Low',
        carbs: 'Med',
        meals: [
          {
            name: '鳕鱼菠菜粥',
            time: '8:00 AM',
            ingredients: [
              { name: '鳕鱼', amount: '85g' },
              { name: '菠菜', amount: '15g' },
              { name: '小米', amount: '20g' },
            ],
            tip: '小米粥易消化，搭配鳕鱼和菠菜提供全面营养。',
          },
          {
            name: '火鸡肉蔬菜拼盘',
            time: '1:00 PM',
            ingredients: [
              { name: '火鸡肉', amount: '95g' },
              { name: '胡萝卜', amount: '15g' },
              { name: '豌豆', amount: '10g' },
            ],
            cooking_tip: '火鸡肉蒸熟切丁，蔬菜焯水后混合。',
          },
          {
            name: '牛肉红薯泥',
            time: '7:00 PM',
            ingredients: [
              { name: '瘦牛肉', amount: '100g' },
              { name: '红薯', amount: '25g' },
            ],
            supplement: '关节宝 1粒 + 鱼油 1粒',
          },
        ],
      },
    ],
  },
  created_at: new Date().toISOString(),
};
