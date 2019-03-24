
import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers';
// let counter = 0
import { Models } from './models';
export * from './models';

function findChildren(ver: Models.Ver, lp: string, walkGetters: boolean): Models.Ver[] {

  const obj = ver.v
  if (_.isArray(obj)) {
    return obj.map((v, i) => {
      return { v, p: `${lp}[${i}]`, parent: ver, isGetter: false }
    });
  } else if (_.isObject(obj)) {

    const allKeys = !walkGetters ? [] : Object.getOwnPropertyNames(obj);
    const children: Models.Ver[] = [];
    for (const key in obj) {
      if (_.isObject(obj) && obj.hasOwnProperty(key)) {
        _.pull(allKeys, key)
        children.push({ v: obj[key], p: `${(lp === '') ? '' : `${lp}.`}${key}`, parent: ver, isGetter: false })
      }
    }
    if (walkGetters) {
      for (let index = 0; index < allKeys.length; index++) {
        if (_.isObject(obj)) {
          const key = allKeys[index];
          children.push({ v: obj[key], p: `${(lp === '') ? '' : `${lp}.`}${key}`, parent: ver, isGetter: true })
        }
      }
    }
    return children;
  }
  return [];
}



export type Iterator = (value: any,
  lodashPath: string,
  changeValueTo: (newValue) => void,
  options?: Models.AdditionalIteratorOptions

) => void
export class Helpers {

  public static get Walk() {
    const self = this;
    return {
      Object(json: Object, iterator: Iterator, optionsOrWalkGettersValue?: Models.StartIteratorOptions) {

        if (_.isUndefined(optionsOrWalkGettersValue)) {
          optionsOrWalkGettersValue = {}
        }

        (optionsOrWalkGettersValue as Models.InternalValues).hasIterator = _.isFunction(iterator)

        if (_.isUndefined(optionsOrWalkGettersValue.breadthWalk)) {
          optionsOrWalkGettersValue.breadthWalk = false;
        }

        let {
          circural
        } = self._walk(json, json, iterator, void 0, optionsOrWalkGettersValue as any)

        return { circs: circural }
      },
      ObjectBy(property: string, inContext: Object, iterator: Iterator, options?: Models.StartIteratorOptions) {
        if (_.isFunction(iterator)) {
          iterator(inContext, '', self._changeValue(inContext, property, true))
        }
        const json = inContext[property]
        return self.Walk.Object(json, iterator, options)
      }
    }
  }

  private static _changeValue(json: Object, lodahPath: string, simpleChange = false, options?: Models.InternalValues) {

    var { contextPath, property } = this._prepareParams(lodahPath);
    var context = _.get(json, contextPath);

    return (newValue: any) => {
      if (contextPath === '') {
        simpleChange = true;
      }

      if (simpleChange) {
        json[property] = newValue;
      } else {
        // console.log(`CONTEXT VALUE CHANGE!  "${contextPath}" + "${property}" `, newValue)
        // console.log('context', context)
        if (context) {
          context[property] = newValue;
        }
      }
      if (options) {
        options._valueChanged = true;
      }
    }
  }

  private static _prepareParams(lodashPath: string) {
    // console.log('contextPath before', lodashPath)
    const contextPath = this._Helpers.Path.getContextPath(lodashPath);
    // console.log('contextPath after', contextPath)

    let property = this._Helpers.Path.getPropertyPath(lodashPath, contextPath);
    // console.log('property after process', property)
    if (_.isString(property) && property.trim() !== '' && !_.isNaN(Number(property))) {
      property = Number(property)
    }
    return {
      contextPath, property
    }
  }

