export const oKeys = Object.keys
export const some = (o, f) => oKeys(o).some(k => f(o[k], k, o))
export const every = (o, f) => oKeys(o).every(k => f(o[k], k, o))
export const each = (o, f) => oKeys(o).forEach(k => f(o[k], k, o))
export const map = (o, f) =>
  reduce(
    o,
    (acc, v, k) => {
      acc[k] = f(v, k, o)
      return acc
    },
    {}
  )

// the differenc with above is that this one won't fire exception for undefined as object and simply pass
// not good practice, but it's useful for some cases
export const forin = (o, f) => {
  for (const i in o) f(o[i], i, o)
}
export const join = (o, sep = ",") =>
  reduce(
    o,
    (acc, v) => {
      acc.push(v)
      return acc
    },
    []
  ).join(sep)

export const sort = (o, f) =>
  oKeys(o)
    .sort((a, b) => f(o[a], o[b]))
    .reduce((acc, k) => {
      acc[k] = o[k]
      return acc
    }, {})

export const filter = (o, f) =>
  reduce(
    o,
    (acc, v, k) => {
      if (f(v, k, o)) acc[k] = v
      return acc
    },
    {}
  )

export const pluck = (o, ...keys) => keys.reduce((acc, k) => acc[k], o)
export const find = (o, f) =>
  pluck(
    o,
    oKeys(o).find(k => f(o[k], k, o))
  )
export const reduce = (o, f, initialValue) => {
  let keys = oKeys(o)
  if (initialValue === undefined) {
    initialValue = o[keys[0]]
    keys = keys.slice(1)
  }
  return keys.reduce((acc, k) => f(acc, o[k], k, o), initialValue)
}
export const isEmptyObject = obj =>
  oKeys(obj).length === 0 || every(obj, v => v === undefined)
export const ownKeys = Reflect.ownKeys
export const eachW = (o, f) => ownKeys(o).forEach(k => f(o[k], k, o))

const $O_prototype = {
  map,
  join,
  filter,
  sort,
  reduce,
  find,
  pluck,
  each,
  every,
  some,
  keys: oKeys,
  fetchKeys,
  expandKeys,
  flattenKeys,
  stringify,
  existProps,
  existBranch,
}
export const $O = o =>
  new Proxy(o, {
    get(target, prop, receiver) {
      return $O_prototype[prop]
        ? (...args) => {
            const ret = $O_prototype[prop](target, ...args)
            return isObject(ret) ? $O(ret) : ret
          }
        : target[prop]
    },
  })

export function expandKeys(o, delimiter = ",", out = {}) {
  Object.keys(o).forEach(key => {
    const value = isObject(o[key]) ? expandKeys(o[key], delimiter) : o[key]
    key
      .toString()
      .split(delimiter)
      .map(k => k.trim())
      .forEach(k => (out[k] = value))
  })
  return out
}
export function fetchKeys(o, keyString, delimiter = ".") {
  return keyString.split(delimiter).reduce((o, k) => o[k], o)
}
export function isPartialEqual(a, b) {
  if (typeof a !== typeof b) return false
  return typeof a === "object"
    ? every(a, (v, key) => isPartialEqual(v, b[key]))
    : a === b
}
export function isShallowEqual(a, b) {
  if (typeof a !== typeof b) return false
  return every(a, (v, k) => v === b[k])
}
export function isDeepEqual(a, b) {
  if (oKeys(a).length !== oKeys(b).length) return false
  return every(a, (v, k) => isPartialEqual(v, b[k]))
}
export function flattenKeys(o, path = "", delimiter = ",", out = {}) {
  Object.keys(o).forEach(key =>
    isObject(o[key])
      ? flattenKeys(o[key], path + key + delimiter, delimiter, out)
      : (out[path + key] = o[key])
  )
  return out
}
export function isObject(o) {
  return o?.constructor.name === "Object"
}
export function existProps(obj, ...props) {
  return props.every(p => obj[p] !== undefined)
}
export function existBranch(obj, ...props) {
  return props.every(p => obj[p] !== undefined && (obj = obj[p]))
}
export function copy(o) {
  return JSON.parse(JSON.stringify(o))
}
export function setProp(o, value, ...props) {
  const lastProp = props.pop()
  o = props.reduce((o, p) => {
    o[p] ??= {}
    return o[p]
  }, o)
  o[lastProp] = value
  return o[lastProp]
}
export function hasASameKey(a, b) {
  return oKeys(a).find(k => b[k] !== undefined)
}
export function errIfSimilarKey(a, b, msg = "") {
  const sameKey = hasASameKey(a, b)
  if (sameKey) err(`${msg} similar key: ${sameKey}`)
}
const _switchTo = (switchs, key, ...p) => {
  const value = switchs[key]
  switch (typeof value) {
    case "function":
      return value(...p)
    case "object":
      return _switchTo(value, value._(...p), ...p)
    case "undefined":
      return switchs.default(...p)
    default:
      return value
  }
}
export const opt = switchs => {
  switchs = expandKeys(switchs)
  return (...p) => _switchTo(switchs, switchs._(...p), ...p)
}
export const $F = opt

const stringifySwitcher = $F({
  _: v => {
    let type = v === null ? "null" : typeof v
    return type === "object" && Array.isArray(v) ? "array" : type
  },
  array: v => `[${v.map(val => stringify(val)).join(",")}]`,
  object: o =>
    `{${$O(o)
      .filter(v => v !== undefined)
      .map((v, k) => `"${k}":${stringify(v)}`)
      .join(",")}}`,
  "number, boolean, function": v => v.toString(),
  string: v => `"${v}"`,
  "null, undefined": () => "null",
})
export function stringify(o, seenObj = new Set()) {
  if (seenObj.has(o)) return "[Circular Object]"
  else if (typeof o === "object") seenObj.add(o)
  return stringifySwitcher(o)
}
export function converToMap(o, m = new Map()) {
  each(o, (v, k) => m.set(k, isObject(v) ? converToMap(v) : v))
  return m
}
export function xm(o, methodName, extension) {
  const method = o[methodName]
  o[methodName] = (...args) => {
    const ret = method.apply(o, args)
    extension(ret)
    return ret
  }
}
