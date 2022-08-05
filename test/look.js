import test from "ava"
import { isDeepEqual, isPartialEqual } from "js-tools"
import { RO } from "../src/index.js"

test.beforeEach(t => {
  t.context.s = RO({})
})
test("set number", t => {
  const { s } = t.context
  s.n1 = 1
  s.n2 = 2
  t.is(s.n1 + s.n2, 3)
  t.is(s.n1 - s.n2, -1)
})
test("set string", t => {
  const { s } = t.context
  s.s1 = "hello"
  s.s2 = "world"
  t.is(s.s1 + s.s2, "helloworld")
  t.is(s.s1.length, 5)
  t.is(s.s2.length, 5)
  t.deepEqual(
    Object.keys(s.s1),
    [0, 1, 2, 3, 4].map(v => v.toString())
  )
})
test("set boolean", t => {
  const { s } = t.context
  s.true = true
  s.false = false
  t.is(s.true, true)
  t.is(s.false, false)
  t.is(s.true && s.true, true)
  t.is(s.true && s.false, false)
  t.is(s.true || s.false, true)
})
test("set null", t => {
  const { s } = t.context
  s.n1 = null
  t.is(s.n1, null)
})
test("setting array", t => {
  const { s } = t.context
  s.ar = [1, 2, 3]
  t.assert(isPartialEqual(s.ar, [1, 2, 3]))
  s.ar[0] = 2
  t.assert(isPartialEqual(s.ar, [2, 2, 3]))
  s.ar[1] = 3
  t.assert(isPartialEqual(s.ar, [2, 3, 3]))
  t.assert(
    isPartialEqual(
      s.ar.map(v => v * 2),
      [4, 6, 6]
    )
  )
})
test("setting object (it will set by refrence)", t => {
  const o = { num: 1, str: "str", arr: [1, 2, 3], obj: { a: 1, b: 2 } }
  const s = RO(o)
  s.num = 2
  t.is(s.num, o.num)
  s.str = "str2"
  t.is(s.str, o.str)
  s.arr = [3, 4]
  t.assert(isPartialEqual(s.arr, o.arr))
  s.obj = { a: 3, b: 4, c: 5 }
  t.assert(isPartialEqual(s.obj, o.obj))
})
// ----------------------------------  computables  ----------------------------------
test("set computable property on numbers", async t => {
  const { s } = t.context
  s.x = 3
  s.x2 = ({ x }) => x * 2
  s.y = 2
  s.adder = ({ x, y }) => x + y
  s.x2addY = ({ x2, y }) => x2 + y
  s.x2plusAdder = ({ x2, adder }) => x2 + adder
  t.is(s.x2, 6)
  t.is(s.adder, 5)
  t.is(s.x2addY, 8)
  t.is(s.x2plusAdder, 11)
  s.x = 4
  t.is(s.x2plusAdder, 14)
  t.is(s.x2addY, 10)
  t.is(s.x2, 8)
  t.is(s.adder, 6)
  s.x = 13
  s.y = 7
  t.is(s.x2addY, 33)
  t.is(s.x2, 26)
  t.is(s.x2plusAdder, 46)
  t.is(s.adder, 20)
})
test("computable property on strings", t => {
  const { s } = t.context
  s.s1 = "world"
  s.s2 = ({ s1 }) => `hello ${s1}`
  t.is(s.s2, "hello world")
})
test("using object assign for computable", t => {
  const { s } = t.context
  Object.assign(s, { s1: "world", s2: ({ s1 }) => `hello ${s1}` })
  t.is(s.s2, "hello world")
})
test("object with lazyReact instance", t => {
  const { s } = t.context
  s.o = RO({ s1: "world", s2: ({ s1 }) => `hello ${s1}` })
  t.is(s.o.s2, "hello world")
})
test("computable can have non function values too", t => {
  const s = RO()
  s.o = {
    x: 3,
    num: 1,
    str: "str",
    arr: [1, 2, 3],
    obj: { a: 1, b: 2 },
    x2: ({ x }) => x * 2,
  }
  t.assert(
    isDeepEqual(s.o, {
      x: 3,
      num: 1,
      str: "str",
      arr: [1, 2, 3],
      obj: { a: 1, b: 2 },
      x2: 6,
    })
  )
})
test("stragiht assigning an object by passing it to constructor", t => {
  const o = { s1: "world", s2: ({ s1 }) => `hello ${s1}` }
  const s = RO(o)
  t.is(s.s2, "hello world")
})
test("nested object with computable", t => {
  const inputs = RO({ s1: "world" })
  const s = RO({}, inputs)
  s.o = {
    o1: { s2: ({ s1 }) => `hello ${s1}` },
  }
  t.is(s.o.o1.s2, "hello world")
})
test("computable in array", async t => {
  const { s } = t.context
  let o = RO(["h1", ({ 0: str }) => `${str} there`])
  s.html = o
  t.is(s.html[1], "h1 there")
})
test("computable in object in array", async t => {
  const { s } = t.context
  let o = [RO({ tagVal: "h1", tag: $ => `${$.tagVal}` })]
  s.html = o
  t.is(s.html[0].tag, "h1")
})
test("computable property only executed once after its factors changed", async t => {
  const { s } = t.context
  s.x = 12
  s.y = 8
  let counter = 0
  s.adder = ({ x, y }) => x + y + counter++
  t.is(s.adder, 20)
  t.is(s.adder, 20)
  t.is(s.adder, 20)
  s.x = 13
  s.y = 9
  // after changing both factors, the computable property will be executed only once
  t.is(s.adder, 23)
  t.is(s.adder, 23)
  t.is(s.adder, 23)
  t.is(counter, 2)
})
test("computable from object", async t => {
  const inputs = RO({
    x: 12,
    y: 8,
  })
  const s = RO({}, inputs)
  s.add = {
    value: ({ x, y }) => x + y,
    r: ({ x }) => x,
    l: ({ y }) => y,
  }
  t.is(s.add.value, 20)
  t.is(s.add.r, 12)
  t.is(s.add.l, 8)
  inputs.x = 17
  t.is(s.add.value, 25)
  t.is(s.add.r, 17)
  t.is(s.add.l, 8)
  s.add2 = {
    value: ({ x, y }) => x + y,
    r: ({ x }) => x,
    l: ({ y }) => y,
  }
  t.is(s.add2.value, 25)
  t.is(s.add2.r, 17)
  t.is(s.add2.l, 8)
})
test("set computable on object ", t => {
  const s = RO({
    strs: { s1: "hello", s2: "world" },
    message: ({ strs }) => `${strs.s1} ${strs.s2}`,
  })
  t.is(s.message, "hello world")
  // s.strs = { s1: "hi", s2: "Mr. smith" };
  Object.assign(s.strs, { s1: "hi", s2: "Mr. smith" })
  t.is(s.message, "hi Mr. smith")
  s.strs.s2 = "Mrs. dias"
  t.is(s.message, "hi Mrs. dias")
})
// // ----------------------------------  array  ----------------------------------
test("default input object for computable for array", t => {
  const s = RO()
  const children = [
    {
      tagValue: "h1",
      tag: $ => `${$.tagValue}`,
    },
  ]
  s.html = { children }
  t.is(s.html.children[0].tag, "h1")
  s.html.children[0].tagValue = "h2"
  t.is(s.html.children[0].tag, "h2")
})
test("set computable on array", t => {
  const s = RO({
    nums: [1, 2, 3],
    sum: ({ nums }) => nums.reduce((a, b) => a + b, 0),
  })
  t.is(s.sum, 6)
  s.nums = [1, 2, 3, 4]
  t.is(s.sum, 10)
  s.nums[0] = 6 // [6, 2, 3, 4]
  t.is(s.sum, 15)
  s.nums.push(8) // [6, 2, 3, 4, 8]
  t.is(s.sum, 23)
  s.nums.unshift(10) // [10, 6, 2, 3, 4, 8]
  t.is(s.sum, 33)
  s.nums.splice(1, 1) // [10, 2, 3, 4, 8]
  t.is(s.sum, 27)
  s.nums.pop() // [10, 2, 3, 4]
  t.is(s.sum, 19)
  s.nums.shift() // [2, 3, 4]
  t.is(s.sum, 9)
  s.nums = [3, 21, 6]
  t.is(s.sum, 30)
})
test("observe array of objects", t => {
  const s = RO({
    arr: [{ x: 1 }, { x: 2 }],
    sum: ({ arr }) => arr.reduce((a, b) => a + b.x, 0),
  })
  t.is(s.sum, 3)
  s.arr[0].x = 3
  t.is(s.sum, 5)
  s.arr[1].x = 4
  t.is(s.sum, 7)
  s.arr.push({ x: 5 })
  t.is(s.sum, 12)
  s.arr.unshift({ x: 6 })
  t.is(s.sum, 18)
  s.arr.splice(1, 1)
  t.is(s.sum, 15)
  s.arr.pop()
  t.is(s.sum, 10)
  s.arr.shift()
  t.is(s.sum, 4)
})
// ----------------------------------  delete  ----------------------------------
test("delete computable ", async t => {
  let counter = 0
  const s = RO({
    x: 10,
    xx: ({ x }) => {
      counter++
      return x * 2
    },
  })
  t.is(s.xx, 20)
  t.is(counter, 1)
  delete s.xx
  t.is(s.xx, undefined)
  s.x = 7
  await s.$APR
  t.is(s.xx, undefined)
  t.is(counter, 1)
})
test("change computable", t => {
  const s = RO({
    x: 10,
    xx: ({ x }) => x * 2,
  })
  t.is(s.xx, 20)
  delete s.xx
  s.xx = ({ x }) => x * 3
  t.is(s.xx, 30)
  s.x = 7
  t.is(s.xx, 21)
})
test("make computable as regular property", t => {
  const s = RO({
    x: 10,
    xx: ({ x }) => x * 2,
  })
  delete s.xx
  s.xx = 34
  s.x = 21
  t.is(s.xx, 34)
})
