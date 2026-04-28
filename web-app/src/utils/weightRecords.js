function safeTime(value, fallback = 0) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : fallback;
}

function compareCreatedAtAsc(a, b) {
    const createdDiff = safeTime(a?.created_at) - safeTime(b?.created_at);
    if (createdDiff !== 0) {
        return createdDiff;
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''));
}

export function compareWeightRecordsAsc(a, b) {
    const dateDiff = safeTime(`${a?.recorded_date || ''}T00:00:00`) - safeTime(`${b?.recorded_date || ''}T00:00:00`);
    if (dateDiff !== 0) {
        return dateDiff;
    }
    return compareCreatedAtAsc(a, b);
}

export function compareWeightRecordsDesc(a, b) {
    return compareWeightRecordsAsc(b, a);
}
