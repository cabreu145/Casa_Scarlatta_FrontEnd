const LOG_LEVELS = { INFO: 'info', WARN: 'warn', ERROR: 'error' }

const logHistory = []
const MAX_LOGS = 100

function buildEntry(level, message, context = {}) {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }
}

// ← BACKEND: send to backend when available
// async function sendToBackend(entry) {
//   await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
// }

function record(level, message, context) {
  const entry = buildEntry(level, message, context)
  if (logHistory.length >= MAX_LOGS) logHistory.shift()
  logHistory.push(entry)

  if (import.meta.env.DEV) {
    const fn = level === LOG_LEVELS.ERROR ? 'error' : level === LOG_LEVELS.WARN ? 'warn' : 'log'
    console[fn](`[${level.toUpperCase()}]`, message, context)
  }
}

export const logger = {
  info:       (message, context) => record(LOG_LEVELS.INFO,  message, context),
  warn:       (message, context) => record(LOG_LEVELS.WARN,  message, context),
  error:      (message, context) => record(LOG_LEVELS.ERROR, message, context),
  getHistory: () => [...logHistory],
}
