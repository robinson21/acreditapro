import prisma from '../config/database';
import { CONFIG } from '../config';
import { AppError } from '../middleware/errorHandler';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiProviderConfig {
  provider: string;
  model: string;
  apiKey: string;
  apiUrl: string;
}

/**
 * Servicio de Inteligencia Artificial.
 * Clasifica documentos, extrae metadatos, valida documentos, genera observaciones
 * y recomendaciones. Soporta múltiples proveedores: NVIDIA NIM, DeepSeek, OpenAI.
 */
export class AiService {
  private config: AiProviderConfig;

  constructor(config?: Partial<AiProviderConfig>) {
    this.config = {
      provider: config?.provider || CONFIG.AI_PROVIDER,
      model: config?.model || CONFIG.AI_MODEL,
      apiKey: config?.apiKey || CONFIG.AI_API_KEY,
      apiUrl: config?.apiUrl || CONFIG.AI_API_URL,
    };
  }

  /**
   * Carga la configuración de IA desde la base de datos para un tenant específico.
   */
  async loadTenantConfig(tenantId: string): Promise<void> {
    const aiConfig = await prisma.aiConfig.findUnique({
      where: { tenantId },
    });

    if (aiConfig && aiConfig.activo) {
      this.config = {
        provider: aiConfig.proveedor,
        model: aiConfig.model,
        apiKey: aiConfig.apiKey || CONFIG.AI_API_KEY,
        apiUrl: aiConfig.apiUrl || CONFIG.AI_API_URL,
      };
    }
  }

  /**
   * Clasifica un documento basado en su texto extraído.
   * Determina el tipo de documento (contrato, certificado, etc.).
   */
  async classifyDocument(text: string): Promise<{ tipo: string; confianza: number }> {
    const prompt = `Analiza el siguiente texto extraído de un documento y clasifícalo en una de estas categorías:
- CONTRATO
- CERTIFICADO_VIGENCIA
- CERTIFICADO_TRIBUTARIO
- CERTIFICADO_MUTUALIDAD
- SEGURO
- REGLAMENTO_INTERNO
- PROCEDIMIENTO
- MATRIZ_IPER
- EXAMEN_PREOCUPACIONAL
- EXAMEN_OCUPACIONAL
- INDUCCION
- CAPACITACION
- ENTREGA_EPP
- LICENCIA_CONDUCIR
- CERTIFICACIONES
- CREDENCIALES
- ANEXO
- OTROS

Responde solo con el nombre de la categoría y un nivel de confianza del 0 al 1 en formato JSON: {"tipo": "CATEGORIA", "confianza": 0.95}

Texto del documento:
${text.slice(0, 3000)}`;

    try {
      const response = await this.callAi(prompt);
      const parsed = JSON.parse(response);
      return {
        tipo: parsed.tipo || 'OTROS',
        confianza: parsed.confianza || 0.5,
      };
    } catch {
      return { tipo: 'OTROS', confianza: 0.5 };
    }
  }

  /**
   * Extrae metadatos de un documento: nombre, RUT, fechas, número de documento, etc.
   */
  async extractMetadata(text: string): Promise<Record<string, string | null>> {
    const prompt = `Extrae los siguientes campos del texto del documento. Responde SOLO con JSON válido:
{
  "nombre": "Nombre completo de la persona",
  "rut": "RUT chileno (formato XX.XXX.XXX-X)",
  "fechaEmision": "Fecha de emisión (YYYY-MM-DD)",
  "fechaVencimiento": "Fecha de vencimiento (YYYY-MM-DD)",
  "numeroDocumento": "Número de identificación del documento",
  "organismoEmisor": "Organismo que emitió el documento"
}

Si un campo no se encuentra, pon null.

Texto:
${text.slice(0, 4000)}`;

    try {
      const response = await this.callAi(prompt);
      return JSON.parse(response);
    } catch {
      return {
        nombre: null,
        rut: null,
        fechaEmision: null,
        fechaVencimiento: null,
        numeroDocumento: null,
        organismoEmisor: null,
      };
    }
  }

