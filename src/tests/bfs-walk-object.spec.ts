import * as _ from 'lodash';
import { describe, before } from 'mocha'
import { expect } from 'chai';
import { Helpers } from '../index';
import { CLASS } from 'typescript-class-helpers';

// import { Log, Level } from 'ng2-logger';
// const log = Log.create('walk object spec')

// const instance = BrowserDB.instance;


@CLASS.NAME('Proj', 'location')
class Proj {
  static locationsID = 0;
  constructor() {
    this.location = `location_${Proj.locationsID++}`
  }
  parent: Proj;
  isProjectInstance = true;
  location: string;
  browser: {
    child?: Proj;
    children: Proj[];
  } = {
      children: []
    }
}

@CLASS.NAME('Test')
export class Test {
  static id = 0;

  id: number;

  users: User[];

  name: string;
  constructor() {
    this.id = Test.id++;
  }
}


@CLASS.NAME('User')
export class User {
  static id = 0;

  static users = [new User(), new User()]

  browser: User = {} as any

  dupa() {
    console.log('jest em!')
    return true;
  }

  id: number;

  authors: User[];
  friend: User;
  friend2?: User;
  get authorsGetter() {
    return this.browser.authors;
  }
  test: Test;
  constructor(id?: number, public realId: string = void 0) {
    if (_.isNumber(id)) {
      this.id = id;
    } else {
      this.id = User.id++;
    }

  }
}

