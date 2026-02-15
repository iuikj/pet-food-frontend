<template>
  <view class="min-h-screen bg-[#F5F5F5]" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
    <!-- Header -->
    <header class="px-6 pt-12 pb-4 flex justify-between items-center bg-[#F5F5F5]/90 backdrop-blur-md sticky top-0 z-50">
      <view class="flex items-center gap-3">
        <view class="relative">
          <!-- 宠物头像 -->
          <button v-if="hasPets && currentPet" @click="showPetMenu = true" class="p-0 bg-transparent border-none">
            <image
              v-if="currentPet.avatar"
              :src="currentPet.avatar"
              class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              mode="aspectFill"
            />
            <view v-else class="w-12 h-12 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-bold text-lg border-2 border-white shadow-sm">
              {{ currentPet.name.charAt(0) }}
            </view>
            <view class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></view>
          </button>
          <!-- 无宠物时的添加按钮 -->
          <button
            v-else
            @click="goToOnboarding"
            class="w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-[#8B5CF6]/50 flex items-center justify-center text-[#8B5CF6] shadow-sm"
          >
            <text class="material-icons-round">add</text>
          </button>
        </view>
        <view>
          <text class="text-xs text-gray-400 font-medium uppercase tracking-wider block">
            {{ hasPets ? '计划用于' : '欢迎使用' }}
          </text>
          <button @click="showPetMenu = true" class="flex items-center gap-1 bg-transparent border-none p-0">
            <text class="text-xl font-bold text-gray-900">
              {{ currentPet ? currentPet.name : '选择宠物' }}
            </text>
            <text v-if="hasPets" class="material-icons-round text-[#8B5CF6] text-sm">pets</text>
            <text v-else class="material-icons-round text-[#8B5CF6] text-sm">arrow_forward_ios</text>
          </button>
        </view>
      </view>
      <view class="flex gap-3">
        <button class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 border-none">
          <text class="material-icons-round">search</text>
        </button>
        <button class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 relative border-none">
          <text class="material-icons-round">notifications_none</text>
          <view class="absolute top-2 right-2.5 w-2 h-2 bg-red-400 rounded-full"></view>
        </button>
      </view>
    </header>

    <!-- Main Content -->
    <view class="px-6 space-y-6 pb-24">
      <!-- 周历区域 -->
      <section>
        <view class="flex justify-between items-end mb-4">
          <view>
            <text class="text-2xl font-bold text-gray-900 block">本周</text>
            <text class="text-sm text-gray-400">
              AI计划：<text class="text-[#8B5CF6] font-semibold">{{ hasRecipe ? '体重管理' : '待创建' }}</text>
            </text>
          </view>
          <button @click="isCalendarExpanded = !isCalendarExpanded" class="text-sm text-[#8B5CF6] font-medium flex items-center gap-1 bg-transparent border-none p-0">
            日历
            <text class="material-icons-round text-sm" :style="{ transform: isCalendarExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }">expand_more</text>
          </button>
        </view>

        <!-- 简略周视图 -->
        <view v-if="!isCalendarExpanded" class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
          <view
            v-for="(day, idx) in currentWeekDays"
            :key="idx"
            :class="['flex flex-col items-center gap-1', !day.isToday && idx < 2 ? 'opacity-40' : '', day.isToday ? 'transform scale-110' : '']"
          >
            <text :class="['text-xs', day.isToday ? 'font-bold text-[#8B5CF6]' : 'font-medium text-gray-400']">
              {{ weekDayLabels[idx] }}
            </text>
            <view
              :class="[
                day.isToday
                  ? 'w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-base font-bold shadow-lg relative'
                  : 'w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700'
              ]"
            >
              {{ day.date }}
              <view v-if="day.isToday" class="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full"></view>
            </view>
          </view>
        </view>

        <!-- 展开的四周日历视图 -->
        <view v-if="isCalendarExpanded" class="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <!-- 星期标题行 -->
          <view class="grid grid-cols-8 gap-1 mb-2">
            <view class="text-xs font-medium text-gray-400 text-center"></view>
            <view v-for="(label, idx) in allWeekDayLabels" :key="idx" class="text-xs font-medium text-gray-400 text-center">
              {{ label }}
            </view>
          </view>
          <!-- 四周日期 -->
          <view
            v-for="(week, weekIdx) in weeksData"
            :key="weekIdx"
            :class="['grid grid-cols-8 gap-1 p-2 rounded-xl border transition-all', week.bgClass, week.borderClass]"
          >
            <!-- 周标签 -->
            <view :class="['flex flex-col justify-center items-center text-center', week.textClass]">
              <text class="text-[10px] font-bold leading-tight">{{ week.label }}</text>
              <text class="text-[8px] opacity-70">{{ week.startDate }}</text>
            </view>
            <!-- 日期格子 -->
            <view
              v-for="(day, dayIdx) in week.days"
              :key="dayIdx"
              :class="[
                'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                day.isToday
                  ? 'bg-[#8B5CF6] text-white shadow-lg font-bold'
                  : 'hover:bg-white/50'
              ]"
            >
              {{ day.date }}
            </view>
          </view>
        </view>
      </section>

      <!-- 无宠物引导卡片 -->
      <section v-if="!hasPets" class="bg-[#8B5CF6]/20 rounded-3xl p-6 relative overflow-hidden">
        <view class="absolute -top-10 -right-10 w-40 h-40 bg-[#8B5CF6]/20 rounded-full blur-3xl"></view>
        <view class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl"></view>
        <view class="relative z-10 flex flex-col items-center text-center py-4">
          <view class="w-16 h-16 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mb-4 shadow-sm">
            <text class="material-icons-round text-3xl text-[#8B5CF6]">pets</text>
          </view>
          <text class="font-bold text-xl mb-2 text-gray-900 block">创建您的第一个宠物档案</text>
          <text class="text-sm text-gray-500/80 mb-6 block max-w-60">
            添加您的爱宠信息，为它量身定制专属的科学营养计划。
          </text>
          <button
            @click="goToOnboarding"
            class="bg-[#8B5CF6] text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 border-none"
            style="box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);"
          >
            <text class="material-icons-round text-lg">add</text>
            立即添加
          </button>
        </view>
      </section>

      <!-- 无食谱引导卡片 -->
      <section v-if="hasPets && !hasRecipe">
        <text class="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 block">今日餐食</text>
        <view class="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center text-center gap-3 py-8">
          <view class="w-12 h-12 rounded-full bg-yellow-300/30 flex items-center justify-center mb-1">
            <text class="material-icons-round text-2xl text-yellow-700">restaurant_menu</text>
          </view>
          <text class="font-bold text-lg text-gray-900 block">开始智能饮食规划</text>
          <text class="text-sm text-gray-400 px-4 mb-2 block">
            还没有饮食计划？让AI助手帮您生成完美的每日食谱。
          </text>
          <button @click="goToCreatePlan" class="text-[#8B5CF6] font-bold text-sm flex items-center gap-1 bg-transparent border-none p-0">
            开启规划
            <text class="material-icons-round text-sm">arrow_forward</text>
          </button>
        </view>
      </section>

      <!-- 营养进度卡片 (有食谱时显示) -->
      <section v-if="hasRecipe" class="bg-[#8B5CF6]/20 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <view class="absolute -top-10 -right-10 w-40 h-40 bg-[#8B5CF6]/20 rounded-full blur-3xl"></view>
        <view class="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl"></view>
        <view class="relative z-10">
          <view class="flex justify-between items-start mb-6">
            <view>
              <text class="font-bold text-lg text-gray-900 block">每日营养</text>
              <text class="text-sm opacity-70 text-gray-700 block">已完成每日目标的85%</text>
            </view>
            <view class="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <view class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></view>
              AI优化中
            </view>
          </view>
          <view class="flex items-center gap-6">
            <!-- 圆形进度 -->
            <view class="relative w-32 h-32 flex-shrink-0">
              <view class="w-full h-full rounded-full flex items-center justify-center" style="background: conic-gradient(#A3D9A5 0% 85%, rgba(255,255,255,0.4) 85% 100%);">
                <view class="w-24 h-24 rounded-full bg-[#8B5CF6]/20 flex flex-col items-center justify-center">
                  <text class="text-3xl font-bold text-gray-900">850</text>
                  <text class="text-[10px] uppercase font-medium opacity-70 text-gray-600">剩余卡路里</text>
                </view>
              </view>
            </view>
            <!-- 营养条 -->
            <view class="flex-1 space-y-4">
              <view>
                <view class="flex justify-between text-xs mb-1 font-medium text-gray-700">
                  <text>蛋白质</text>
                  <text>32g / 45g</text>
                </view>
                <view class="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                  <view class="h-full bg-green-600 rounded-full" style="width: 70%"></view>
                </view>
              </view>
              <view>
                <view class="flex justify-between text-xs mb-1 font-medium text-gray-700">
                  <text>脂肪</text>
                  <text>12g / 18g</text>
                </view>
                <view class="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                  <view class="h-full bg-yellow-500 rounded-full" style="width: 65%"></view>
                </view>
              </view>
              <view>
                <view class="flex justify-between text-xs mb-1 font-medium text-gray-700">
                  <text>碳水化合物</text>
                  <text>40g / 50g</text>
                </view>
                <view class="h-2 w-full bg-white/40 rounded-full overflow-hidden">
                  <view class="h-full bg-blue-400 rounded-full" style="width: 80%"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </section>

      <!-- 今日餐食列表 (有食谱时显示) -->
      <section v-if="hasRecipe">
        <view class="flex items-center gap-2 mb-4">
          <text class="text-lg font-bold text-gray-900">今日餐食</text>
          <text class="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-500 font-normal">
            已完成 {{ completedMealsCount }}/{{ mealsData.length }} 餐
          </text>
        </view>
        <view class="space-y-4">
          <view
            v-for="meal in mealsData"
            :key="meal.id"
            class="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <view class="p-4 flex items-center gap-4" @click="toggleMealExpand(meal.id)">
              <!-- 餐食图标 -->
              <view :class="['w-12 h-12 rounded-xl flex items-center justify-center', getMealStyle(meal.type).bg]">
                <text :class="['material-icons-round text-2xl', getMealStyle(meal.type).color]">{{ getMealStyle(meal.type).icon }}</text>
              </view>
              <!-- 餐食信息 -->
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <text class="font-bold text-gray-900">{{ meal.name }}</text>
                  <view v-if="meal.isCompleted" class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <text class="material-icons-round text-white text-sm">check</text>
                  </view>
                </view>
                <text class="text-sm text-gray-400 block">{{ meal.time }} · {{ meal.calories }} 卡路里</text>
              </view>
              <!-- 展开箭头 -->
              <text class="material-icons-round text-xl text-gray-400" :style="{ transform: expandedMealId === meal.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }">expand_more</text>
            </view>
            <!-- 展开内容 -->
            <view v-if="expandedMealId === meal.id" class="px-4 pb-4 border-t border-gray-100">
              <view class="pt-4 space-y-3">
                <!-- 食材 -->
                <view class="flex flex-wrap gap-2">
                  <view
                    v-for="(ingredient, i) in meal.details.ingredients"
                    :key="i"
                    :class="['px-3 py-1.5 rounded-full text-sm', ingredient.color]"
                  >
                    {{ ingredient.name }} {{ ingredient.amount }}
                  </view>
                </view>
                <!-- AI 提示 -->
                <view class="bg-[#8B5CF6]/10 p-3 rounded-xl flex gap-2">
                  <text class="material-icons-round text-[#8B5CF6]">smart_toy</text>
                  <text class="text-sm text-gray-600 flex-1">{{ meal.details.aiTip }}</text>
                </view>
                <!-- 完成按钮 -->
                <button
                  @click.stop="toggleMealComplete(meal.id)"
                  :class="[
                    'w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-none',
                    meal.isCompleted
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-[#8B5CF6] text-white'
                  ]"
                >
                  <text class="material-icons-round">{{ meal.isCompleted ? 'check_circle' : 'check' }}</text>
                  {{ meal.isCompleted ? '已完成' : '标记完成' }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </section>

      <!-- 功能卡片 -->
      <section class="grid grid-cols-2 gap-4">
        <view :class="['p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden', hasRecipe ? 'bg-blue-100/80' : 'bg-blue-50']">
          <text class="material-icons-round absolute -right-2 -bottom-4 text-6xl text-blue-300/50">water_drop</text>
          <view>
            <text :class="['font-bold block', hasRecipe ? 'text-blue-900' : 'text-blue-400']">饮水量</text>
            <text v-if="!hasRecipe" class="text-xs text-blue-300 mt-1 block">记录宠物数据以解锁</text>
            <text v-else class="text-xs text-blue-600 mt-1 block">目标：800毫升</text>
          </view>
          <view v-if="hasRecipe" class="flex items-end gap-1 mt-auto">
            <text class="text-2xl font-bold text-blue-900">550</text>
            <text class="text-sm font-medium mb-1 text-blue-600">毫升</text>
          </view>
          <text v-else class="material-icons-round text-4xl text-blue-300 mt-2">lock</text>
        </view>
        <view :class="['p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden', hasRecipe ? 'bg-yellow-100/80' : 'bg-yellow-50']">
          <text class="material-icons-round absolute -right-2 -bottom-4 text-6xl text-yellow-300/50">monitor_weight</text>
          <view>
            <text :class="['font-bold block', hasRecipe ? 'text-yellow-900' : 'text-yellow-400']">当前体重</text>
            <text v-if="!hasRecipe" class="text-xs text-yellow-300 mt-1 block">记录宠物数据以解锁</text>
            <text v-else class="text-xs text-yellow-600 mt-1 block">上次：2天前</text>
          </view>
          <view v-if="hasRecipe" class="flex items-end gap-1 mt-auto">
            <text class="text-2xl font-bold text-yellow-900">12.4</text>
            <text class="text-sm font-medium mb-1 text-yellow-600">公斤</text>
          </view>
          <text v-else class="material-icons-round text-4xl text-yellow-300 mt-2">lock</text>
        </view>
      </section>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePetStore } from '@/stores/pet';

const petStore = usePetStore();

// 响应式状态
const showPetMenu = ref(false);
const isCalendarExpanded = ref(false);
const expandedMealId = ref(null);

// 计算属性
const hasPets = computed(() => petStore.pets.length > 0);
const currentPet = computed(() => petStore.currentPet);
const hasRecipe = computed(() => currentPet.value?.hasPlan ?? false);

// 餐食数据
const mealsData = ref([
  {
    id: 'breakfast-1',
    type: 'breakfast',
    name: '早晨干粮混合',
    time: '上午 08:00',
    calories: 350,
    isCompleted: true,
    details: {
      ingredients: [
        { name: '鸡胸肉', amount: '60g', color: 'bg-red-50 text-red-600' },
        { name: '糙米', amount: '30g', color: 'bg-gray-100 text-gray-600' },
        { name: '胡萝卜', amount: '15g', color: 'bg-orange-50 text-orange-600' }
      ],
      aiTip: '早餐提供充足能量，鸡胸肉是优质蛋白来源。'
    }
  },
  {
    id: 'lunch-1',
    type: 'lunch',
    name: '午餐碗',
    time: '下午 12:30',
    calories: 420,
    isCompleted: false,
    details: {
      ingredients: [
        { name: '三文鱼', amount: '80g', color: 'bg-pink-50 text-pink-600' },
        { name: '西兰花', amount: '25g', color: 'bg-green-50 text-green-600' },
        { name: '红薯', amount: '30g', color: 'bg-orange-50 text-orange-600' }
      ],
      aiTip: '三文鱼富含Omega-3脂肪酸，有助于维护皮肤和毛发健康。'
    }
  },
  {
    id: 'dinner-1',
    type: 'dinner',
    name: '晚间盛宴',
    time: '下午 06:00',
    calories: 410,
    isCompleted: false,
    details: {
      ingredients: [
        { name: '火鸡肉', amount: '90g', color: 'bg-red-50 text-red-600' },
        { name: '南瓜', amount: '30g', color: 'bg-orange-50 text-orange-600' },
        { name: '青豆', amount: '15g', color: 'bg-green-50 text-green-600' }
      ],
      aiTip: '火鸡肉是低脂高蛋白的理想选择，适合控制体重。'
    }
  }
]);

const completedMealsCount = computed(() => mealsData.value.filter(m => m.isCompleted).length);

// 周历数据
const weekDayLabels = ['一', '二', '三', '四', '五'];
const allWeekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];

