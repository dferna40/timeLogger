import { useState, useEffect } from 'react';
import { Task, WorkHoursConfig } from '../types';
import { formatDurationDecimal, formatDurationMs, getTargetHoursForDate, getDayName, formatDate } from '../lib/utils';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface SummaryProps {
  tasks: Task[];
  dateStr: string;
  config?: WorkHoursConfig;
  activeTaskId?: string | null;
}

export function Summary({ tasks, dateStr, config, activeTaskId }: SummaryProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeTaskId) return;
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, [activeTaskId]);

  const completedTasks = tasks.filter(t => t.duration !== undefined);

  // Calculate total, billable and non-billable durations including active task
  const { totalMs, billableMs, nonBillableMs } = tasks.reduce((acc, task) => {
    const taskMs = task.duration !== undefined
      ? task.duration
      : task.id === activeTaskId && task.startTime
        ? (now - task.startTime)
        : 0;

    if (taskMs === 0) return acc;

    acc.totalMs += taskMs;
    if (task.billable) {
      acc.billableMs += taskMs;
    } else {
      acc.nonBillableMs += taskMs;
    }
    return acc;
  }, { totalMs: 0, billableMs: 0, nonBillableMs: 0 });

  const targetHours = config ? getTargetHoursForDate(dateStr, config) : 0;
  const targetMs = targetHours * 60 * 60 * 1000;
  
  const isOver = totalMs > targetMs && targetMs > 0;
  const isExact = totalMs === targetMs && targetMs > 0;
  const remainingMs = Math.max(0, targetMs - totalMs);
  const excessMs = Math.max(0, totalMs - targetMs);

  const byProject = completedTasks.reduce((acc, t) => {
    acc[t.project] = (acc[t.project] || 0) + (t.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  const byType = completedTasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + (t.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Totals */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Día</h3>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-900">{getDayName(dateStr)}</div>
            <div className="text-[10px] text-gray-500">{formatDate(dateStr)}</div>
          </div>
        </div>
        
        <div className="text-4xl font-light mb-4">{formatDurationDecimal(totalMs)}<span className="text-xl text-gray-400 ml-1">h</span></div>
        
        {config && (targetMs > 0 || totalMs > 0) && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600">Objetivo:</span>
              <span className="font-medium text-gray-900">{targetHours}h</span>
            </div>
            {isOver || (targetMs === 0 && totalMs > 0) ? (
              <div className="flex justify-between items-center text-sm text-red-600">
                <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Exceso:</span>
                <span className="font-medium">+{formatDurationMs(excessMs)}</span>
              </div>
            ) : isExact ? (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completado</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-sm text-blue-600">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Restante:</span>
                <span className="font-medium">{formatDurationMs(remainingMs)}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Imputable</span>
            <span className="font-medium text-green-700">{formatDurationDecimal(billableMs)}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">No Imputable</span>
            <span className="font-medium text-gray-500">{formatDurationDecimal(nonBillableMs)}h</span>
          </div>
        </div>
      </div>

      {/* By Project */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Por Proyecto</h3>
        <div className="space-y-3">
          {Object.entries(byProject).sort((a, b) => b[1] - a[1]).map(([project, ms]) => (
            <div key={project} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 truncate pr-2">{project}</span>
              <span className="font-mono font-medium">{formatDurationDecimal(ms)}h</span>
            </div>
          ))}
          {Object.keys(byProject).length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
        </div>
      </div>

      {/* By Type */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Por Tipo</h3>
        <div className="space-y-3">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, ms]) => (
            <div key={type} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 truncate pr-2">{type}</span>
              <span className="font-mono font-medium">{formatDurationDecimal(ms)}h</span>
            </div>
          ))}
          {Object.keys(byType).length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
        </div>
      </div>
    </div>
  );
}
