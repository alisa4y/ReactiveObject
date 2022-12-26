export const oKeys = Object.keys
type O = Record<any, any>
type Fn = (...args: any[]) => any
type GetElementType<T extends O> = T extends {
  [key: string]: infer t
}
  ? t
  : never

export const some = <T extends O>(
  o: T,
  f: (v: GetElementType<T>, k: keyof T, o: T) => boolean
) => oKeys(o).some(k => f(o[k], k, o))
export const every = <T extends O>(
  o: T,
  f: (v: GetElementType<T>, k: keyof T, o: T) => boolean
) => oKeys(o).every(k => f(o[k], k, o))

export const each = <T extends O>(
  o: T,
  f: (v: GetElementType<T>, k: keyof T, o: T) => void
) => oKeys(o).forEach(k => f(o[k], k, o))
export const map = <T extends O, Ret>(
  o: T,
  f: (v: GetElementType<T>, k: keyof T, o: T) => Ret
) =>
  reduce(
    o,
    (acc: O, v: GetElementType<T>, k: keyof T) => {
      acc[k] = f(v, k, o)
      return acc
    },
    {}
  ) as { [key in keyof T]: Ret }

export const join = (o: O, sep = ",") =>
  reduce(
    o,
    (acc, v) => {
      acc.push(v)
      return acc
    },
    []
  ).join(sep)

export const sort = <T extends O>(
  o: T,
  f: (a: GetElementType<T>, b: GetElementType<T>) => number
) =>
  oKeys(o)
    .sort((a, b) => f(o[a], o[b]))
    .reduce((acc: O, k) => {
      acc[k] = o[k]
      return acc
    }, {})

export const filter = <T extends O>(
  o: T,
  f: (v: GetElementType<T>, k: keyof T, o: T) => boolean
) =>
  reduce(
    o,
    (acc, v, k) => {
      if (f(v, k, o)) acc[k] = v
      return acc
    },
    {} as Partial<T>
  )

export const find = <T extends O>(
  o: T,
  f: (v: GetElementType<T>, k?: keyof T, o?: T) => boolean
) => o[oKeys(o).find(k => f(o[k], k, o))]

export const reduce = <Ob extends O, T, U extends any>(
  o: Ob,
  f: (a: U, v: GetElementType<Ob>, k?: keyof Ob, o?: Ob) => T,
  initialValue?: U
) => {
  let keys = oKeys(o)
  if (initialValue === undefined) {
    initialValue = o[keys[0]]
    keys = keys.slice(1)
  }
  return keys.reduce((acc, k) => f(acc, o[k], k, o), initialValue as any) as T
}
export const isEmptyObject = (obj: O) =>
  oKeys(obj).length === 0 || every(obj, v => v === undefined)
export const ownKeys = Reflect.ownKeys
export const eachW = (o: Record<string | symbol, any>, f: Fn) =>
  ownKeys(o).forEach(k => f(o[k], k, o))

interface $O_P<T extends O> {
  map: (v: GetElementType<T>, k?: keyof T, o?: T) => any
}

const $O_prototype = {
  map,
  join,
  filter,
  sort,
  reduce,
  find,
  each,
  every,
  some,
  keys: oKeys,
  stringify,
}
type tmap = typeof map<any, any>

type Type_$O = typeof $O_prototype
type $O_Proto<T extends O> = {
  [key in keyof Type_$O]: typeof $O_prototype[key] extends (
    obj: O,
    ...args: infer ps
  ) => infer ret
    ? (...args: ps) => ret & $O_Proto<T>
    : never
}

// export const $O = <T extends Record<string | symbol, any>>(o: T) =>
//   new Proxy(o, {
//     get(target, prop, receiver) {
//       const proto: Fn = $O_prototype[prop as keyof typeof $O_prototype]
//       return proto
//         ? (...args: any) => {
//             const ret = proto(target, ...args)
//             return ret?.constructor.name === "Object" ? $O(ret) : ret
//           }
//         : target[prop]
//     },
//   }) as T & $O_P<T>

export function isPartialEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) return false
  return typeof a === "object"
    ? every(a, (v, key) => isPartialEqual(v, b[key]))
    : a === b
}
export function isShallowEqual(a: O, b: O): boolean {
  return oKeys(a).length === oKeys(b).length
    ? every(a, (v, k) => v === b[k])
    : false
}
export function copy<T extends O>(o: T) {
  return JSON.parse(JSON.stringify(o)) as T
}
export function stringify(o: O, seenObj = new Set()) {
  if (seenObj.has(o)) return "[Circular Object]"
  else if (typeof o === "object") seenObj.add(o)

  const t = typeof o
  const s =
    o === null ? "null" : t === "object" && Array.isArray(o) ? "array" : t
  switch (s) {
    case "array":
      return `[${o.map((val: O) => stringify(val)).join()}]`

    // case "object":
    //   return `{${$O(o)
    //     .filter((v: any) => v !== undefined)
    //     .map((v: any, k: string) => `"${k}":${stringify(v)}`)
    //     .join(",")}}`

    case "number":
    case "boolean":
    case "function":
      return o.toString()
    case "string":
      return `"${o}"`
    case "null":
    case "undefined":
      return "null"
  }
}
type XM<T extends Fn> = (o: {
  arguments: Parameters<T>
  return: ReturnType<T>
}) => void
export function xm<T extends O, D extends string>(
  o: T,
  methodName: D,
  extension: XM<T[D]>
) {
  const method = o[methodName]
  o[methodName] = ((...args: Parameters<T[D]>) => {
    const ret = method.apply(o, args)
    extension({ arguments: args, return: ret })
    return ret as ReturnType<T[D]>
  }) as T[D]
}
