import { _ } from 'tnp-core/src';

import { walk } from './lodash-walk-object';
import { Circ } from './models';

interface SerializedWithCircs<T = unknown> {
  data: T;
  circs: Circ[];
}

/**
 * Simulates backend/frontend transport preparation:
 *
 * 1. Find circular or repeated object references.
 * 2. Replace subsequent references with null.
 * 3. Return JSON-safe data and circular mapping.
 */
function serializeWithCircs<T>(
  input: T,
  options: {
    breadthWalk?: boolean;
    considerSharedObjects?: boolean;
  } = {},
): SerializedWithCircs {
  const circs =
    walk.Object(input as object, () => {}, {
      checkCircural: true,
      breadthWalk: options.breadthWalk ?? true,
      considerSharedObjects: options.considerSharedObjects ?? false,
      walkGetters: false,
    }).circs ?? [];

  /*
   * Clone using the mappings instead of JSON.stringify(input),
   * because the original object may contain real cycles.
   */
  const data: unknown = Array.isArray(input) ? [] : {};

  walk.Object(
    input as object,
    (value, lodashPath, _changeValue, iteratorOptions) => {
      if (iteratorOptions?.isCircural) {
        _.set(data as any, lodashPath, null);
        return;
      }

      /*
       * Setting an object value can temporarily copy a reference from the
       * original graph. Its children will subsequently be populated by
       * the walker. This mirrors the behavior in EntityProcess.send().
       */
      _.set(data as any, lodashPath, value);
    },
    {
      checkCircural: true,
      breadthWalk: options.breadthWalk ?? true,
      considerSharedObjects: options.considerSharedObjects ?? false,
      walkGetters: false,
    },
  );

  /*
   * Make the result truly transport-safe and independent from the source.
   * All repeated/circular locations should already be null.
   */
  const jsonSafeData = JSON.parse(JSON.stringify(data));

  return {
    data: jsonSafeData,
    circs,
  };
}

/**
 * Recreates object references after JSON transport.
 *
 * Important:
 * mappings must be restored in an order where the target path already exists.
 */
function restoreCircs<T>(transportedData: T, circs: Circ[]): T {
  for (const circ of circs) {
    const targetPath = circ.circuralTargetPath as string;

    const target =
      targetPath === '' ? transportedData : _.get(transportedData, targetPath);

    if (
      target === null ||
      (typeof target !== 'object' && typeof target !== 'function')
    ) {
      throw new Error(
        `Cannot restore reference "${circ.pathToObj}": ` +
          `target "${targetPath}" is not an object.`,
      );
    }

    _.set(transportedData as any, circ.pathToObj, target);
  }

  return transportedData;
}

function transportRoundTrip<T>(
  input: T,
  options: {
    breadthWalk?: boolean;
    considerSharedObjects?: boolean;
  } = {},
): {
  serialized: SerializedWithCircs;
  restored: T;
} {
  const serialized = serializeWithCircs(input, options);

  /*
   * Simulates sending body and header through HTTP.
   */
  const responseBody = JSON.parse(JSON.stringify(serialized.data)) as T;

  const responseHeader = JSON.parse(JSON.stringify(serialized.circs)) as Circ[];

  return {
    serialized,
    restored: restoreCircs(responseBody, responseHeader),
  };
}

