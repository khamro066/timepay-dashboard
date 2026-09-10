import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Two-way binds a set of named filter values to the URL query string, so
 * that browser back/forward and reload restore exactly the filter, search
 * and sort state the user had. Writes always REPLACE the history entry
 * (never push), so changing a filter — or every keystroke of a debounced
 * search — doesn't flood the back stack.
 *
 * `spec` must be a stable (module-level) object: `{ key: { default, decode?,
 * encode?, isDefault? } }`. A value equal to its default is dropped from
 * the URL to keep links tidy; `decode`/`encode` translate between the URL
 * string and the value type (e.g. booleans).
 *
 * Returns `[values, set]` where `set('key', value)` or `set({ k: v, ... })`
 * updates one or several keys at once.
 */
export function useFilterParams(spec) {
  const [searchParams, setSearchParams] = useSearchParams()

  const values = {}
  for (const key in spec) {
    const raw = searchParams.get(key)
    values[key] = raw === null ? spec[key].default : spec[key].decode ? spec[key].decode(raw) : raw
  }

  const set = useCallback(
    (keyOrPatch, maybeValue) => {
      const patch = typeof keyOrPatch === 'string' ? { [keyOrPatch]: maybeValue } : keyOrPatch
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const key in patch) {
            const cfg = spec[key]
            if (!cfg) continue
            const value = patch[key]
            const atDefault = cfg.isDefault ? cfg.isDefault(value) : value === cfg.default
            if (value == null || value === '' || atDefault) {
              next.delete(key)
            } else {
              next.set(key, cfg.encode ? cfg.encode(value) : String(value))
            }
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, spec],
  )

  return [values, set]
}

// Shared field configs so every page encodes the same filter the same way.
export const boolParam = {
  default: false,
  decode: (raw) => raw === '1',
  encode: () => '1',
  isDefault: (v) => !v,
}

export const strParam = { default: null }

export function enumParam(defaultValue) {
  return { default: defaultValue, isDefault: (v) => v === defaultValue }
}
