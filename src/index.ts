
import * as _ from 'lodash';
export type Iterator = (value: any, lodashPath: string, changeValueTo: (newValue) => void, isGetter?: boolean) => void
export class Helpers {

  public static get Walk() {
    const self = this;
    return {
      Object(json: Object, iterator: Iterator, walkGetters = false) {
        self._walk(json, json, iterator, void 0, void 0, walkGetters)
      },
      ObjectBy(property: string, inContext: Object, iterator: Iterator, walkGetters = false) {
        iterator(inContext, '', self._changeValue(inContext, property, true))
        const json = inContext[property]
        self.Walk.Object(json, iterator, walkGetters)
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

  private static _walk(json: Object, obj: Object, iterator: Iterator, lodashPath = '', isGetter = false, walkGetters = false): void {
    if (lodashPath !== '') {
      iterator(obj, lodashPath, this._changeValue(json, lodashPath), isGetter)
    }
    if (Array.isArray(obj)) {
      obj.forEach((o, i) => {
        this._walk(json, o, iterator, `${lodashPath}[${i}]`, false, walkGetters)
      })

    } else if (_.isObject(obj)) {
      const allKeys = !walkGetters ? [] : Object.getOwnPropertyNames(obj);
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          _.pull(allKeys, key)
          const e = obj[key];
          this._walk(json, e, iterator, `${(lodashPath === '') ? '' : `${lodashPath}.`}${key}`, false, walkGetters)
        }
      }
      if (walkGetters) {
        for (let index = 0; index < allKeys.length; index++) {
          const key = allKeys[index];
          const e = obj[key];
          this._walk(json, e, iterator, `${(lodashPath === '') ? '' : `${lodashPath}.`}${key}`, true, walkGetters)
        }
      }
    }
  }



}


export const walk = {
  Object: Helpers.Walk.Object,
  ObjectBy: Helpers.Walk.ObjectBy
}

