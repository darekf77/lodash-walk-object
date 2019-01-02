import * as _ from 'lodash';
import { describe, before } from 'mocha'
import { expect } from 'chai';
import { Helpers } from '../index';

// const instance = BrowserDB.instance;

describe('Walk.Object', () => {

  it('Should go through all properties depp in normal object', async () => {

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



  it('Should go through all properties depp in array', async () => {

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


});