describe('BFS Walk.Object', () => {

  it('BFS should iterate new object', () => {


    const a = {
      b: {
        b_value1: 'b_value1',
        b_value2: 'b_value2',
      }
    }

    const actualPathes = []
    Helpers.Walk.Object(a, (value, lodashPath, change, { }) => {
      actualPathes.push(lodashPath)
      if (lodashPath === 'b') {
        change({
          c_value1: 'c_value1',
          c_value2: 'c_value2',
        })
      }
    }, { breadthWalk: true })
    // console.log(actualPathes)
    expect(actualPathes).to.be.deep.eq(['b', 'b.c_value1', 'b.c_value2']);
  })


  it('BFS should iterate new object array', () => {


    const a = {
      b: [
        'b_value1',
        'b_value2',
      ]
    }

    const actualPathes = []
    Helpers.Walk.Object(a, (value, lodashPath, change, { }) => {
      actualPathes.push(lodashPath)
      if (lodashPath === 'b') {
        change([
          { c1: 'c1' },
          { c2: 'c2' }
        ])
      }
    }, { breadthWalk: true })
    // console.log(actualPathes)
    expect(actualPathes).to.be.deep.eq(['b', 'b[0]', 'b[1]', 'b[0].c1', 'b[1].c2']);

  })

  it('BFS Should go through all properties depp in normal object', async () => {


    const obj = {
      a: {
        a1: {
          a2: {

          }
        }
      },
      b: {
        b1: {
          b2: {

          }
        }
      },
      c: {
        c1: {
          c2: {

          }
        }
      }
    };

    Helpers.Walk.Object(obj, (value, lodashPath) => {
      // console.log(lodashPath)
    }, { breadthWalk: true })



  })

  it('BFS Should go through all properties depp in normal object', async () => {

    const d = {
      a: {
        c: 23
      },
      super: 'amazing',
      names: [
        {
          name: 'Dariusz'
        }
      ]
    }

    const expectedPathes = [
      'a',
      'super',
      'names',
      'a.c',
      'names[0]',
      'names[0].name'
    ]

    const actualPathes = []

    Helpers.Walk.Object(d, (v, lodashPath) => {
      actualPathes.push(lodashPath)
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })


    expect(expectedPathes).to.deep.eq(actualPathes)

  })



  it('BFS Should go through all properties depp in array', async () => {

    const d = {
      a: {
        c: 23
      },
      super: 'amazing',
      names: [
        {
          name: 'Dariusz'
        }
      ]
    }

    const c = {
      a2: {
        c2: 25
      },
      super2: 'amazing2',
      names2: [
        {
          name: 'Dariusz2'
        }
      ]
    }

    let arr = [
      d,
      c
    ]

    const expectedPathes = [
      "[0]",
      "[1]",
      "[0].a",
      "[0].super",
      "[0].names",
      "[1].a2",
      "[1].super2",
      "[1].names2",
      "[0].a.c",
      "[0].names[0]",
      "[1].a2.c2",
      "[1].names2[0]",
      "[0].names[0].name",
      "[1].names2[0].name"
    ]

    const actualPathes = []

    Helpers.Walk.Object(arr, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { breadthWalk: true })

    expect(expectedPathes).to.deep.eq(actualPathes)

  })

  it('BFS Should detect circural object', async () => {

    const a = {}
    const b = { a } as any;
    b.b = b;

    let circuralFounded = false;
    let latestPath: string;

    Helpers.Walk.Object(b, (v, lodashPath, changeValue, { isCircural, skipObject }) => {
      // console.log('lodashPath path in loop', lodashPath)
      latestPath = lodashPath;
      if (isCircural) {
        circuralFounded = true;
        skipObject()
      }
    }, { checkCircural: true, breadthWalk: true })

    expect(latestPath).to.be.eq('b')
    expect(circuralFounded).to.be.true;
  });

  it('BFS Should detect circural object when breath', async () => {

    const a = {}
    const b = { a } as any;
    b.b = b;

    let circuralFounded = false;
    let latestPath: string;

    Helpers.Walk.Object(b, (v, lodashPath, changeValue, { isCircural, skipObject }) => {
      // console.log('lodashPath path in loop', lodashPath)
      latestPath = lodashPath;
      if (isCircural) {
        circuralFounded = true;
        skipObject()
      }
    }, { checkCircural: true, breadthWalk: true })

    expect(latestPath).to.be.eq('b')
    expect(circuralFounded).to.be.true;
  });

  it('BFS Circural refences should works ', async () => {

    const a = {}
    const b = { a } as any;
    b.b = b;

    let circuralFounded = false;
    let latestPath: string;
    // console.log(b)
    Helpers.Walk.Object(b, (v, lodashPath, changeValue, { isCircural, skipObject }) => {
      // console.log('lodashPath path in loop', lodashPath)
      latestPath = lodashPath;
      if (isCircural) {
        circuralFounded = true;
        skipObject()
      }
    }, { checkCircural: true, breadthWalk: true })

    expect(latestPath).to.be.eq('b')
    expect(circuralFounded).to.be.true;

  })


  it('BFS Should walk wide', async () => {

    const d = {
      super: {
        hello: 1
      }
    }

    const c = {
      super2: {
        hello2: 1,
        hello21: 1
      }
    }

    let arr = {
      d,
      c
    }

    const expectedPathes = [
      'd',
      'c',
      'd.super',
      'c.super2',
      'd.super.hello',
      'c.super2.hello2',
      'c.super2.hello21'
    ]

    const actualPathes = []

    Helpers.Walk.Object(arr, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { breadthWalk: true })

    // console.log('actualPathes', actualPathes)

    expect(expectedPathes).to.deep.eq(actualPathes)

  })


  it('BFS Should handle include', async () => {

    const d = {
      a: {
        c: 23
      },
      super: 'amazing',
      names: [
        {
          name: 'Dariusz'
        }
      ]
    }

    const c = {
      a2: {
        c2: 25
      },
      super2: 'amazing2',
      names2: [
        {
          name: 'Dariusz2'
        }
      ]
    }

    let arr = [
      d,
      c
    ]

    const expectedPathes = [
      '[0]',
      '[1]',
      '[0].super',
      '[1].super2',
    ]

    const actualPathes = []

    Helpers.Walk.Object(arr, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { include: ['super', 'super2'], breadthWalk: true })

    expect(expectedPathes).to.deep.eq(actualPathes)

  })


  it('BFS Should handle exclude', async () => {

    const d = {
      a: {
        c: 23
      },
      super: 'amazing',
      names: [
        {
          name: 'Dariusz'
        }
      ]
    }

    const c = {
      a2: {
        c2: 25
      },
      super2: 'amazing2',
      names2: [
        {
          name: 'Dariusz2'
        }
      ]
    }

    let arr = [
      d,
      c
    ]

    const expectedPathes = [
      '[0]',
      '[1]',
      '[0].super',
      '[1].super2',
    ]

    const actualPathes = []

    Helpers.Walk.Object(arr, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { exclude: ['names2', 'name', 'a'], breadthWalk: true })

    expect(expectedPathes).to.deep.eq(actualPathes)

  })




});