const currentWeekDays = computed(() => {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const days = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString()
    });
  }
  return days;
});

// 四周日历数据
const weeksData = computed(() => {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);

  const weeks = [];
  const weekStyles = [
    { bgClass: 'bg-[#8B5CF6]/20', borderClass: 'border-[#8B5CF6]/30', textClass: 'text-[#8B5CF6]', label: '第一周' },
    { bgClass: 'bg-yellow-100', borderClass: 'border-yellow-300', textClass: 'text-yellow-700', label: '第二周' },
    { bgClass: 'bg-blue-100', borderClass: 'border-blue-300', textClass: 'text-blue-700', label: '第三周' },
    { bgClass: 'bg-purple-100', borderClass: 'border-purple-300', textClass: 'text-purple-700', label: '第四周' }
  ];

  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() + w * 7);

    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      days.push({
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
      });
    }
    weeks.push({
      ...weekStyles[w],
      days,
      startDate: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
    });
  }
  return weeks;
});

// 获取餐食样式
const getMealStyle = (type) => {
  const styles = {
    breakfast: { bg: 'bg-orange-100', icon: 'wb_sunny', color: 'text-orange-500' },
    lunch: { bg: 'bg-green-100', icon: 'restaurant', color: 'text-green-500' },
    dinner: { bg: 'bg-purple-100', icon: 'nights_stay', color: 'text-purple-500' }
  };
  return styles[type] || styles.breakfast;
};

// 方法
const goToOnboarding = () => {
  uni.navigateTo({ url: '/pages/onboarding/step1' });
};

const goToCreatePlan = () => {
  uni.navigateTo({ url: '/pages/plan/create' });
};

const toggleMealExpand = (mealId) => {
  expandedMealId.value = expandedMealId.value === mealId ? null : mealId;
};

const toggleMealComplete = (mealId) => {
  const meal = mealsData.value.find(m => m.id === mealId);
  if (meal) {
    meal.isCompleted = !meal.isCompleted;
  }
};
</script>

<style>
/* 页面基础样式 */
page {
  background-color: #F5F5F5;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

/* space-y-6 实现 */
.space-y-6 > view + view,
.space-y-6 > section + section {
  margin-top: 1.5rem;
}

.space-y-4 > view + view {
  margin-top: 1rem;
}

.space-y-3 > view + view {
  margin-top: 0.75rem;
}

/* Material Icons 样式 */
.material-icons-round {
  font-family: 'Material Icons Round';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

/* 动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 模糊效果 */
.blur-3xl {
  filter: blur(64px);
}

.blur-2xl {
  filter: blur(40px);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.backdrop-blur-md {
  backdrop-filter: blur(12px);
}
</style>
