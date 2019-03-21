
import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers';
// let counter = 0

export type InDBType = { target: any; path: string; };
export type Circ = { pathToObj: string; circuralTargetPath: string; };

export type Vertice = {
  value: any;
  path: string;
  level: number;
  isCircural?: boolean;
  isGetter?: boolean;
};

export interface StartIteratorOptions {
  walkGetters?: boolean;

  /**
   * Default in breadhTwalk
   */
  checkCircural?: boolean;
  breadthWalk?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface AdditionalIteratorOptions extends StartIteratorOptions {
  skipObject?: () => void;
  isGetter?: boolean;
  /**
   * Breadth walk will skip content of circural objects
   */
  isCircural?: boolean;
  exit?: () => void;

}

export interface InternalValues extends AdditionalIteratorOptions {
  db?: any;
  stack?: any[];
  circural?: Circ[];
  verticies?: Vertice[];
  hasIterator?: boolean;
  _skip: boolean;
  _exit: boolean;
}

export type Iterator = (value: any,
  lodashPath: string,
  changeValueTo: (newValue) => void,
  options?: AdditionalIteratorOptions

) => void
export class Helpers {

  public static get Walk() {
    const self = this;
    return {
      Object(json: Object, iterator: Iterator, optionsOrWalkGettersValue?: StartIteratorOptions) {

        if (_.isUndefined(optionsOrWalkGettersValue)) {
          optionsOrWalkGettersValue = {}
        }

        (optionsOrWalkGettersValue as InternalValues).hasIterator = _.isFunction(iterator)

        if (_.isUndefined(optionsOrWalkGettersValue.breadthWalk)) {
          optionsOrWalkGettersValue.breadthWalk = false;
        }

        let { circural, verticies, breadthWalk, hasIterator } = self._walk(json, json, iterator, void 0, optionsOrWalkGettersValue as any)
        if (breadthWalk) {
          const toSkip: string[] = []
          verticies = _.sortBy(verticies, ['level']);
          // console.log(verticies)
          for (let index = 0; index < verticies.length; index++) {
            const { value, path, isCircural, isGetter } = verticies[index];
            let exit = false;
            if (!_.isUndefined(toSkip.find(s => s.startsWith(path)))) {
              continue;
            }
            if (hasIterator) {
              iterator(value, path, self._changeValue(json, path),
                { isGetter, isCircural, skipObject: () => { toSkip.push(path) }, exit: () => { exit = true; } })
            }
            if (exit) {
              break;
            }
          }
        }
        return { circs: circural }
      },
      ObjectBy(property: string, inContext: Object, iterator: Iterator, options?: StartIteratorOptions) {
        if (_.isFunction(iterator)) {
          iterator(inContext, '', self._changeValue(inContext, property, true))
        }
        const json = inContext[property]
        return self.Walk.Object(json, iterator, options)
      }
    }
  }

  private static _changeValue(json: Object, lodahPath: string, simpleChange = false) {

    var { contextPath, property } = this._prepareParams(lodahPath);
    var context = _.get(json, contextPath);

    return (newValue: any) => {
      if (contextPath === '') {
        simpleChange = true;
      }

      if (simpleChange) {
        // console.log(`SIMPLE VALUE CHANGE!  "${contextPath}" + "${property}" `, newValue)
        json[property] = newValue;
      } else {
        // console.log(`CONTEXT VALUE CHANGE!  "${contextPath}" + "${property}" `, newValue)
        // console.log('context', context)
        if (context) {
          context[property] = newValue;
        }
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

  private static prepareOptions(options: InternalValues, obj, lodashPath) {
    if (!options) {
      options = {} as any;
    }

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

    if (_.isUndefined(options.verticies)) {
      options.verticies = []
    }

    const { db, stack } = options;
    options.isCircural = false;

    if (options.checkCircural && _.isObject(obj)) {
      let indexValue = CLASS.OBJECT(obj).indexValue
      if (CLASS.OBJECT(obj).isClassObject && !_.isUndefined(indexValue)) {
        let className = CLASS.getNameFromObject(obj);
        let p = `${className}.id_${indexValue}`;
        const inDB: InDBType = _.get(db, p);

        if (inDB && CLASS.OBJECT(inDB.target).isEqual(obj)) {
          const circ: Circ = {
            pathToObj: lodashPath,
            circuralTargetPath: inDB.path
          }
          options.circural.push(circ)
          options.isCircural = true;
        } else {
          _.set(db, p, {
            path: lodashPath,
            target: obj
          } as InDBType)
        }

      } else {
        const inStack = stack.find((c: InDBType) => c.target == obj);

        if (!_.isUndefined(inStack)) {
          const circ: Circ = {
            pathToObj: lodashPath,
            circuralTargetPath: inStack.path
          }
          options.circural.push(circ)
          options.isCircural = true;
        } else {
          stack.push({
            path: lodashPath,
            target: obj
          } as InDBType);
        }

      }
    }
    return options;
  }

  private static _walk(json: Object, obj: Object, iterator: Iterator, lodashPath = '',
    options?: InternalValues, depthLevel = 0) {
    // console.log(lodashPath)
    // if (counter++ === 50) {
    //   console.log('KURWA')
    //   process.exit(0)
    // }

    options = this.prepareOptions(options, obj, lodashPath)

    if (this._shoudlReturn(options.include, options.exclude, lodashPath)) {
      return;
    }

    if (lodashPath !== '') {
      if (options.breadthWalk) {
        options.verticies.push({
          level: depthLevel,
          path: lodashPath,
          isCircural: options.isCircural,
          isGetter: options.isGetter,
          value: obj
        })
      } else {
        if (options.hasIterator) {
          iterator(obj, lodashPath, this._changeValue(json, lodashPath), options)
        }
      }
    }

    if (options.isCircural) {
      if (options._skip) {
        options._skip = false;
      }
      return;
    }

    const { walkGetters, verticies } = options;
    if (options._skip) {
      options._skip = false;
      return
    }

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

    return options;
  }

}

export const walk = {
  Object: Helpers.Walk.Object,
  ObjectBy: Helpers.Walk.ObjectBy
}
