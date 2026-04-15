// @ts-nocheck
/**
 * teech-platform â Structured Logger
 *
 * Wraps console methods with structured output so logs are:
 * - Prefixed with platform name and severity
 * - Machine-parseable in Vercel log drain
 * - Silent in test environments
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('cron', 'WWC check completed', { tutorId, state })
 *   logger.warn('stripe', 'Unhandled webhook event', { type })
 *   logger.error('assessment', 'Session submission failed', { sessionId, error })
 *   logger.critical('wwc', 'Tutor suspended â WWC expired', { tutorId })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
type LogContext = Record<string, unknown>

function emit(level: LogLevel, domain: string, message: string, context?: LogContext) {
  if (process.env['NODE_ENV'] === 'test') return

  const entry = {
    ts:      new Date().toISOString(),
    level,
    domain,
    message,
    ...context,
  }

  const line = JSON.stringify(entry)

  switch (level) {
    case 'debug':
      console.debug(line)
      break
    case 'info':
      console.info(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'error':
    case 'critical':
      console.error(line)
      break
  }
}

export const logger = {
  debug:    (domain: string, message: string, ctx?: LogContext) => emit('debug',    domain, message, ctx),
  info:     (domain: string, message: string, ctx?: LogContext) => emit('info',     domain, message, ctx),
  warn:     (domain: string, message: string, ctx?: LogContext) => emit('warn',     domain, message, ctx),
  error:    (domain: string, message: string, ctx?: LogContext) => emit('error',    domain, message, ctx),
  critical: (domain: string, message: string, ctx?: LogContext) => emit('critical', domain, message, ctx),
} as const
