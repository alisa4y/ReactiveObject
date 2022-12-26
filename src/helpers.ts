type O = Record<any, any>
type Fn = (...args: any[]) => any

export function flattenKeys(o: O, delimiter = ",", path = "", out: O = {}) {
  Object.keys(o).forEach(key =>
    isObject(o[key])
      ? flattenKeys(o[key], delimiter, path + key + delimiter, out)
      : (out[path + key] = o[key])
  )
  return out
}
export function isObject(o: O) {
  return o?.constructor.name === "Object"
}
type TrimLeft<T> = T extends ` ${infer rest}` ? TrimLeft<rest> : T
type TrimRight<T> = T extends `${infer rest} ` ? TrimRight<rest> : T
type Trim<T> = TrimLeft<TrimRight<T>>
type Split<
  T,
  S extends string,
  Parts = never
> = T extends `${infer s1}${S}${infer s2}`
  ? Split<s2, S, Parts | Trim<s1>>
  : Parts | Trim<T>

type ExpandKeys<
  T extends Record<string, any>,
  S extends string,
  K = keyof T
> = K extends keyof T
  ? {
      [key in Split<K, S>]: T[K]
    }
  : never
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never
export function expandKeys<T extends O, D extends string>(
  o: T,
  delimiter: D,
  out: O = {}
) {
  Object.keys(o).forEach(key => {
    const value = isObject(o[key]) ? expandKeys(o[key], delimiter) : o[key]
    key
      .toString()
      .split(delimiter)
      .map(k => k.trim())
      .forEach(k => (out[k] = value))
  })
  return out as UnionToIntersection<ExpandKeys<T, D>>
}
type Fetch<
  T extends O,
  K extends string,
  D extends string
> = K extends `${infer s1}${D}${infer s2}`
  ? s1 extends keyof T
    ? Fetch<T[s1], s2, D>
    : never
  : K extends keyof T
  ? T[K]
  : never
export function fetchKeys<T extends O, K extends string, D extends string>(
  o: T,
  keyString: K,
  delimiter: D
) {
  return keyString.split(delimiter).reduce((o, k) => o[k], o) as Fetch<T, K, D>
}
type Pluck<T, K extends any[]> = K extends [infer k, ...infer rest]
  ? k extends keyof T
    ? Pluck<T[k], rest>
    : never
  : T
export const pluck = <T extends O, K extends string[]>(o: T, ...keys: K) =>
  keys.reduce((acc, k) => acc[k], o) as Pluck<T, K>