  /**
   * Valida un documento: detecta vigencia, legibilidad, autenticidad aparente.
   */
  async validateDocument(text: string): Promise<{
    valido: boolean;
    observaciones: string[];
    score: number;
  }> {
    const prompt = `Evalúa el siguiente documento extraído por OCR. Determina:
1. ¿El documento parece válido y legible?
2. ¿Tiene fecha de vencimiento? ¿Está vigente?
3. ¿Parece auténtico o tiene indicios de alteración?
4. ¿La información es coherente?

Responde en JSON:
{
  "valido": true/false,
  "observaciones": ["obs1", "obs2"],
  "score": 0.95
}

Texto:
${text.slice(0, 3000)}`;

    try {
      const response = await this.callAi(prompt);
      return JSON.parse(response);
    } catch {
      return {
        valido: false,
        observaciones: ['No se pudo validar el documento automáticamente'],
        score: 0,
      };
    }
  }

  /**
   * Genera observaciones automáticas sobre un documento.
   */
  async generateObservations(document: any): Promise<string> {
    const prompt = `Genera observaciones profesionales sobre el siguiente documento para su revisión:

Tipo: ${document.tipoDocumento}
Categoría: ${document.categoria}
Nombre archivo: ${document.nombreArchivo}
Emisor: ${document.organismoEmisor || 'No especificado'}
Número: ${document.numeroDocumento || 'No especificado'}
Fecha emisión: ${document.fechaEmision || 'No especificada'}
Fecha vencimiento: ${document.fechaVencimiento || 'No especificada'}

Proporciona 2-3 observaciones relevantes para el revisor.`;

    try {
      return await this.callAi(prompt);
    } catch {
      return 'Documento pendiente de revisión manual.';
    }
  }

  /**
   * Genera recomendaciones automáticas para la gestión del documento.
   */
  async generateRecommendations(document: any): Promise<string> {
    const prompt = `Basado en el siguiente documento, genera recomendaciones de gestión:

Tipo: ${document.tipoDocumento}
Estado: ${document.estado}
Fecha vencimiento: ${document.fechaVencimiento || 'Sin vencimiento'}

Recomendaciones sobre:
- Próximos pasos
- Si necesita renovación
- Acciones recomendadas`;

    try {
      return await this.callAi(prompt);
    } catch {
      return 'Documento procesado correctamente.';
    }
  }

  /**
   * Chat conversacional con contexto del documento/plataforma.
   */
  async chat(query: string, context?: string): Promise<string> {
    const systemPrompt = `Eres un asistente experto en acreditación documental y compliance normativo.
Ayudas a los usuarios a entender el estado de sus documentos, requisitos de cumplimiento,
y guías sobre documentación necesaria para contratistas y trabajadores.

Contexto actual: ${context || 'Sin contexto específico'}

Responde de manera clara, profesional y en español.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    try {
      return await this.callAi(messages);
    } catch (error) {
      throw new AppError('Error al procesar la consulta con IA', 503, 'AI_SERVICE_ERROR');
    }
  }

  /**
   * Realiza la llamada HTTP al proveedor de IA configurado.
   * Soporta OpenAI, DeepSeek y NVIDIA NIM.
   */
  private async callAi(prompt: string | ChatMessage[]): Promise<string> {
    const { provider, model, apiKey, apiUrl } = this.config;

    const messages: ChatMessage[] = typeof prompt === 'string'
      ? [{ role: 'user', content: prompt }]
      : prompt;

    let url: string;
    let body: any;

    switch (provider) {
      case 'NVIDIA_NIM':
        url = `${apiUrl || 'https://integrate.api.nvidia.com'}/v1/chat/completions`;
        body = {
          model: model || 'meta/llama-3.1-8b-instruct',
          messages,
          max_tokens: 1024,
          temperature: 0.1,
        };
        break;

      case 'DEEPSEEK':
        url = `${apiUrl || 'https://api.deepseek.com'}/v1/chat/completions`;
        body = {
          model: model || 'deepseek-chat',
          messages,
          max_tokens: 1024,
          temperature: 0.1,
        };
        break;

      case 'OPENAI':
      default:
        url = `${apiUrl || 'https://api.openai.com'}/v1/chat/completions`;
        body = {
          model: model || 'gpt-4o-mini',
          messages,
          max_tokens: 1024,
          temperature: 0.1,
        };
        break;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}

// Singleton para uso en toda la aplicación
export const aiService = new AiService();
