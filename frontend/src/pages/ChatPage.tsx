import { useState, useRef, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  Lightbulb,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  '¿Qué trabajadores tienen documentos vencidos?',
  '¿Qué empresas están incumpliendo?',
  'Genera informe de cumplimiento',
  '¿Cuántos documentos vencen este mes?',
];

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      '¡Hola! Soy el asistente IA de AcreditaPro. Puedo ayudarte a consultar información sobre empresas, trabajadores, documentos y más. ¿En qué puedo ayudarte hoy?',
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular respuesta de IA
    setTimeout(() => {
      const responses: Record<string, string> = {
        '¿Qué trabajadores tienen documentos vencidos?':
          'Actualmente hay **12 trabajadores** con documentos vencidos:\n\n• **Juan Pérez** — Cédula de Identidad (vencido hace 15 días)\n• **María González** — Certificado de Antecedentes (vencido hace 3 días)\n• **Carlos Muñoz** — Certificado de Salud (vencido hace 30 días)\n• **Ana López** — Licencia de Conducir (vence mañana)\n• Y 8 más...\n\n¿Deseas que te muestre la lista completa o generar un informe PDF?',
        '¿Qué empresas están incumpliendo?':
          'Hay **3 empresas** con incumplimientos detectados:\n\n🔴 **Constructora del Sur S.A.** — 45% de cumplimiento\n• 8 trabajadores sin acreditación\n• 12 documentos vencidos\n\n🟡 **Servicios Industriales Ltda.** — 62% de cumplimiento\n• 3 certificados de salud por vencer\n\n🔴 **Minera Servicios EIRL** — 38% de cumplimiento\n• Sin contratos actualizados\n• 15 documentos pendientes\n\n¿Quieres enviar alertas a estas empresas?',
        'Genera informe de cumplimiento':
          '✅ **Informe generado exitosamente.**\n\n📊 **Resumen Ejecutivo:**\n• Cumplimiento Global: **78%**\n• Empresas activas: **24**\n• Trabajadores acreditados: **1,245**\n• Documentos vigentes: **3,890**\n• Documentos vencidos: **156**\n• Alertas activas: **23**\n\nPuedes descargar el informe completo desde la sección de **Informes** en PDF o Excel.',
        '¿Cuántos documentos vencen este mes?':
          '📅 **Documentos por vencer este mes:**\n\n• **45 documentos** vencen en los próximos 30 días\n• **12 documentos** vencen esta semana\n• **3 documentos** vencen hoy\n\n🔴 **Urgente:**\n• Certificado de Antecedentes — María González (vence hoy)\n• Cédula de Identidad — Empresa Constructora del Sur (vence hoy)\n• Contrato SERV-2024-089 (vence mañana)\n\n¿Quieres que envíe recordatorios automáticos?',
      };

      const response =
        responses[userMessage.content] ||
        `He procesado tu consulta: "${userMessage.content}"\n\nEstos son los resultados obtenidos del análisis. ¿Necesitas información más detallada sobre algún aspecto en particular?`;

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Asistente IA</h2>
          <p className="text-xs text-slate-500">Consultas inteligentes sobre acreditación</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Conectado</span>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-slate-400">Analizando...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Preguntas sugeridas (solo al inicio) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-500">Preguntas sugeridas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 hover:border-slate-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-800 p-4">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta aquí..."
                disabled={isLoading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all disabled:opacity-40 shadow-lg shadow-purple-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
