import { _ } from 'tnp-core/src';

import { Circ, Models, Iterator, UnknownRecord, PropertyEntry, PreparedPath } from './models';

export class Helpers {
  public static get Walk() {
    const self = this;

    return {
      Object(
        json: object,
        iterator: Iterator,
        options: Models.StartIteratorOptions = {},
      ): {
        circs: Circ[] | undefined;
      } {
        const internalOptions = self.createInternalOptions(
          options,
          _.isFunction(iterator),
        );

        const result = self._walk(json, json, iterator, '', internalOptions);

        return {
          circs: result.circural,
        };
      },

      ObjectBy(
        property: string,
        inContext: object,
        iterator: Iterator,
        options: Models.StartIteratorOptions = {},
      ): {
        circs: Circ[] | undefined;
      } {
        const contextRecord = inContext as UnknownRecord;

        if (_.isFunction(iterator)) {
          iterator(inContext, '', self._changeValue(inContext, property, true));
        }

        const json = contextRecord[property];

        if (!self.isObjectLike(json)) {
          return {
            circs: undefined,
          };
        }

        return self.Walk.Object(json, iterator, options);
      },
    };
  }

  private static createInternalOptions(
    options: Models.StartIteratorOptions,
    hasIterator: boolean,
  ): Models.InternalValues {
    const internalOptions: Models.InternalValues = {
      ...options,

      walkGetters: options.walkGetters ?? true,
      checkCircural: options.checkCircural ?? false,
      breadthWalk: options.breadthWalk ?? false,

      include: options.include ?? [],
      exclude: options.exclude ?? [],

      isGetter: false,
      isCircural: false,

      hasIterator,

      _valueChanged: false,
      _skip: false,
      _exit: false,
    };

    internalOptions.skipObject = () => {
      internalOptions._skip = true;
    };

    internalOptions.exit = () => {
      internalOptions._exit = true;
    };

    if (internalOptions.checkCircural) {
      internalOptions.stack = [];
      internalOptions.circural = [];
    }

    return internalOptions;
  }

  private static _walk(
    json: object,
    currentValue: unknown,
    iterator: Iterator,
    lodashPath: string,
    options: Models.InternalValues,
  ): Models.InternalValues {
    if (options.breadthWalk) {
      return this.walkBreadthFirst(json, iterator, lodashPath, options);
    }

    this.walkDepthFirst(
      json,
      currentValue,
      iterator,
      lodashPath,
      options,
      false,
    );

    return options;
  }

  private static walkDepthFirst(
    json: object,
    currentValue: unknown,
    iterator: Iterator,
    lodashPath: string,
    options: Models.InternalValues,
    isGetter: boolean,
  ): void {
    if (options._exit) {
      return;
    }

    if (this.shouldSkipPath(options.include, options.exclude, lodashPath)) {
      return;
    }

    this.prepareCurrentValue(currentValue, lodashPath, options, isGetter);

    if (options._exit) {
      return;
    }

    if (options.hasIterator && lodashPath !== '') {
      iterator(
        currentValue,
        lodashPath,
        this._changeValue(json, lodashPath, false, options),
        options,
      );
    }

    if (options._exit) {
      return;
    }

    if (options._valueChanged) {
      currentValue = _.get(json, lodashPath);
      options._valueChanged = false;
    }

    if (options.isCircural) {
      options._skip = true;
    }

    if (options._skip) {
      options._skip = false;
      return;
    }

    const children = this.findChildren(
      currentValue,
      lodashPath,
      options.walkGetters ?? true,
    );

    for (const child of children) {
      if (options._exit) {
        return;
      }

      this.walkDepthFirst(
        json,
        child.value,
        iterator,
        child.path,
        options,
        child.isGetter,
      );
    }
  }

