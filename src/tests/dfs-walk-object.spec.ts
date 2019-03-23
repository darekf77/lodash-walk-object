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

describe('DFS Walk.Object', () => {

  it('DFS Should go through all properties depp in normal object', async () => {

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
        'a.c',
        'super',
        'names',
        'names[0]',
        'names[0].name'
      ]

      const actualPathes = []

      Helpers.Walk.Object(d, (v, lodashPath) => {
        actualPathes.push(lodashPath)
        // console.log(`Path: "${lodashPath}" `, v)
      })


      expect(expectedPathes).to.deep.eq(actualPathes)

    })



    it('DFS Should go through all properties depp in array', async () => {

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
        '[0].a',
        '[0].a.c',
        '[0].super',
        '[0].names',
        '[0].names[0]',
        '[0].names[0].name',
        '[1]',
        '[1].a2',
        '[1].a2.c2',
        '[1].super2',
        '[1].names2',
        '[1].names2[0]',
        '[1].names2[0].name'
      ]

      const actualPathes = []

      Helpers.Walk.Object(arr, (v, lodashPath) => {
        actualPathes.push(lodashPath)
      })

      expect(expectedPathes).to.deep.eq(actualPathes)

    })

    it('DFS Should detect circural object', async () => {

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
      }, { checkCircural: true })

      expect(latestPath).to.be.eq('b')
      expect(circuralFounded).to.be.true;
    });

    it('DFS Should detect circural object when breath', async () => {

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

    it('DFS Circural refences should works ', async () => {

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
      }, { checkCircural: true, breadthWalk: false })

      expect(latestPath).to.be.eq('b')
      expect(circuralFounded).to.be.true;

    })



    it('DFS Should handle include', async () => {

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
        '[0].super',
        '[1]',
        '[1].super2',

      ]

      const actualPathes = []

      Helpers.Walk.Object(arr, (v, lodashPath) => {
        actualPathes.push(lodashPath)
      }, { include: ['super', 'super2'] })

      expect(expectedPathes).to.deep.eq(actualPathes)

    })


    it('DFS Should handle exclude', async () => {

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
        '[0].super',
        '[1]',
        '[1].super2',

      ]

      const actualPathes = []

      Helpers.Walk.Object(arr, (v, lodashPath) => {
        actualPathes.push(lodashPath)
      }, { exclude: ['names2', 'name','a'] })

      expect(expectedPathes).to.deep.eq(actualPathes)

    })




  });


