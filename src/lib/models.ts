export namespace Models {

  export type InDBType = { target: any; path: string; };
  export type Circ = { pathToObj: string; circuralTargetPath: string; };


  // @ts-ignore
  export type Ver = { v: any; p: string; parent: Ver; isGetter?: boolean; }

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
    hasIterator?: boolean;
    _valueChanged: boolean;
    _skip: boolean;
    _exit: boolean;
  }
}