  private static get _Helpers() {
    return {
      get Path() {
        return {
          getPropertyPath(lodahPath, contetPath) {
            return (lodahPath
              .replace(contetPath, '')
              .replace(/^\./, '')
              .replace(/\[/, '')
              .replace(/\]/, ''))
          },
          getContextPath(p: string) {
            let res: string;
            if (p.endsWith(']')) {
              res = p.replace(/\[(\"|\')?[0-9]+(\"|\')?\]$/, '')
            } else {
              res = p.replace(/\.([a-zA-Z0-9]|\$|\_|\@|\-|\/|\:)+$/, '')
            }
            return res === p ? '' : res;
          }
        }
      }
    }
  }

  private static _shoudlReturn(include = [], exclude = [], lodashPath: string) {
    let res = false;
    if (lodashPath.replace(/^\[(\'|\")?[0-9]*(\'|\")?\]/, '').trim() !== '') {
      lodashPath = lodashPath.replace(/^\[(\'|\")?[0-9]*(\'|\")?\]\./, '')
      res = (
        (_.isArray(include) && include.length > 0
          && !include.find(p => lodashPath.startsWith(p)))
        ||
        (_.isArray(exclude) && exclude.length > 0
          && !!exclude.find(p => lodashPath.startsWith(p)))
      )
    }

    return res;
  }

  private static prepareOptions(options: Models.InternalValues, obj, lodashPath) {

    if (options._exit) {
      return;
    }

    if (_.isUndefined(options.walkGetters)) {
      options.walkGetters = true;
    }

    if (_.isUndefined(options.checkCircural)) {
      options.checkCircural = false;
    }

    if (_.isUndefined(options.isGetter)) {
      options.isGetter = false;
    }

    if (_.isUndefined(options._valueChanged)) {
      options._valueChanged = false;
    }

    if (_.isUndefined(options._exit)) {
      options._exit = false;
    }

    if (_.isUndefined(options.exit)) {
      options.exit = () => {
        options._exit = true;
      }
    }

    if (_.isUndefined(options._skip)) {
      options._skip = false;
    }

    if (_.isUndefined(options.skipObject)) {
      options.skipObject = () => {
        options._skip = true;
      }
    }

    if (options.checkCircural) {
      if (_.isUndefined(options.db)) {
        options.db = {}
      }

      if (_.isUndefined(options.stack)) {
        options.stack = []
      }

      if (_.isUndefined(options.circural)) {
        options.circural = []
      }
    }

    const { db, stack } = options;
    options.isCircural = false;

    if (options.checkCircural && _.isObject(obj)) {
      let indexValue = CLASS.OBJECT(obj).indexValue
      if (CLASS.OBJECT(obj).isClassObject && !_.isUndefined(indexValue)) {
        let className = CLASS.getNameFromObject(obj);
        let p = `${className}.id_${indexValue}`;
        const inDB: Models.InDBType = _.get(db, p);

        if (inDB && CLASS.OBJECT(inDB.target).isEqual(obj)) {
          const circ: Models.Circ = {
            pathToObj: lodashPath,
            circuralTargetPath: inDB.path
          }
          options.circural.push(circ)
          options.isCircural = true;
        } else {
          _.set(db, p, {
            path: lodashPath,
            target: obj
          } as Models.InDBType)
        }

      } else {
        const inStack = stack.find((c: Models.InDBType) => c.target == obj);

        if (!_.isUndefined(inStack)) {
          const circ: Models.Circ = {
            pathToObj: lodashPath,
            circuralTargetPath: inStack.path
          }
          options.circural.push(circ)
          options.isCircural = true;
        } else {
          stack.push({
            path: lodashPath,
            target: obj
          } as Models.InDBType);
        }

      }
    }
    return options;
  }

  private static _walk(json: Object, obj: Object, iterator: Iterator, lodashPath = '',
    options?: Models.InternalValues, depthLevel = 0) {

    if (!options) {
      options = {} as any;
    }

    if (!options.breadthWalk) {

      options = this.prepareOptions(options, obj, lodashPath)

      if (this._shoudlReturn(options.include, options.exclude, lodashPath)) {
        return;
      }

      if (options.hasIterator && lodashPath !== '') {
        iterator(obj, lodashPath, this._changeValue(json, lodashPath, false, options), options)
      }

      if (options._valueChanged) {
        obj = _.get(json, lodashPath)
      }
      options._valueChanged = false;

      if (options.isCircural) {
        options._skip = true;
      }

      if (options._skip) {
        options._skip = false;
        return
      }
    }



    if (options.breadthWalk) {

      let queue: Models.Ver[] = [{ v: json, p: lodashPath, parent: void 0 }];

      // const pathesToSkip = {};
      while (queue.length > 0) {

        const ver = queue.shift();
        // console.log(`pathes to skip`, pathesToSkip);
        // if (!_.isUndefined(Object.keys(pathesToSkip).find(key => ver.p.startsWith(pathesToSkip[key])))) {
        // console.log(`skip: ${ver.p}`)
        // continue;
        // }
        if (this._shoudlReturn(options.include, options.exclude, ver.p)) {
          // pathesToSkip[ver.p] = true;
          // console.log(`skip2: ${ver.p}`)
          continue;
        }

        // console.log(`not skip value ${ver.p}`)

        let { v, p } = ver;
        options = this.prepareOptions(options, v, p)

        if (options._exit) {
          console.log('EXIT')
          return options;
        }
        if (options.hasIterator && p !== '') {
          iterator(v, p, this._changeValue(json, p, false, options), options);
        }

        if (options._valueChanged) {
          ver.v = _.get(json, p);
        }
        options._valueChanged = false;

        if (options.isCircural) {
          // pathesToSkip[ver.p] = true;
          continue;
        }

        if (options._skip) {
          options._skip = false;
          // pathesToSkip[ver.p] = true;
          continue;
        }
        // console.log(`LOOK FOR CHILDREN OF ${ver.p}`)
        if (_.isArray(v)) {
          queue = queue.concat(findChildren(ver, p, options.walkGetters))
        } else if (_.isObject(v)) {
          queue = queue.concat(findChildren(ver, p, options.walkGetters))
        }
      }

    } else {
      const { walkGetters } = options;

      if (Array.isArray(obj)) {
        obj.forEach((o, i) => {
          this._walk(json, obj[i], iterator, `${lodashPath}[${i}]`, options, depthLevel + 1)
        })

      } else if (_.isObject(obj)) {
        const allKeys = !walkGetters ? [] : Object.getOwnPropertyNames(obj);
        for (const key in obj) {
          if (_.isObject(obj) && obj.hasOwnProperty(key)) {
            _.pull(allKeys, key)

            options.isGetter = false;
            this._walk(json, obj[key], iterator, `${(lodashPath === '') ? '' : `${lodashPath}.`}${key}`, options, depthLevel + 1)
          }
        }
        if (walkGetters) {
          for (let index = 0; index < allKeys.length; index++) {
            if (_.isObject(obj)) {
              const key = allKeys[index];

              options.isGetter = true;
              this._walk(json, obj[key], iterator, `${(lodashPath === '') ? '' : `${lodashPath}.`}${key}`, options, depthLevel + 1)
            }
          }
        }
      }

      if (options._exit && json === obj) {
        options._exit = false;
      }

    }

    return options;
  }

}

export const walk = {
  Object: Helpers.Walk.Object,
  ObjectBy: Helpers.Walk.ObjectBy
}
