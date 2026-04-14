import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Task } from '../types';
import { formatTime, formatDurationDecimal, formatDurationMs } from '../lib/utils';

interface ExportProps {
  tasks: Task[];
  selectedDate: string;
}

export function Export({ tasks, selectedDate }: ExportProps) {
  const [copied, setCopied] = useState(false);
  const completedTasks = tasks.filter(t => t.duration !== undefined);

  const generateCSV = () => {
    const separator = ';';
    const headers = ['Fecha', 'Inicio', 'Fin', 'Duración', 'Proyecto', 'Tipo', 'Descripción', 'Imputable', 'Observaciones'];
    const escapeCSVField = (value: string) => {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = completedTasks.map(t => [
      t.date,
      formatTime(t.startTime),
      t.endTime ? formatTime(t.endTime) : '',
      formatDurationMs(t.duration || 0),
      t.project,
      t.type,
      t.description,
      t.billable ? 'Sí' : 'No',
      t.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => escapeCSVField(field)).join(separator))
      .join('\r\n');

    const bom = '\uFEFF';
    const blobWithBom = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blobWithBom);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registro_horas_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const text = completedTasks.map(t => 
      `${formatTime(t.startTime)} - ${t.endTime ? formatTime(t.endTime) : '...'} | ${formatDurationDecimal(t.duration || 0)}h | ${t.project} | ${t.description}`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Exportar Datos</h3>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={generateCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar CSV
        </button>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? '¡Copiado!' : 'Copiar Resumen'}
        </button>
      </div>
    </div>
  );
}
