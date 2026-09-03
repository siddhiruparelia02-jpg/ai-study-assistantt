import { GoogleGenAI, Type } from '@google/genai';

/**
 * Centralized Gemini AI Configuration and Security Layer
 * Follows Google GenAI modern TypeScript SDK standards.
 */

// Supported production models in order of preferred fallback
export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

export type GeminiModelName = (typeof GEMINI_MODELS)[number];

// Lazy-initialized Gemini Client instance
let genAIClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

/**
 * Prompt Injection & Jailbreak Defense
 * Cleans, sanitizes, and escapes user inputs before interpolating into prompt templates.
 */
export function sanitizeInput(input: string, maxLength: number = 4000): string {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim().slice(0, maxLength);

  // Neutralize common prompt injection / instruction override patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)/gi,
    /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)/gi,
    /you\s+are\s+now\s+an\s+unrestricted/gi,
    /reveal\s+(your\s+)?system\s+prompt/gi,
    /repeat\s+(the\s+)?system\s+prompt/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }

  return cleaned;
}

/**
 * In-Memory Request Cache with TTL
 * Speeds up response times for identical questions/topics and prevents duplicate API costs.
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class AICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries: number = 200;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 1000 * 60 * 30): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICache();

/**
 * AI Internal Telemetry & Quality Metrics
 */
interface TelemetryRecord {
  event: string;
  success: boolean;
  model?: string;
  durationMs: number;
  cached: boolean;
  timestamp: string;
  error?: string;
}

class AITelemetry {
  private records: TelemetryRecord[] = [];
  private readonly maxRecords = 300;

  record(metric: Omit<TelemetryRecord, 'timestamp'>) {
    this.records.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }

  getMetricsSummary() {
    const total = this.records.length;
    if (total === 0) return { total: 0, successRate: 100, avgDurationMs: 0, cacheHitRate: 0 };
    const successes = this.records.filter((r) => r.success).length;
    const cacheHits = this.records.filter((r) => r.cached).length;
    const totalDuration = this.records.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      total,
      successCount: successes,
      failureCount: total - successes,
      successRate: Math.round((successes / total) * 100),
      avgDurationMs: Math.round(totalDuration / total),
      cacheHitRate: Math.round((cacheHits / total) * 100),
      recentErrors: this.records
        .filter((r) => !r.success)
        .slice(-5)
        .map((r) => ({ event: r.event, error: r.error, time: r.timestamp })),
    };
  }
}

export const aiTelemetry = new AITelemetry();

/**
 * Resilient content generation with model rotation and structured error trapping
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    eventName?: string;
  }
) {
  const startTime = Date.now();
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      aiTelemetry.record({
        event: params.eventName || 'generateContent',
        success: true,
        model,
        durationMs: Date.now() - startTime,
        cached: false,
      });

      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini generation with ${model} failed:`, err?.message || err);
      // If error is invalid API key or model unavailable, proceed to next model in rotation
    }
  }

  aiTelemetry.record({
    event: params.eventName || 'generateContent',
    success: false,
    durationMs: Date.now() - startTime,
    cached: false,
    error: lastError?.message || 'All models failed',
  });

  throw lastError || new Error('All configured Gemini models failed to respond.');
}

/**
 * Parse JSON safely from Gemini output with markdown/bracket repair
 */
export function safeParseJson<T>(rawText: string | undefined): T | null {
  if (!rawText || !rawText.trim()) return null;
  const trimmed = rawText.trim();

  // Try direct parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Attempt extracting json block
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        return JSON.parse(codeBlockMatch[1]) as T;
      } catch {
        // Continue to regex match
      }
    }

    // Try finding outer curly braces or brackets
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[0]) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Fallback
      }
    }
  }

  return null;
}
