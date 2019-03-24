import * as _ from 'lodash';
import { describe, before } from 'mocha'
import { expect } from 'chai';
import { Helpers } from '../index';

// const instance = BrowserDB.instance;
import { Log, Level } from 'ng2-logger';
const log = Log.create('value change tests')
describe('DFS Walk.Object value change', () => {

  it('DFS should iterate new object', () => {


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
    })
    // console.log(actualPathes)
    expect(actualPathes).to.be.deep.eq(['b', 'b.c_value1', 'b.c_value2']);
  })


  it('DFS should iterate new object array', () => {


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
    })
    // console.log(actualPathes)
    expect(actualPathes).to.be.deep.eq(['b', 'b[0]', 'b[0].c1', 'b[1]', 'b[1].c2']);

  })


  it('Should change deep value', async () => {

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
    })

    // console.log('obj',obj)

    expect(obj['Address.properties.user.$ref']).to.be.undefined;
    expect(obj.Address.properties.user.$ref).to.be.eq(13)

  })


  it('Should change value in object', async () => {

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
    })
    // console.log(d)

    expect(d.super).to.eq(result)

  })


  it('Should change value in object second level', async () => {

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
    })
    // console.log(d)

    expect(d.a.c).to.eq(result)

  })


  it('Should change value in array', async () => {

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
    })
    // console.log(d)

    expect(d.names[0].name).to.eq(result)

  })


  it('Should change whole object', async () => {

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
    })
    // console.log(d)

    expect(context.d).to.deep.eq(replacement)

  })


  it('Should change whole object from context', async () => {

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
    })
    // console.log(d)

    expect(context.d.a.c).to.eq(result)

  })


  it('Should handle weird pathes', async () => {

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
    })
    // log.i('d', d)

    expect(_.get(d, weirdPath)).to.eq(result)
    expect(Object.keys(d).length).to.be.eq(1)

  })

});
