"use client";

import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDateString(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

function formatDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(value) {
  const date = parseDateString(value);
  if (!date) return "";
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function DatePicker({
  value,
  onChange,
  onValueChange,
  min,
  max,
  disabled,
  className,
  placeholder = "选择日期",
  "aria-label": ariaLabel = "选择日期",
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseDateString(value), [value]);
  const minDate = useMemo(() => parseDateString(min), [min]);
  const maxDate = useMemo(() => parseDateString(max), [max]);

  const disabledMatcher = useMemo(() => {
    const matchers = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    return matchers.length ? matchers : undefined;
  }, [maxDate, minDate]);

  const handleSelect = (date) => {
    if (!date) return;
    const nextValue = formatDateString(date);
    onValueChange?.(nextValue);
    onChange?.({ target: { value: nextValue } });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          "relative flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-left text-sm text-text-main-light shadow-xs/5 transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-text-main-dark",
          !value && "text-text-muted-light dark:text-text-muted-dark",
          className
        )}
        disabled={disabled}
        type="button"
      >
        <span>{value ? formatDisplayDate(value) : placeholder}</span>
        <CalendarIcon className="size-4 shrink-0 text-text-muted-light dark:text-text-muted-dark" />
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-auto">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledMatcher}
        />
      </PopoverPopup>
    </Popover>
  );
}

export { DatePicker };
