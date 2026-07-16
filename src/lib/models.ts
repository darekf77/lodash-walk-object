
export interface Circ {
  /**
   * Path whose value points to an already visited object.
   */
  pathToObj: string;

  /**
   * Lodash path of the original object.
   */
  circuralTargetPath: string | unknown;
}

export namespace Models {
  export interface InDBType {
    target: object;
    path: string;
  }

  export interface Ver {
    v: unknown;
    p: string;
    parent?: Ver;
    isGetter?: boolean;
  }

  export interface StartIteratorOptions {
    walkGetters?: boolean;

    /**
     * Circular checking is especially useful for breadth-first traversal.
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
     * Breadth walk skips the contents of circular objects.
     */
    isCircural?: boolean;

    exit?: () => void;
  }

  export interface InternalValues extends AdditionalIteratorOptions {
    stack?: InDBType[];
    circural?: Circ[];
    hasIterator?: boolean;

    _valueChanged: boolean;
    _skip: boolean;
    _exit: boolean;
  }
}

export type Iterator = (
  value: unknown,
  lodashPath: string,
  changeValueTo: (newValue: unknown) => void,
  options?: Models.AdditionalIteratorOptions,
) => void;

export type UnknownRecord = Record<PropertyKey, unknown>;

export interface PreparedPath {
  contextPath: string;
  property: string | number;
}

export interface PropertyEntry {
  key: string;
  value: unknown;
  isGetter: boolean;
}
