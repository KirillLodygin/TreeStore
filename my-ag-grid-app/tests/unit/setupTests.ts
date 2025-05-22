import { beforeAll } from 'vitest'

beforeAll(async () => {
  const { vi } = await import('vitest')

  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: false,
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })
  } else {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }))
    )
  }

  window.requestAnimationFrame = vi.fn((cb) => {
    cb()
    return 1
  })

  class MockResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }

  vi.stubGlobal('ResizeObserver', MockResizeObserver)

  if (!document.body) {
    document.body = document.createElement('div')
  }
})