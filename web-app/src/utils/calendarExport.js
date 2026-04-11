/**
 * 日历导出工具
 *
 * - 原生平台（Android/iOS）：使用 @ebarooni/capacitor-calendar 写入系统日历
 * - Web 平台降级：生成 .ics 文件供下载导入
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';

/** localStorage 键，缓存用户的首选日历 ID 和名称 */
const PREFERRED_CALENDAR_KEY = 'petcare_preferred_calendar_id';
const PREFERRED_CALENDAR_TITLE_KEY = 'petcare_preferred_calendar_title';

/**
 * 将日期字符串 + 可选时间字符串转为 Unix 毫秒时间戳
 */
function toTimestampMs(dateStr, timeStr) {
  const base = new Date(`${dateStr}T${timeStr || '09:00'}:00`);
  return base.getTime();
}

/**
 * 格式化为 iCalendar 日期时间字符串 (YYYYMMDDTHHmmssZ)
 */
function toIcsDateTime(dateStr, timeStr) {
  if (!timeStr) {
    // 全天事件用 DATE 格式
    return dateStr.replace(/-/g, '');
  }
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * 从日历列表中挑选最合适的本地（设备）日历
 *
 * Calendar 接口（@ebarooni/capacitor-calendar@8）可用字段：
 *   Android: id, title, internalTitle, color, accountName, ownerAccount, visible
 *   iOS:     id, title, color, type, isImmutable, allowsContentModifications, source
 *
 * Android 本地日历识别策略（优先级由高到低）：
 *  1. accountName 精准匹配——本地日历的 accountName 通常为空、"Phone"、"DEVICE" 等，
 *     而第三方同步日历为邮箱或包名（如 "com.hpbr.bosszhipin"）
 *  2. title / internalTitle 含本地关键词（小米/本地/我的日历 等）
 *  3. 排除明确的第三方同步日历后取第一个可见日历
 *
 * @param {Array} calendars - CapacitorCalendar.listCalendars() 返回的日历列表
 * @returns {object|null} 选中的日历对象
 */
function pickLocalCalendar(calendars) {
  if (!calendars || calendars.length === 0) return null;

  // 优先从可见日历中选择（Android visible 字段）
  const visible = calendars.filter(c => c.visible !== false);
  const pool = visible.length > 0 ? visible : calendars;

  // 策略 1：accountName 精准匹配本地日历特征
  // Android 本地日历的 accountName 通常为 null / "" / "Phone" / "DEVICE" / "Local"
  const byAccount = pool.find(c => {
    const acct = (c.accountName || '').trim().toLowerCase();
    return (
      acct === '' ||
      acct === 'phone' ||
      acct === 'device' ||
      acct === 'local' ||
      acct === '本地' ||
      acct === '本地账户'
    );
  });
  if (byAccount) return byAccount;

  // 策略 2：title / internalTitle 含本地关键词（兼容各厂商命名差异）
  const localKeywords = [
    '本地', '我的日历', '个人', 'phone', 'device', 'local',
    '小米', 'miui', 'xiaomi', 'hyperos', 'my calendar',
  ];
  const byTitle = pool.find(c => {
    const title = (c.title || '').toLowerCase();
    const internal = (c.internalTitle || '').toLowerCase();
    return localKeywords.some(kw => title.includes(kw) || internal.includes(kw));
  });
  if (byTitle) return byTitle;

  // 策略 3：排除明确的第三方同步日历（accountName 包含 @ 或 com.），取第一个
  const nonThirdParty = pool.filter(c => {
    const acct = (c.accountName || '').toLowerCase();
    return !acct.includes('@') && !acct.startsWith('com.');
  });
  if (nonThirdParty.length > 0) return nonThirdParty[0];

  // 最终兜底：第一个日历
  return pool[0] || null;
}

/**
 * 获取首选日历 { id, title }
 *
 * 需要已授予日历读取权限。返回值会被缓存到 localStorage 以避免重复枚举。
 * @returns {Promise<{ id: string; title: string } | null>}
 */
async function getPreferredCalendar() {
  // 1. 检查缓存
  const cachedId = localStorage.getItem(PREFERRED_CALENDAR_KEY);
  const cachedTitle = localStorage.getItem(PREFERRED_CALENDAR_TITLE_KEY);
  if (cachedId) return { id: cachedId, title: cachedTitle || '' };

  // 2. 枚举可用日历，智能挑选本地日历
  try {
    const { result: calendars } = await CapacitorCalendar.listCalendars();
    console.log('[calendarExport] 可用日历列表:', calendars?.map(c =>
      `[${c.id}] "${c.title}" account=${c.accountName} owner=${c.ownerAccount}`
    ));
    const target = pickLocalCalendar(calendars);
    if (target) {
      const id = String(target.id);
      const title = target.title || '';
      localStorage.setItem(PREFERRED_CALENDAR_KEY, id);
      localStorage.setItem(PREFERRED_CALENDAR_TITLE_KEY, title);
      console.log(`[calendarExport] 选定本地日历: "${title}" (id=${id}, account=${target.accountName})`);
      return { id, title };
    }
    console.warn('[calendarExport] 未找到合适的日历');
  } catch (e) {
    console.warn('[calendarExport] 枚举日历列表失败', e);
  }
  return null;
}

/**
 * 清除已缓存的首选日历（用于重置选择）
 */
export function clearPreferredCalendar() {
  localStorage.removeItem(PREFERRED_CALENDAR_KEY);
  localStorage.removeItem(PREFERRED_CALENDAR_TITLE_KEY);
}

/**
 * 生成单个待办的 .ics 内容
 */
function generateIcsContent(todo) {
  const uid = `${todo.id}@petcare`;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  let dtStart, dtEnd;
  if (todo.is_all_day) {
    dtStart = `DTSTART;VALUE=DATE:${todo.due_date.replace(/-/g, '')}`;
    dtEnd = `DTEND;VALUE=DATE:${todo.due_date.replace(/-/g, '')}`;
  } else {
    const startMs = toTimestampMs(todo.due_date, todo.due_time);
    const endMs = startMs + 60 * 60 * 1000; // 默认 1 小时
    const startDt = new Date(startMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endDt = new Date(endMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    dtStart = `DTSTART:${startDt}`;
    dtEnd = `DTEND:${endDt}`;
  }

  const description = todo.description
    ? `DESCRIPTION:${todo.description.replace(/\n/g, '\\n')}`
    : '';
  const petNote = todo.pet_name ? `（${todo.pet_name}）` : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetCare//TodoExport//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    `SUMMARY:${todo.title}${petNote}`,
    description,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${todo.title}${petNote}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * 下载 .ics 文件（Web 降级方案）
 */
function downloadIcs(todo) {
  const content = generateIcsContent(todo);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${todo.title}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 静默同步单个待办到系统日历（创建时自动调用，不弹系统 UI）
 *
 * 权限申请策略：
 *  - 优先申请完整权限（读+写），以便枚举日历列表选出本地日历
 *  - 若用户拒绝读取权限，降级为仅写入，此时无法枚举，由系统选择默认日历
 *
 * @param {import('../api/types').TodoItem} todo
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function autoSyncTodoToCalendar(todo) {
  if (!Capacitor.isNativePlatform()) {
    // Web 平台静默忽略，不下载文件
    return { success: false, message: '' };
  }

  try {
    // 申请完整日历权限（读+写），才能枚举日历列表
    let canWrite = false;
    let canRead = false;

    try {
      const fullPerm = await CapacitorCalendar.requestFullCalendarAccess();
      if (fullPerm.result === 'granted') {
        canWrite = true;
        canRead = true;
      }
    } catch (_) {
      // requestFullCalendarAccess 在某些版本可能不存在，降级处理
    }

    if (!canWrite) {
      // 降级：仅申请写入权限
      const writePerm = await CapacitorCalendar.requestWriteOnlyCalendarAccess();
      canWrite = writePerm.result === 'granted';
    }

    if (!canWrite) {
      return { success: false, message: '未获得日历写入权限' };
    }

    // 有读取权限时，精确选取本地日历；否则交给系统使用默认日历
    const preferredCal = canRead ? await getPreferredCalendar() : null;

    const startDate = toTimestampMs(todo.due_date, todo.due_time || '09:00');
    const endDate = startDate + 60 * 60 * 1000;
    const petNote = todo.pet_name ? `（${todo.pet_name}）` : '';

    const eventParams = {
      title: `${todo.title}${petNote}`,
      description: todo.description || '',
      startDate,
      endDate,
      isAllDay: todo.is_all_day,
    };
    // 仅当找到明确的日历 ID 时才传入，避免传空字符串导致插件报错
    if (preferredCal?.id) {
      eventParams.calendarId = preferredCal.id;
    }

    await CapacitorCalendar.createEvent(eventParams);

    const calName = preferredCal?.title || '系统日历';
    return { success: true, message: `已同步到「${calName}」` };
  } catch (err) {
    console.error('[calendarExport] 自动同步失败', err);
    return { success: false, message: '同步日历失败' };
  }
}

/**
 * 手动导出单个待办到系统日历（弹系统日历 UI 供用户确认）
 * @param {import('../api/types').TodoItem} todo
 * @returns {Promise<{ success: boolean; message: string }>}
 */
export async function exportTodoToCalendar(todo) {
  if (!Capacitor.isNativePlatform()) {
    downloadIcs(todo);
    return { success: true, message: '已下载 .ics 文件，请用日历 App 打开导入' };
  }

  try {
    const permResult = await CapacitorCalendar.requestWriteOnlyCalendarAccess();
    if (permResult.result !== 'granted') {
      return { success: false, message: '未获得日历写入权限' };
    }

    const startDate = toTimestampMs(todo.due_date, todo.due_time || '09:00');
    const endDate = startDate + 60 * 60 * 1000;
    const petNote = todo.pet_name ? `（${todo.pet_name}）` : '';

    // 打开系统日历界面，由用户确认（可在此界面选择目标日历）
    await CapacitorCalendar.createEventWithPrompt({
      title: `${todo.title}${petNote}`,
      description: todo.description || '',
      startDate,
      endDate,
      isAllDay: todo.is_all_day,
    });

    return { success: true, message: '已添加到系统日历' };
  } catch (err) {
    console.error('[calendarExport] 原生日历写入失败，降级到 .ics', err);
    downloadIcs(todo);
    return { success: true, message: '已下载 .ics 文件，请用日历 App 打开导入' };
  }
}

/**
 * 批量导出一组待办到系统日历（仅 Web 降级，生成合并 .ics）
 * @param {import('../api/types').TodoItem[]} todos
 */
export function exportTodosAsIcs(todos) {
  if (todos.length === 0) return;

  const events = todos.map((todo) => {
    const uid = `${todo.id}@petcare`;
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const petNote = todo.pet_name ? `（${todo.pet_name}）` : '';

    let dtStart, dtEnd;
    if (todo.is_all_day) {
      dtStart = `DTSTART;VALUE=DATE:${todo.due_date.replace(/-/g, '')}`;
      dtEnd = `DTEND;VALUE=DATE:${todo.due_date.replace(/-/g, '')}`;
    } else {
      const startMs = toTimestampMs(todo.due_date, todo.due_time);
      const endMs = startMs + 60 * 60 * 1000;
      const s = new Date(startMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const e = new Date(endMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      dtStart = `DTSTART:${s}`;
      dtEnd = `DTEND:${e}`;
    }

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      dtStart,
      dtEnd,
      `SUMMARY:${todo.title}${petNote}`,
      todo.description ? `DESCRIPTION:${todo.description.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetCare//TodoExport//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'petcare-todos.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
