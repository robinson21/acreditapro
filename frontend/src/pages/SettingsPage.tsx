import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Settings,
  Brain,
  Bell,
  Users,
  Save,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type TabKey = 'general' | 'ia' | 'alerts' | 'users';

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { key: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { key: 'ia', label: 'IA', icon: <Brain className="w-4 h-4" /> },
  { key: 'alerts', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
  { key: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
];

// Datos demo de usuarios
const demoUsers = [
  { id: '1', nombre: 'Admin', apellido: 'Sistema', email: 'admin@acreditapro.cl', rol: 'SUPER_ADMIN', activo: true },
  { id: '2', nombre: 'María', apellido: 'González', email: 'maria@acreditapro.cl', rol: 'ADMIN', activo: true },
  { id: '3', nombre: 'Carlos', apellido: 'Muñoz', email: 'carlos@empresa.cl', rol: 'MANAGER', activo: true },
  { id: '4', nombre: 'Ana', apellido: 'López', email: 'ana@empresa.cl', rol: 'VIEWER', activo: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // General
  const [generalData, setGeneralData] = useState({
    nombreTenant: 'AcreditaPro Demo',
    rutEmpresa: '76.123.456-7',
    direccion: 'Av. Providencia 1234, Santiago',
    emailContacto: 'contacto@acreditapro.cl',
    telefonoContacto: '+56 2 2345 6789',
  });

  // IA
  const [iaData, setIaData] = useState({
    proveedor: 'openai',
    modelo: 'gpt-4o',
    apiKey: 'sk-••••••••••••••••••••••••••',
    tempDefault: 0.3,
    maxTokens: 4096,
  });

  // Alertas
  const [alertData, setAlertData] = useState({
    diasAdvertencia: [90, 60, 30, 15, 7],
    canales: {
      email: true,
      sistema: true,
      webhook: false,
    },
    alertarVencidos: true,
    alertarRechazados: true,
    alertarIncumplimiento: true,
  });

  const handleSaveGeneral = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success('Configuración general guardada');
    setSaving(false);
  };

  const handleSaveIA = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success('Configuración de IA guardada');
    setSaving(false);
  };

  const handleSaveAlerts = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success('Configuración de alertas guardada');
    setSaving(false);
  };

  const toggleDiaAlerta = (dia: number) => {
    setAlertData((prev) => ({
      ...prev,
      diasAdvertencia: prev.diasAdvertencia.includes(dia)
        ? prev.diasAdvertencia.filter((d) => d !== dia)
        : [...prev.diasAdvertencia, dia].sort((a, b) => b - a),
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Configuración</h2>
        <p className="text-sm text-slate-500 mt-1">
          Administra la configuración de tu plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-6">
        {/* General */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-white">Información del Tenant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Tenant *</label>
                <input
                  type="text"
                  value={generalData.nombreTenant}
                  onChange={(e) => setGeneralData({ ...generalData, nombreTenant: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RUT Empresa</label>
                <input
                  type="text"
                  value={generalData.rutEmpresa}
                  onChange={(e) => setGeneralData({ ...generalData, rutEmpresa: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={generalData.direccion}
                  onChange={(e) => setGeneralData({ ...generalData, direccion: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  value={generalData.emailContacto}
                  onChange={(e) => setGeneralData({ ...generalData, emailContacto: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={generalData.telefonoContacto}
                  onChange={(e) => setGeneralData({ ...generalData, telefonoContacto: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        )}

        {/* IA */}
        {activeTab === 'ia' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-white">Configuración de Inteligencia Artificial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Proveedor</label>
                <select
                  value={iaData.proveedor}
                  onChange={(e) => setIaData({ ...iaData, proveedor: e.target.value })}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="local">Local (Ollama)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
                <select
                  value={iaData.modelo}
                  onChange={(e) => setIaData({ ...iaData, modelo: e.target.value })}
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={iaData.apiKey}
                    onChange={(e) => setIaData({ ...iaData, apiKey: e.target.value })}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">La API Key se almacena de forma segura en el servidor.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Temperatura (default)</label>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={iaData.tempDefault}
                  onChange={(e) => setIaData({ ...iaData, tempDefault: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Máx. Tokens</label>
                <input
                  type="number"
                  min={256}
                  max={128000}
                  step={256}
                  value={iaData.maxTokens}
                  onChange={(e) => setIaData({ ...iaData, maxTokens: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <button
              onClick={handleSaveIA}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Configuración IA
            </button>
          </div>
        )}

        {/* Alertas */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-white">Configuración de Alertas</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Días de Advertencia
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[90, 60, 30, 15, 7, 3, 1].map((dia) => (
                  <button
                    key={dia}
                    onClick={() => toggleDiaAlerta(dia)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                      alertData.diasAdvertencia.includes(dia)
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {dia} días
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Canales de Notificación</label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.canales.email}
                  onChange={(e) => setAlertData({ ...alertData, canales: { ...alertData.canales, email: e.target.checked } })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">Correo Electrónico</p>
                  <p className="text-xs text-slate-500">Enviar alertas por email</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.canales.sistema}
                  onChange={(e) => setAlertData({ ...alertData, canales: { ...alertData.canales, sistema: e.target.checked } })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">Notificaciones en Sistema</p>
                  <p className="text-xs text-slate-500">Mostrar alertas en el panel</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.canales.webhook}
                  onChange={(e) => setAlertData({ ...alertData, canales: { ...alertData.canales, webhook: e.target.checked } })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">Webhook</p>
                  <p className="text-xs text-slate-500">Enviar a URL externa via POST</p>
                </div>
              </label>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipos de Alerta</label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.alertarVencidos}
                  onChange={(e) => setAlertData({ ...alertData, alertarVencidos: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <span className="text-sm text-slate-200">Documentos vencidos o por vencer</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.alertarRechazados}
                  onChange={(e) => setAlertData({ ...alertData, alertarRechazados: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <span className="text-sm text-slate-200">Documentos rechazados</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertData.alertarIncumplimiento}
                  onChange={(e) => setAlertData({ ...alertData, alertarIncumplimiento: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                />
                <span className="text-sm text-slate-200">Incumplimiento de reglas</span>
              </label>
            </div>
            <button
              onClick={handleSaveAlerts}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Configuración de Alertas
            </button>
          </div>
        )}

        {/* Usuarios */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Usuarios del Sistema</h3>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
                <Users className="w-4 h-4" />
                Invitar Usuario
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-3">Usuario</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-3">Email</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-3">Rol</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-3">Estado</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {demoUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-200">
                            {user.nombre} {user.apellido}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-400">{user.email}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.rol === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : user.rol === 'ADMIN'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : user.rol === 'MANAGER'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {user.rol === 'SUPER_ADMIN' ? 'Super Admin' : user.rol === 'ADMIN' ? 'Admin' : user.rol === 'MANAGER' ? 'Gestor' : 'Visor'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.activo
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.activo ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