describe('circular object transport', () => {
  it('throws when the circular target path is not an object', () => {
    const transported = {
      id: 1,
      invalidTarget: 'not-an-object',
      relation: null,
    };

    expect(() => {
      restoreCircs(transported, [
        {
          pathToObj: 'relation',
          circuralTargetPath: 'invalidTarget',
        },
      ]);
    }).toThrow(
      'Cannot restore reference "relation": ' +
        'target "invalidTarget" is not an object.',
    );
  });

  it('throws when the circular target path does not exist', () => {
    const transported = {
      id: 1,
      relation: null,
    };

    expect(() => {
      restoreCircs(transported, [
        {
          pathToObj: 'relation',
          circuralTargetPath: 'missing.path',
        },
      ]);
    }).toThrow(
      'Cannot restore reference "relation": ' +
        'target "missing.path" is not an object.',
    );
  });

  it('throws when the circular target is null', () => {
    const transported = {
      invalidTarget: null,
      relation: null,
    };

    expect(() => {
      restoreCircs(transported, [
        {
          pathToObj: 'relation',
          circuralTargetPath: 'invalidTarget',
        },
      ]);
    }).toThrow(
      'Cannot restore reference "relation": ' +
        'target "invalidTarget" is not an object.',
    );
  });

  it('treats an empty circular target path as the root object', () => {
    const transported = {
      id: 1,
      self: null as unknown,
    };

    const restored = restoreCircs(transported, [
      {
        pathToObj: 'self',
        circuralTargetPath: '',
      },
    ]);

    expect(restored.self).toBe(restored);
  });

  it('treats an empty circular target path as the root object', () => {
    const transported = {
      id: 1,
      self: null as unknown,
    };

    const restored = restoreCircs(transported, [
      {
        pathToObj: 'self',
        circuralTargetPath: '',
      },
    ]);

    expect(restored.self).toBe(restored);
  });

  describe('single object', () => {
    it('recreates a direct self-reference', () => {
      interface Entity {
        id: number;
        name: string;
        self?: Entity;
      }

      const input: Entity = {
        id: 1,
        name: 'root',
      };

      input.self = input;

      const { serialized, restored } = transportRoundTrip(input);

      expect(serialized.data).toEqual({
        id: 1,
        name: 'root',
        self: null,
      });

      expect(serialized.circs).toEqual([
        {
          pathToObj: 'self',
          circuralTargetPath: '',
        },
      ]);

      expect(restored.self).toBe(restored);
      expect(restored.self?.id).toBe(1);
    });

    it('recreates a nested child-to-parent reference', () => {
      interface Parent {
        id: number;
        child?: Child;
      }

      interface Child {
        id: number;
        parent: Parent;
      }

      const parent: Parent = {
        id: 1,
      };

      const child: Child = {
        id: 2,
        parent,
      };

      parent.child = child;

      const { serialized, restored } = transportRoundTrip(parent);

      expect(serialized.data).toEqual({
        id: 1,
        child: {
          id: 2,
          parent: null,
        },
      });

      expect(serialized.circs).toContainEqual({
        pathToObj: 'child.parent',
        circuralTargetPath: '',
      });

      expect(restored.child?.parent).toBe(restored);
      expect(restored.child?.parent.child).toBe(restored.child);
    });

    it('recreates a deeper cycle', () => {
      interface Node {
        id: string;
        next?: Node;
      }

      const first: Node = {
        id: 'first',
      };

      const second: Node = {
        id: 'second',
      };

      const third: Node = {
        id: 'third',
      };

      first.next = second;
      second.next = third;
      third.next = first;

      const { restored, serialized } = transportRoundTrip(first);

      expect(serialized.circs).toContainEqual({
        pathToObj: 'next.next.next',
        circuralTargetPath: '',
      });

      expect(restored.next?.next?.next).toBe(restored);
      expect(restored.next?.next?.next?.next).toBe(restored.next);
    });
  });

  describe('array of entities', () => {
    it('recreates a reference from the second object to the first', () => {
      interface Entity {
        id: number;
        related?: Entity;
      }

      const first: Entity = {
        id: 1,
      };

      const second: Entity = {
        id: 2,
        related: first,
      };

      const input = [first, second];

      const { serialized, restored } = transportRoundTrip(input);

      expect(serialized.data).toEqual([
        {
          id: 1,
        },
        {
          id: 2,
          related: null,
        },
      ]);

      expect(serialized.circs).toContainEqual({
        pathToObj: '[1].related',
        circuralTargetPath: '[0]',
      });

      expect(restored[1].related).toBe(restored[0]);
    });

    it('recreates bidirectional references between array elements', () => {
      interface Entity {
        id: number;
        other?: Entity;
      }

      const first: Entity = {
        id: 1,
      };

      const second: Entity = {
        id: 2,
      };

      first.other = second;
      second.other = first;

      const input = [first, second];

      const { serialized, restored } = transportRoundTrip(input);

      /*
       * Depending on traversal order, second may appear first under
       * [0].other and the root [1] occurrence may be replaced with null.
       */
      expect(serialized.circs.length).toBeGreaterThan(0);

      expect(restored[0].other).toBe(restored[1]);
      expect(restored[1].other).toBe(restored[0]);
    });

    it('handles an array element represented as null in the response body', () => {
      interface Entity {
        id: number;
        dependency?: Entity;
      }

      const first: Entity = {
        id: 1,
      };

      const second: Entity = {
        id: 2,
        dependency: first,
      };

      /*
       * first already contains second, so traversal can first encounter
       * second through first.dependency-like paths depending on graph shape.
       */
      first.dependency = second;

      const input = [first, second];

      const { serialized, restored } = transportRoundTrip(input);

      const rootArrayMapping = serialized.circs.find(
        circ => circ.pathToObj === '[1]',
      );

      if (rootArrayMapping) {
        expect((serialized.data as Array<unknown>)[1]).toBeNull();
      }

      expect(restored[0].dependency).toBe(restored[1]);
      expect(restored[1].dependency).toBe(restored[0]);
    });

    it('recreates several objects referencing the same array entity', () => {
      interface Entity {
        id: number;
        owner?: Entity;
      }

      const owner: Entity = {
        id: 1,
      };

      const firstChild: Entity = {
        id: 2,
        owner,
      };

      const secondChild: Entity = {
        id: 3,
        owner,
      };

      const input = [owner, firstChild, secondChild];

      const { serialized, restored } = transportRoundTrip(input);

      expect(serialized.circs).toEqual(
        expect.arrayContaining([
          {
            pathToObj: '[1].owner',
            circuralTargetPath: '[0]',
          },
          {
            pathToObj: '[2].owner',
            circuralTargetPath: '[0]',
          },
        ]),
      );

      expect(restored[1].owner).toBe(restored[0]);
      expect(restored[2].owner).toBe(restored[0]);
      expect(restored[1].owner).toBe(restored[2].owner);
    });
  });

  describe('shared object behavior', () => {
    it('restores shared references with default semantics', () => {
      const shared = {
        value: 123,
      };

      const input = {
        first: shared,
        second: shared,
        third: shared,
      };

      const { serialized, restored } = transportRoundTrip(input);

      expect(serialized.data).toEqual({
        first: {
          value: 123,
        },
        second: null,
        third: null,
      });

      expect(serialized.circs).toEqual([
        {
          pathToObj: 'second',
          circuralTargetPath: 'first',
        },
        {
          pathToObj: 'third',
          circuralTargetPath: 'first',
        },
      ]);

      expect(restored.second).toBe(restored.first);
      expect(restored.third).toBe(restored.first);
    });

    it('duplicates shared objects when considerSharedObjects is enabled', () => {
      const shared = {
        value: 123,
      };

      const input = {
        first: shared,
        second: shared,
      };

      const { serialized, restored } = transportRoundTrip(input, {
        considerSharedObjects: true,
        breadthWalk: false,
      });

      expect(serialized.circs).toEqual([]);

      expect(restored).toEqual({
        first: {
          value: 123,
        },
        second: {
          value: 123,
        },
      });

      /*
       * JSON transport creates two independent objects because no mapping
       * was emitted for the shared reference.
       */
      expect(restored.second).not.toBe(restored.first);
    });
  });

  describe('transport safety', () => {
    it('produces JSON-stringifiable body and headers', () => {
      interface Entity {
        id: number;
        parent?: Entity;
      }

      const input: Entity = {
        id: 1,
      };

      input.parent = input;

      const serialized = serializeWithCircs(input);

      expect(() => {
        JSON.stringify(serialized.data);
      }).not.toThrow();

      expect(() => {
        JSON.stringify(serialized.circs);
      }).not.toThrow();
    });

    it('does not retain references to the source graph', () => {
      interface Entity {
        id: number;
        self?: Entity;
      }

      const input: Entity = {
        id: 1,
      };

      input.self = input;

      const { restored } = transportRoundTrip(input);

      expect(restored).not.toBe(input);
      expect(restored.self).not.toBe(input);
      expect(restored.self).toBe(restored);
    });

    it('preserves primitive and null values', () => {
      interface Entity {
        id: number;
        text: string;
        enabled: boolean;
        nullable: null;
        optional?: string;
        self?: Entity;
      }

      const input: Entity = {
        id: 123,
        text: 'hello',
        enabled: false,
        nullable: null,
        optional: undefined,
      };

      input.self = input;

      const { restored } = transportRoundTrip(input);

      expect(restored.id).toBe(123);
      expect(restored.text).toBe('hello');
      expect(restored.enabled).toBe(false);
      expect(restored.nullable).toBeNull();

      /*
       * undefined is normally removed by JSON transport.
       */
      expect('optional' in restored).toBe(false);

      expect(restored.self).toBe(restored);
    });
  });
});
