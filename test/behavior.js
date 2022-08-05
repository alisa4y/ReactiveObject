import test from "ava"
import { RO } from "../src/index.js"
import { timeout } from "js-tools"

test.beforeEach(t => {
  t.context.s = RO({})
})
test("recursive call", t => {
  const { s } = t.context
  s.x = 1
  s.sum = 0
  s.sum = ({ x }) => {
    if (x < 10) s.x++
    return s.sum + x
  }
  t.is(s.sum, 55)
})
test("computables have lazy excution", t => {
  const { s } = t.context
  let counter = 0
  s.x = 3
  s.x2 = ({ x }) => x * 2 + counter++
  t.is(counter, 0)
  t.is(s.x2, 6)
  s.x2
  s.x2
  s.x2
  t.is(s.x2, 6)
  t.is(counter, 1)
  s.x = 4
  t.is(counter, 1) // won't cahnge since x2 not called yet
  t.is(s.x2, 9)
  t.is(counter, 2)
  s.x2
  s.x2
  s.x2
  t.is(s.x2, 9)
  t.is(counter, 2)
  s.x = 5
  t.is(counter, 2) // won't cahnge since x2 not called yet
  t.is(s.x2, 12)
  s.x2
  s.x2
  s.x2
  t.is(s.x2, 12)
  t.is(counter, 3)
})
test("computables will executed when main routine finishes or await", async t => {
  const { s } = t.context
  let counter = 0
  s.x = 3
  s.x2 = ({ x }) => x * 2 + counter++
  t.is(counter, 0)
  t.is(s.x2, 6)
  t.is(counter, 1)
  s.x = 4
  await timeout(10)
  t.is(counter, 2)
  s.x = 5
  await timeout(10)
  t.is(counter, 3)
  s.x = 6
  s.x = 7
  await timeout(10)
  t.is(counter, 4)
})
test("more than one computable can be assigned to a property (simple calculator)", async t => {
  const { s } = t.context

  s.s1 = 0
  s.s2 = 0
  s.op = ""

  s.x = ({ s1 }) => parseInt(s1) || 0
  s.y = ({ s2 }) => parseInt(s2) || 0
  s.watchOp = ({ op }) => (s[op] = !s[op])
  s.watchOp

  s.result = ({ ["+"]: o }) => s.x + s.y
  s.result = ({ ["-"]: o }) => s.x - s.y
  s.result = ({ ["*"]: o }) => s.x * s.y
  s.result = ({ ["/"]: o }) => s.x / s.y
  s.result = ({ ["^"]: o }) => Math.pow(s.x, s.y)
  s.result

  s.s1 = "11"
  s.s2 = "2"
  s.op = "+"
  t.is(s.result, 13)

  s.s1 = "18"
  s.s2 = "-2"
  s.op = "+"
  t.is(s.result, 16) // not same because op didn't change

  s.s1 = "13"
  s.s2 = "4"
  s.op = "-"
  t.is(s.result, 9)

  s.s1 = "30"
  s.s2 = "10"
  s.op = "/"
  t.is(s.result, 3)

  s.s1 = "13"
  s.s2 = "4"
  s.op = "*"
  t.is(s.result, 52)

  s.s1 = "3"
  s.s2 = "3"
  s.op = "^"
  t.is(s.result, 27)

  s.s1 = "2"
  s.s2 = "3"
  s.op = "*"
  t.is(s.result, 6)

  s.s1 = "18"
  s.s2 = "3"
  s.op = "/"
  t.is(s.result, 6)

  s.s1 = "2"
  s.s2 = "3"
  s.op = "^"
  t.is(s.result, 8)
})
//z
test("can watch for change in objects", async t => {
  const { s } = t.context
  s.x = { a: 1 }
  s.y = { a: 1 }
  s.x2 = ({ x }) => ({ v: x })
  s.y2 = ({ y }) => ({ v: y })
  s.x = { a: 2 }
  s.y.a = 2
  t.is(s.x2.v.a, 2)
  t.is(s.y2.v.a, 2)
})
test("set async computables", async t => {
  const s = RO({})
  s.x = 1
  s.x2 = async ({ x }) => {
    await timeout(100)
    return x * 2
  }
  t.is(await s.x2, 2)
  s.x = 3
  t.is(await s.x2, 6)
})
test("compute array of computables", t => {
  const ins = RO({ x: 3 })
  const s = RO({}, ins)
  s.ar = [
    ({ x }) => ({ v: x * 2 }),
    ({ x }) => ({ v: x * 3 }),
    ({ x }) => ({ v: x * 4 }),
  ]
  t.is(s.ar[0].v, 6)
  t.is(s.ar[1].v, 9)
  t.is(s.ar[2].v, 12)
  const ar = s.ar
  ins.x = 5
  t.is(ar[0].v, 10)
  t.is(ar[1].v, 15)
  t.is(ar[2].v, 20)
})
test("computables inside array of an object", t => {
  const ins = RO({
    x: 1,
    x2: ({ x }) => x * 2,
  })
  const s = RO(
    {
      ar: [({ x2 }) => x2 * 2, ({ x2 }) => x2 * 3],
    },
    ins
  )
  t.is(s.ar[0], 4)
  t.is(s.ar[1], 6)
  ins.x = 2
  t.is(s.ar[0], 8)
  t.is(s.ar[1], 12)
})
test("external RO proxy as input ", t => {
  const s = RO({ x: 1, x2: ({ x }) => x * 2 })
  const s2 = RO([({ x2 }) => x2 * 2, ({ x2 }) => x2 * 3], s)
  t.is(s2[0], 4)
  t.is(s2[1], 6)
  s.x = 2
  t.is(s2[0], 8)
  t.is(s2[1], 12)
})
test("will trigger on object assignment", t => {
  const s = RO({ o: { x: 3 } })
  s.x2 = ({ o }) => o.x * 2
  t.is(s.x2, 6)
  s.o = { x: 4 }
  t.is(s.x2, 8)
  s.o.x = 5
  t.is(s.x2, 10)
})
test("give input ReactiveObject to call only when primitives changes", t => {
  const o = RO({ x1: 3, x2: 21 })
  const s = RO({}, o)
  let count1 = 0,
    count2 = 0
  s.x2 = ({ x1 }) => {
    count1++
    return x1 * 2
  }
  s.x3 = ({ x2 }) => {
    count2++
    return x2 * 3
  }
  t.is(s.x2, 6)
  t.is(s.x3, 63)
  o.x1 = 4
  t.is(s.x2, 8)
  t.is(s.x3, 63)
  t.is(count1, 2)
  t.is(count2, 1)
})
test("a ReactiveObject can be used somewhere else in object", t => {
  const s = RO({
    v1: {
      x: 1,
    },
    v2: {
      ar: [],
      arChange: ({ ar }) => ar.map(({ x }) => x * 2),
    },
  })
  s.v2.arChange // this line is only for test scenaria to remove computable from queue
  s.v2.ar.push(s.v1)
  s.v1.x = 2
  t.is(s.v2.arChange[0], 4)
})
