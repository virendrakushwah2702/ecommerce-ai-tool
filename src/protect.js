const isProd = import.meta.env.PROD

if (isProd) {
  document.addEventListener('contextmenu', (e) => e.preventDefault())
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault()
      return false
    }
  })
  const noop = () => {}
  window.console = {
    ...window.console,
    log: noop, warn: noop, error: noop,
    info: noop, debug: noop, table: noop,
  }
}

export const logger = {
  log: isProd ? () => {} : (...args) => console.log('[imaginedai]', ...args),
  warn: isProd ? () => {} : (...args) => console.warn('[imaginedai]', ...args),
  error: isProd ? () => {} : (...args) => console.error('[imaginedai]', ...args),
}
