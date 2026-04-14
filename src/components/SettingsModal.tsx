import { useState, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { WorkHoursConfig } from '../types';

interface SettingsModalProps {
  config: WorkHoursConfig;
  onSave: (config: WorkHoursConfig) => void;
  onClose: () => void;
}

export function SettingsModal({ config, onSave, onClose }: SettingsModalProps) {
  const [formData, setFormData] = useState<WorkHoursConfig>(config);

  const handleChange = (day: keyof WorkHoursConfig, value: string) => {
    if (day === 'mode') {
      setFormData(prev => ({ ...prev, mode: value as any }));
    } else {
      const num = parseFloat(value);
      setFormData(prev => ({ ...prev, [day]: isNaN(num) ? 0 : num }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Configuración de Jornada</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Horas objetivo por día</h3>
            <div className="grid grid-cols-2 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayNames: Record<string, string> = {
                  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                };
                return (
                  <div key={day}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{dayNames[day]}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData[day as keyof WorkHoursConfig]}
                      onChange={(e) => handleChange(day as keyof WorkHoursConfig, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                );
              })}
            </div>

            <h3 className="text-sm font-medium text-gray-900 border-b pb-2 mt-6">Modo de control</h3>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Comportamiento al superar horas</label>
              <select
                value={formData.mode}
                onChange={(e) => handleChange('mode', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inform">Solo informar (permite guardar)</option>
                <option value="warn">Avisar (muestra advertencia pero permite guardar)</option>
                <option value="block">Bloquear exceso (impide guardar)</option>
              </select>
            </div>
          </form>
        </div>

        <div className="p-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="settings-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
