import { Debouncer, factory, $P, each } from "js-tools"

const setStats = parent => {
  const s = {
    owners: new Set(),
    inOwners: new Set(),
    listeners: new Set(),
    computableQueue: [],
    computables: [],
    isComputable: false,
    compute: Debouncer(f => f(), 0),
  }
  s.children = factory($P(setStats, s))
  parent && s.owners.add(parent)
  return s
}
const allowedConstructors = new Set(["Object", "Array"])

export function ReactiveObject(
  store = {},
  state,
  computeQueue = ComputeQueue(),
  stats = setStats()
) {
  const proxy = new Proxy(store, {
    set: (o, prop, val) => {
      const s = stats.children[prop]
      if (typeof val === "function") {
        s.computableQueue.push(val)
        s.isComputable = true
      } else {
        if (val?.__isRO) {
          val.__owners.add(stats)
          stats.inOwners.add(val.__owners)
          o[prop] = val
        } else if (allowedConstructors.has(val?.constructor.name)) {
          o[prop] = ReactiveObject(val, state, computeQueue, s)
        } else {
          o[prop] = val
        }
        notify(s)
      }
      return true
    },
    get: (o, prop) => {
      switch (prop) {
        case "constructor":
          return o[prop]
        case "__compute":
          return computeQueue.exec()
        case "__observe":
          return (il, c) => observeProxy(proxy, stats, il, c)
        case "__isRO":
          return true
        case "__owners":
          return stats.owners
        default:
          const s = stats.children[prop]
          if (s.isComputable) {
            if (s.computableQueue.length) {
              const ar = s.computableQueue
              s.computableQueue = []
              ar.forEach(fn => compute(prop, fn))
            }
            _state.__compute
            computeQueue.exec()
          }
          return o[prop]
      }
    },
    deleteProperty: (o, prop) => {
      cleanupStats(stats.children[prop])
      delete o[prop]
      return true
    },
  })
  Object.assign(proxy, store)
  const _state = state || proxy
  function compute(prop, fn) {
    const s = stats.children[prop]
    const computable = () => {
      computeQueue.add(s.compute)
      s.compute.debounce(() => {
        computeQueue.delete(s.compute)
        proxy[prop] = fn(_state)
      })
    }
    const inListeners = new Set()
    s.computables.push({ inListeners, computable })
    proxy[prop] = fn(_state.__observe(inListeners, computable))
  }
  return proxy
}
export const RO = ReactiveObject
function observeProxy(proxy, stats, inListeners, computable) {
  return new Proxy(proxy, {
    get(o, prop) {
      const s = stats.children[prop]
      addListener(s, inListeners, computable)
      return o[prop]
    },
  })
}

function ComputeQueue() {
  let queue = new Set()
  return {
    add: debouncer => queue.add(debouncer),
    delete: debouncer => queue.delete(debouncer),
    exec: () => {
      while (queue.size) {
        const set = queue
        queue = new Set()
        set.forEach(debouncer => debouncer.exec())
      }
    },
  }
}
function addListener(stats, inListeners, computable) {
  stats.listeners.add(computable)
  inListeners.add(stats.listeners)
}
function notify(stats) {
  stats.listeners.forEach(f => f())
  stats.owners.forEach(notify)
}
function cleanupStats(stats) {
  stats.computableQueue.length = 0
  stats.computables.forEach(({ inListeners, computable }) => {
    inListeners.forEach(listeners => listeners.delete(computable))
  })
  each(stats.children, cleanupStats)
}