  private static walkBreadthFirst(
    json: object,
    iterator: Iterator,
    lodashPath: string,
    options: Models.InternalValues,
  ): Models.InternalValues {
    const queue: Models.Ver[] = [
      {
        v: json,
        p: lodashPath,
        isGetter: false,
      },
    ];

    while (queue.length > 0) {
      if (options._exit) {
        break;
      }

      const current = queue.shift();

      if (!current) {
        break;
      }

      if (this.shouldSkipPath(options.include, options.exclude, current.p)) {
        continue;
      }

      this.prepareCurrentValue(
        current.v,
        current.p,
        options,
        current.isGetter ?? false,
      );

      if (options._exit) {
        break;
      }

      if (options.hasIterator && current.p !== '') {
        iterator(
          current.v,
          current.p,
          this._changeValue(json, current.p, false, options),
          options,
        );
      }

      if (options._exit) {
        break;
      }

      if (options._valueChanged) {
        current.v = _.get(json, current.p);
        options._valueChanged = false;
      }

      if (options.isCircural) {
        continue;
      }

      if (options._skip) {
        options._skip = false;
        continue;
      }

      const children = this.findChildren(
        current.v,
        current.p,
        options.walkGetters ?? true,
      );

      for (const child of children) {
        queue.push({
          v: child.value,
          p: child.path,
          parent: current,
          isGetter: child.isGetter,
        });
      }
    }

    return options;
  }

  private static prepareCurrentValue(
    value: unknown,
    lodashPath: string,
    options: Models.InternalValues,
    isGetter: boolean,
  ): void {
    options.isGetter = isGetter;
    options.isCircural = false;

    if (!options.checkCircural || !this.isObjectLike(value)) {
      return;
    }

    const stack = options.stack ?? [];
    const circular = options.circural ?? [];

    options.stack = stack;
    options.circural = circular;

    const existing = stack.find(entry => entry.target === value);

    if (existing) {
      circular.push({
        pathToObj: lodashPath,
        circuralTargetPath: existing.path,
      });

      options.isCircural = true;
      return;
    }

    stack.push({
      target: value,
      path: lodashPath,
    });
  }

  private static findChildren(
    value: unknown,
    parentPath: string,
    walkGetters: boolean,
  ): Array<{
    value: unknown;
    path: string;
    isGetter: boolean;
  }> {
    if (Array.isArray(value)) {
      return value.map((child, index) => ({
        value: child,
        path: `${parentPath}[${index}]`,
        isGetter: false,
      }));
    }

    if (!this.isObjectLike(value)) {
      return [];
    }

    const entries = this.getPropertyEntries(value, walkGetters);

    return entries.map(entry => ({
      value: entry.value,
      path: this.appendPath(parentPath, entry.key),
      isGetter: entry.isGetter,
    }));
  }

  private static getPropertyEntries(
    object: object,
    walkGetters: boolean,
  ): PropertyEntry[] {
    const result: PropertyEntry[] = [];
    const handledKeys = new Set<string>();

    for (const key of Object.keys(object)) {
      const readResult = this.readProperty(object, key);

      if (!readResult.success) {
        continue;
      }

      handledKeys.add(key);

      result.push({
        key,
        value: readResult.value,
        isGetter: false,
      });
    }

    if (!walkGetters) {
      return result;
    }

    for (const key of Object.getOwnPropertyNames(object)) {
      if (handledKeys.has(key)) {
        continue;
      }

      const readResult = this.readProperty(object, key);

      if (!readResult.success) {
        continue;
      }

      handledKeys.add(key);

      result.push({
        key,
        value: readResult.value,
        isGetter: true,
      });
    }

    let prototype = Object.getPrototypeOf(object) as object | null;

    while (prototype && prototype !== Object.prototype) {
      const descriptors = Object.getOwnPropertyDescriptors(prototype);

      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (
          key === 'constructor' ||
          handledKeys.has(key) ||
          typeof descriptor.get !== 'function'
        ) {
          continue;
        }

        const readResult = this.readProperty(object, key);

        if (!readResult.success) {
          continue;
        }

        handledKeys.add(key);

        result.push({
          key,
          value: readResult.value,
          isGetter: true,
        });
      }

      prototype = Object.getPrototypeOf(prototype) as object | null;
    }

