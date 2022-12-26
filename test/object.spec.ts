import { describe, it } from "mocha"
import * as chai from "chai"
import {
  some,
  every,
  each,
  map,
  join,
  sort,
  filter,
  find,
  reduce,
  isEmptyObject,
  isPartialEqual,
  isShallowEqual,
  copy,
  stringify,
  xm,
} from "../src/object"

const { expect } = chai
chai.should()

type Expect<T extends true> = T
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

const objs = {
  a: {
    name: "tom",
    age: 23,
  },
  b: {
    name: "ali",
    age: 28,
  },
  12: {
    name: "jane",
    age: 17,
  },
  someone: {
    name: "rui",
    age: 43,
  },
}

describe("some", () => {
  it("is same as in array", () => {
    some(objs, ({ age }) => age > 25).should.equal(true)
    some(objs, ({ age }) => age > 125).should.equal(false)
  })
})

describe("every", () => {
  it("is same as in array", () => {
    every(objs, ({ age }) => age > 15).should.equal(true)
    every(objs, ({ age }) => age > 25).should.equal(false)
  })
})

describe("each", () => {
  it("is same as in array", () => {
    let result = {} as typeof objs
    each(objs, (v, k) => {
      result[k] = v
    })
    expect(result).deep.equal(objs)
  })
})

describe("map", () => {
  it("is same as in array", () => {
    map(objs, ({ age }) => age).should.deep.equal({
      a: 23,
      b: 28,
      12: 17,
      someone: 43,
    })
    map(objs, ({ name }) => name).should.deep.equal({
      a: "tom",
      b: "ali",
      12: "jane",
      someone: "rui",
    })
  })
})

describe("join", () => {
  it("is same as in array", () => {
    const o = {
      a: "hello",
      b: "world",
    }
    expect(join(o, " ")).equal("hello world")
    expect(join(o)).equal("hello,world")
  })
})

describe("sort", () => {
  it("is same as in array", () => {
    expect(sort(objs, (a, b) => (a.age > b.age ? 1 : -1))).deep.equal({
      12: {
        name: "jane",
        age: 17,
      },
      a: {
        name: "tom",
        age: 23,
      },
      b: {
        name: "ali",
        age: 28,
      },
      someone: {
        name: "rui",
        age: 43,
      },
    })
  })
})

describe("filter", () => {
  it("is same as in array", () => {
    expect(filter(objs, v => v.age > 40)).deep.equal({
      someone: {
        name: "rui",
        age: 43,
      },
    })
  })
})

describe("find", () => {
  it("is same as in array", () => {
    expect(find(objs, v => v.name === "ali")).deep.equal({
      name: "ali",
      age: 28,
    })
  })
})

describe("reduce", () => {
  it("is same as in array", () => {
    expect(reduce(objs, (totalAge, v) => totalAge + v.age, 0)).equal(111)
  })
})

describe("isEmptyObject", () => {
  it("checkse if the given value is empty object with no keys", () => {
    // @ts-expect-error
    isEmptyObject(1)
    // @ts-expect-error
    isEmptyObject("string")
    /* // @ts-expect-error
    isEmptyObject(null)
      // @ts-expect-error
    isEmptyObject(undefined) */
    isEmptyObject([1]).should.equal(false)
    isEmptyObject([]).should.equal(true)
    isEmptyObject({}).should.equal(true)
    isEmptyObject({ a: true }).should.equal(false)
    isEmptyObject(objs).should.equal(false)
  })
})
// describe("$O", () => {
//   it("", () => {
//     $O(objs).map(v => v)
//   })
// })

describe("isPartialEqual", () => {
  it("is like if the second object is a superset to the first one", () => {
    const a = {
      1: 1,
      a: "a",
    }
    const b = {
      1: 1,
      a: "a",
      b: "b",
    }
    isPartialEqual(a, b).should.equal(true)
    isPartialEqual(b, a).should.equal(false)
  })
})
describe("isShallowEqual", () => {
  it("only checks the first level of object to be equal", () => {
    interface T1 {
      1: number
      a: string
      op?: object
    }
    const a: T1 = {
      1: 1,
      a: "a",
    }
    const b: T1 = {
      1: 1,
      a: "a",
    }
    isShallowEqual(a, b).should.equal(true)
    a.op = { children: objs }
    b.op = { children: objs }
    isShallowEqual(a, b).should.equal(false)
    isShallowEqual(b, a).should.equal(false)
  })
})

describe("copy", () => {
  it("simply copy an object", () => {
    const o = {
      a: {
        b: {
          c: "hello",
          d: "world",
        },
      },
    }
    const r1 = copy(o)
    expect(r1).deep.equal(o)
  })
})
describe("stringify", () => {
  it("is same as ", () => {
    const o = {
      a: 1,
      b: "hello",
    }
    expect(stringify(o)).equal(`{"a":1,"b":"hello"}`)
  })
})
describe("xm", () => {
  it("extends the method of an object", () => {
    const o = {
      x2: (x: number) => x * 2,
    }
    expect(o.x2(2)).equal(4)
    let x = 0
    xm(o, "x2", ({ arguments: args, return: ret }) => {
      x = args[0]
      expect(ret).equal(4)
    })
    expect(o.x2(2)).equal(4)
    expect(x).equal(2)
  })
})
