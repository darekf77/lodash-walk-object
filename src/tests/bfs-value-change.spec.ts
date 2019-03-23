import * as _ from 'lodash';
import { describe, before } from 'mocha'
import { expect } from 'chai';
import { Helpers } from '../index';

// const instance = BrowserDB.instance;
import { Log, Level } from 'ng2-logger';
const log = Log.create('value change tests')
describe('BFS Walk.Object value change', () => {

  it('BFS Should change deep value', async () => {

    const obj = {
      Address: {
        properties: {
          user: {
            $ref: 12
          }
        }
      }
    }


    Helpers.Walk.Object(obj, (value, lodashPath, changeValue) => {
      // console.log(lodashPath)
      if (lodashPath.endsWith('$ref')) {
        changeValue(13)
      }
    }, { breadthWalk: true })

    // console.log('obj',obj)

    expect(obj['Address.properties.user.$ref']).to.be.undefined;
    expect(obj.Address.properties.user.$ref).to.be.eq(13)

  })


  it('BFS Should change value in object', async () => {

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

    const result = 'amzing2'
    Helpers.Walk.Object(d, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === 'super') {
        changeValue(result)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // console.log(d)

    expect(d.super).to.eq(result)

  })


  it('BFS Should change value in object second level', async () => {

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

    const result = 'amzing2'
    Helpers.Walk.Object(d, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === 'a.c') {
        changeValue(result)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // console.log(d)

    expect(d.a.c).to.eq(result)

  })


  it('BFS Should change value in array', async () => {

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

    const result = 'amzing2'
    Helpers.Walk.Object(d, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === 'names[0].name') {
        changeValue(result)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // console.log(d)

    expect(d.names[0].name).to.eq(result)

  })


  it('BFS Should change whole object', async () => {

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

    const context = {
      d
    }

    const replacement = {
      test: 'super'
    }

    Helpers.Walk.ObjectBy('d', context, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === '') {
        changeValue(replacement)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // console.log(d)

    expect(context.d).to.deep.eq(replacement)

  })


  it('BFS Should change whole object from context', async () => {

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

    const context = {
      d
    }

    const result = 'amzing2'

    Helpers.Walk.ObjectBy('d', context, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === 'a.c') {
        changeValue(result)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // console.log(d)

    expect(context.d.a.c).to.eq(result)

  })


  it('BFS Should handle weird pathes', async () => {

    const d = {}
    const result = 'amzing2'
    const weirdPath = 'dependencies.@angular-devkit/build-optimizer'

    _.set(d, weirdPath, 'hellow')

    const context = {
      d
    }



    Helpers.Walk.ObjectBy('d', context, (v, lodashPath, changeValue) => {
      // console.log('lodashPath',lodashPath)
      if (lodashPath === weirdPath) {
        changeValue(result)
      }
      // console.log(`Path: "${lodashPath}" `, v)
    }, { breadthWalk: true })
    // log.i('d', d)

    expect(_.get(d, weirdPath)).to.eq(result)
    expect(Object.keys(d).length).to.be.eq(1)

  })

});
