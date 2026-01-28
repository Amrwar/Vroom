import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Africa/Cairo';

export function getCairoDate(date: Date = new Date()): Date {
  return toZonedTime(date, TIMEZONE);
}

export function formatCairoDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const cairoDate = toZonedTime(dateObj, TIMEZONE);
  return format(cairoDate, formatStr);
}

export function formatCairoDateTime(date: Date | string): string {
  return formatCairoDate(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatCairoTime(date: Date | string): string {
  return formatCairoDate(date, 'HH:mm');
}

export function getCairoDayStart(date: Date = new Date()): Date {
  const cairoDate = toZonedTime(date, TIMEZONE);
  const dayStart = startOfDay(cairoDate);
  return fromZonedTime(dayStart, TIMEZONE);
}

export function getCairoDayEnd(date: Date = new Date()): Date {
  const cairoDate = toZonedTime(date, TIMEZONE);
  const dayEnd = endOfDay(cairoDate);
  return fromZonedTime(dayEnd, TIMEZONE);
}

export function getCairoMonthStart(date: Date = new Date()): Date {
  const cairoDate = toZonedTime(date, TIMEZONE);
  const monthStart = startOfMonth(cairoDate);
  return fromZonedTime(monthStart, TIMEZONE);
}

export function getCairoMonthEnd(date: Date = new Date()): Date {
  const cairoDate = toZonedTime(date, TIMEZONE);
  const monthEnd = endOfMonth(cairoDate);
  return fromZonedTime(monthEnd, TIMEZONE);
}

export function parseDateString(dateStr: string): Date {
  return parseISO(dateStr);
}

export function getDateRangeForDay(dateStr: string): { start: Date; end: Date } {
  const date = parseISO(dateStr);
  return {
    start: getCairoDayStart(date),
    end: getCairoDayEnd(date),
  };
}

export function getDateRangeForMonth(monthStr: string): { start: Date; end: Date } {
  const date = parseISO(`${monthStr}-01`);
  return {
    start: getCairoMonthStart(date),
    end: getCairoMonthEnd(date),
  };
}

export function calculateElapsedMinutes(entryTime: Date, finishTime: Date): number {
  const diffMs = finishTime.getTime() - entryTime.getTime();
  return Math.round(diffMs / (1000 * 60));
}