    return result;
  }

  private static readProperty(
    object: object,
    key: string,
  ):
    | {
        success: true;
        value: unknown;
      }
    | {
        success: false;
      } {
    try {
      return {
        success: true,
        value: Reflect.get(object, key),
      };
    } catch {
      return {
        success: false,
      };
    }
  }

  private static appendPath(parentPath: string, property: string): string {
    const propertyPath = this.propertyToPath(property);

    if (parentPath === '') {
      return propertyPath;
    }

    if (propertyPath.startsWith('[')) {
      return `${parentPath}${propertyPath}`;
    }

    return `${parentPath}.${propertyPath}`;
  }

  private static propertyToPath(property: string): string {
    /**
     * Preserve the old path format for keys that lodash can safely
     * interpret in dot notation.
     *
     * Only keys containing dots or brackets need quoted bracket syntax,
     * because those characters change the lodash path meaning.
     */
    if (
      property !== '' &&
      !property.includes('.') &&
      !property.includes('[') &&
      !property.includes(']')
    ) {
      return property;
    }

    return `[${JSON.stringify(property)}]`;
  }

  private static shouldSkipPath(
    include: string[] = [],
    exclude: string[] = [],
    lodashPath: string,
  ): boolean {
    const normalizedPath = this.normalizeRootArrayPath(lodashPath);

    if (normalizedPath === '') {
      return false;
    }

    const excluded = exclude.some(excludedPath =>
      this.isSamePathOrDescendant(normalizedPath, excludedPath),
    );

    if (excluded) {
      return true;
    }

    if (include.length === 0) {
      return false;
    }

    const includedOrRequiredParent = include.some(includedPath => {
      return (
        this.isSamePathOrDescendant(normalizedPath, includedPath) ||
        this.isAncestorPath(normalizedPath, includedPath)
      );
    });

    return !includedOrRequiredParent;
  }

  private static normalizeRootArrayPath(path: string): string {
    return path.replace(/^\[(?:'|")?\d+(?:'|")?\]\.?/, '').trim();
  }

  private static isSamePathOrDescendant(
    path: string,
    parentPath: string,
  ): boolean {
    return (
      path === parentPath ||
      path.startsWith(`${parentPath}.`) ||
      path.startsWith(`${parentPath}[`)
    );
  }

  private static isAncestorPath(
    possibleAncestor: string,
    path: string,
  ): boolean {
    return (
      path.startsWith(`${possibleAncestor}.`) ||
      path.startsWith(`${possibleAncestor}[`)
    );
  }

  private static _changeValue(
    json: object,
    lodashPath: string,
    simpleChange = false,
    options?: Models.InternalValues,
  ): (newValue: unknown) => void {
    const { contextPath, property } = this._prepareParams(lodashPath);

    return (newValue: unknown): void => {
      if (contextPath === '') {
        simpleChange = true;
      }

      if (simpleChange) {
        Reflect.set(json, property, newValue);
      } else {
        const context = _.get(json, contextPath);

        if (this.isObjectLike(context)) {
          Reflect.set(context, property, newValue);
        }
      }

      if (options) {
        options._valueChanged = true;
      }
    };
  }

  private static _prepareParams(lodashPath: string): PreparedPath {
    const contextPath = this._Helpers.Path.getContextPath(lodashPath);

    const rawProperty = this._Helpers.Path.getPropertyPath(
      lodashPath,
      contextPath,
    );

    const property =
      rawProperty.trim() !== '' && !Number.isNaN(Number(rawProperty))
        ? Number(rawProperty)
        : rawProperty;

    return {
      contextPath,
      property,
    };
  }

  private static get _Helpers() {
    return {
      get Path() {
        return {
          getPropertyPath(lodashPath: string, contextPath: string): string {
            return lodashPath
              .replace(contextPath, '')
              .replace(/^\./, '')
              .replace(/^\[/, '')
              .replace(/\]$/, '')
              .replace(/^["']|["']$/g, '');
          },

          getContextPath(path: string): string {
            let result: string;

            if (path.endsWith(']')) {
              result = path.replace(/\[(?:"|')?.+?(?:"|')?\]$/, '');
            } else {
              result = path.replace(/\.([a-zA-Z0-9_$@\-/:]+)$/, '');
            }

            return result === path ? '' : result;
          },
        };
      },
    };
  }

  private static isObjectLike(value: unknown): value is object {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    );
  }
}

export const walk = {
  Object: Helpers.Walk.Object,
  ObjectBy: Helpers.Walk.ObjectBy,
};
