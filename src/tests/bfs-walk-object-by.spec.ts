import { _ } from 'tnp-core';
import { describe, before, beforeEach, it } from 'mocha';
import { expect } from 'chai';
import { Helpers } from '../index';
import { Log } from 'ng2-logger';
const log= Log.create('bfs walk by')

// const instance = BrowserDB.instance;

describe('BFS Walk.ObjectBy', () => {

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
      '',
      'a',
      'super',
      'names',
      'a.c',
      'names[0]',
      'names[0].name'
    ]

    const actualPathes = []

    let context = {
      d
    }

    Helpers.Walk.ObjectBy('d', context, (v, lodashPath) => {
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
      "",
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

    let context = {
      arr
    }

    Helpers.Walk.ObjectBy('arr', context, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { breadthWalk: true })

    // log.i('actualPathes',actualPathes)

    expect(expectedPathes).to.deep.eq(actualPathes)

  })

  it('BFS Should go through all properties , getters included', async () => {

    let person = {
      name: "Dariusz",
      surname: "Filipiak"
    } as any;

    Object.defineProperty(person, 'fullName', {
      get: function () {
        return this.name + ' ' + this.surname;
      }
    });

    // console.log(Object.getOwnPropertyNames(person))

    // _.forOwn(person, (v, k) => {
    //   console.log(k)
    // })

    const expectedPathes = ['name', 'surname', 'fullName'];
    const actualPathes = []
    Helpers.Walk.Object(person, (v, lodashPath) => {
      actualPathes.push(lodashPath)
    }, { walkGetters: true, breadthWalk: true })

    expect(expectedPathes).to.deep.eq(actualPathes)

  });


});


