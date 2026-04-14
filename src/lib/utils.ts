import { format, intervalToDuration, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WorkHoursConfig } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timestamp: number) {
  return format(timestamp, 'HH:mm');
}

export function isHalfHourMinute(minute: number): boolean {
  return minute === 0 || minute === 30;
}

export function isValidHalfHourTimeString(time: string): boolean {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return false;
  return isHalfHourMinute(Number(match[2]));
}

export function isValidHalfHourTimestamp(timestamp: number): boolean {
  return isHalfHourMinute(new Date(timestamp).getMinutes());
}

export function formatDate(dateString: string) {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
}

export function formatDurationMs(ms: number) {
  if (ms < 60000) return '< 1 min';
  const duration = intervalToDuration({ start: 0, end: ms });
  
  const parts = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  
  return parts.join(' ');
}

export function formatDurationDecimal(ms: number) {
  return (ms / (1000 * 60 * 60)).toFixed(2);
}

export function getTargetHoursForDate(dateStr: string, config: WorkHoursConfig): number {
  const date = parseISO(dateStr);
  const day = getDay(date); // 0 = Sunday, 1 = Monday
  switch (day) {
    case 0: return config.sunday;
    case 1: return config.monday;
    case 2: return config.tuesday;
    case 3: return config.wednesday;
    case 4: return config.thursday;
    case 5: return config.friday;
    case 6: return config.saturday;
    default: return 0;
  }
}

export function getDayName(dateStr: string): string {
  const date = parseISO(dateStr);
  const day = getDay(date);
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return names[day];
}
