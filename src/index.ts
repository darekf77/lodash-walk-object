
import * as _ from 'lodash';
export type Iterator = (value: any, lodashPath: string, changeValueTo: (newValue) => void) => void
export class Helpers {

    public static get Walk() {
        const self = this;
        return {
            Object(json: Object, iterator: Iterator) {
                self._walk(json, json, iterator)
            },
            ObjectBy(property: string, inContext: Object, iterator: Iterator) {
                const json = inContext[property]
                iterator(inContext, '', self._changeValue(inContext, property))
                self.Walk.Object(json, iterator)
            }
        }
    }

    private static _changeValue(json: Object, lodahPath: string) {
        let { contextPath, property } = this._prepareParams(lodahPath);
        let context = _.get(json, contextPath);
        return function (newValue: any) {
            context[property] = newValue;
        }
    }

    private static _prepareParams(lodashPath: string) {
        const contextPath = this._Helpers.Path.getContextPath(lodashPath);
        let property = this._Helpers.Path.getPropertyPath(lodashPath, contextPath);
        if (!_.isNaN(Number(property))) {
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
                        if (p.endsWith(']')) {
                            return p.replace(/\[(\"|\')?[0-9]+(\"|\')?\]$/, '')
                        }
                        return p.replace(/\.[a-zA-Z0-9\_]+$/, '')
                    }
                }
            }
        }
    }

    private static _walk(json: Object, obj: Object, iterator: Iterator, lodashPath = ''): void {
        if (lodashPath !== '') {
            iterator(obj, lodashPath, this._changeValue(json, lodashPath))
        }
        if (Array.isArray(obj)) {
            obj.forEach((o, i) => {
                this._walk(json, o, iterator, `${lodashPath}[${i}]`)
            })

        } else if (_.isObject(obj)) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const e = obj[key];
                    this._walk(json, e, iterator, `${(lodashPath === '') ? '' : `${lodashPath}.`}${key}`)
                }
            }
        }
    }



}
