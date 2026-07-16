import { walk } from './lodash-walk-object'; // adjust path

describe('walk.Object', () => {
  describe('depth-first traversal', () => {
    it('walks nested objects using lodash paths', () => {
      const input = {
        user: {
          name: 'Darek',
          address: {
            city: 'Warsaw',
          },
        },
        active: true,
      };

      const visited: Array<[string, unknown]> = [];

      walk.Object(
        input,
        (value, path) => {
          visited.push([path, value]);
        },
        {
          walkGetters: false,
        },
      );

      expect(visited.map(([path]) => path)).toEqual([
        'user',
        'user.name',
        'user.address',
        'user.address.city',
        'active',
      ]);

      expect(visited).toContainEqual(['user.name', 'Darek']);
      expect(visited).toContainEqual(['user.address.city', 'Warsaw']);
      expect(visited).toContainEqual(['active', true]);
    });

    it('does not invoke the iterator for the root object', () => {
      const iterator = vi.fn();

      walk.Object(
        {
          first: 1,
          second: 2,
        },
        iterator,
        {
          walkGetters: false,
        },
      );

      expect(iterator).toHaveBeenCalledTimes(2);
      expect(iterator).not.toHaveBeenCalledWith(
        expect.anything(),
        '',
        expect.anything(),
        expect.anything(),
      );
    });

    it('walks arrays using bracket notation', () => {
      const input = {
        users: [
          {
            name: 'Alice',
          },
          {
            name: 'Bob',
          },
        ],
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toEqual([
        'users',
        'users[0]',
        'users[0].name',
        'users[1]',
        'users[1].name',
      ]);
    });

    it('walks a root array', () => {
      const input = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toEqual(['[0]', '[0].id', '[1]', '[1].id']);
    });
  });

  describe('breadth-first traversal', () => {
    it('walks objects level by level', () => {
      const input = {
        first: {
          nested: {
            value: 1,
          },
        },
        second: {
          value: 2,
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          breadthWalk: true,
          walkGetters: false,
        },
      );

      expect(paths).toEqual([
        'first',
        'second',
        'first.nested',
        'second.value',
        'first.nested.value',
      ]);
    });

    it('walks array elements level by level', () => {
      const input = {
        items: [
          {
            value: 1,
          },
          {
            value: 2,
          },
        ],
        footer: 'end',
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          breadthWalk: true,
          walkGetters: false,
        },
      );

      expect(paths).toEqual([
        'items',
        'footer',
        'items[0]',
        'items[1]',
        'items[0].value',
        'items[1].value',
      ]);
    });
  });

  describe('changing values', () => {
    it('changes a primitive object property', () => {
      const input = {
        user: {
          name: 'before',
        },
      };

      walk.Object(
        input,
        (_value, path, changeValueTo) => {
          if (path === 'user.name') {
            changeValueTo('after');
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(input.user.name).toBe('after');
    });

    it('changes an array element', () => {
      const input = {
        values: [10, 20, 30],
      };

      walk.Object(
        input,
        (_value, path, changeValueTo) => {
          if (path === 'values[1]') {
            changeValueTo(999);
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(input.values).toEqual([10, 999, 30]);
    });

    it('continues walking through a replacement object in depth-first mode', () => {
      const input: {
        node: number | { nested: string };
      } = {
        node: 123,
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path, changeValueTo) => {
          paths.push(path);

          if (path === 'node') {
            changeValueTo({
              nested: 'created during walk',
            });
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(input.node).toEqual({
        nested: 'created during walk',
      });

      expect(paths).toContain('node.nested');
    });

    it('can replace an entire nested object', () => {
      const input = {
        config: {
          oldValue: true,
        },
      };

      walk.Object(
        input,
        (_value, path, changeValueTo, options) => {
          if (path === 'config') {
            changeValueTo({
              newValue: true,
            });

            // Avoid depending on whether replacement children are traversed.
            options?.skipObject?.();
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(input.config).toEqual({
        newValue: true,
      });
    });
  });

  describe('skipObject()', () => {
    it('skips children of the current object', () => {
      const input = {
        publicData: {
          value: 1,
        },
        privateData: {
          password: 'secret',
          nested: {
            token: 'token',
          },
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path, _changeValueTo, options) => {
          paths.push(path);

          if (path === 'privateData') {
            options?.skipObject?.();
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toContain('privateData');
      expect(paths).not.toContain('privateData.password');
      expect(paths).not.toContain('privateData.nested');
      expect(paths).not.toContain('privateData.nested.token');

      expect(paths).toContain('publicData.value');
    });

    it('skips only the selected array element contents', () => {
      const input = {
        items: [
          {
            id: 1,
            details: 'first',
          },
          {
            id: 2,
            details: 'second',
          },
        ],
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path, _changeValueTo, options) => {
          paths.push(path);

          if (path === 'items[0]') {
            options?.skipObject?.();
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).not.toContain('items[0].id');
      expect(paths).not.toContain('items[0].details');

      expect(paths).toContain('items[1].id');
      expect(paths).toContain('items[1].details');
    });
  });

  describe('exit()', () => {
    it('stops depth-first traversal', () => {
      const input = {
        first: {
          value: 1,
        },
        stopHere: {
          value: 2,
        },
        shouldNotBeVisited: {
          value: 3,
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path, _changeValueTo, options) => {
          paths.push(path);

          if (path === 'stopHere') {
            options?.exit?.();
          }
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toContain('stopHere');
      expect(paths).not.toContain('stopHere.value');
      expect(paths).not.toContain('shouldNotBeVisited');
      expect(paths).not.toContain('shouldNotBeVisited.value');
    });

    it('stops breadth-first traversal', () => {
      const input = {
        first: {
          value: 1,
        },
        stopHere: {
          value: 2,
        },
        third: {
          value: 3,
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path, _changeValueTo, options) => {
          paths.push(path);

          if (path === 'stopHere') {
            options?.exit?.();
          }
        },
        {
          breadthWalk: true,
          walkGetters: false,
        },
      );

      expect(paths).toEqual(['first', 'stopHere']);
    });
  });

  describe('getters', () => {
    it('walks getters by default', () => {
      class Example {
        public regular = 'regular';

        public get calculated(): string {
          return 'getter value';
        }
      }

      const visited = new Map<
        string,
        {
          value: unknown;
          isGetter: boolean | undefined;
        }
      >();

      walk.Object(new Example(), (value, path, _changeValueTo, options) => {
        visited.set(path, {
          value,
          isGetter: options?.isGetter,
        });
      });

      expect(visited.get('regular')).toEqual({
        value: 'regular',
        isGetter: false,
      });

      expect(visited.get('calculated')).toEqual({
        value: 'getter value',
        isGetter: true,
      });
    });

    it('does not walk getters when walkGetters is false', () => {
      const getter = vi.fn(() => 'getter value');

      const input = {
        regular: 'regular',
      };

      Object.defineProperty(input, 'calculated', {
        enumerable: false,
        configurable: true,
        get: getter,
      });

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toEqual(['regular']);
      expect(getter).not.toHaveBeenCalled();
    });

    it('marks a non-enumerable value as getter-like when walking properties', () => {
      const input = {
        visible: true,
      };

      Object.defineProperty(input, 'hidden', {
        enumerable: false,
        configurable: true,
        value: 'hidden value',
      });

      const visited = new Map<string, boolean | undefined>();

      walk.Object(input, (_value, path, _changeValueTo, options) => {
        visited.set(path, options?.isGetter);
      });

      expect(visited.get('visible')).toBe(false);
      expect(visited.get('hidden')).toBe(true);
    });
  });

  describe('include option', () => {
    it('walks only included branches', () => {
      const input = {
        user: {
          name: 'Darek',
          address: {
            city: 'Warsaw',
          },
        },
        settings: {
          theme: 'dark',
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
          include: ['user'],
        },
      );

      expect(paths).toEqual([
        'user',
        'user.name',
        'user.address',
        'user.address.city',
      ]);
    });

    it('supports including a nested branch', () => {
      const input = {
        user: {
          name: 'Darek',
          address: {
            city: 'Warsaw',
            street: 'Example',
          },
        },
        settings: {
          theme: 'dark',
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
          include: ['user.address'],
        },
      );

      /*
       * This expectation documents the desirable behavior:
       * ancestors required to reach an included nested path should remain
       * traversable.
       *
       * The current _shoudlReturn implementation may fail this test because
       * "user" does not start with "user.address".
       */
      expect(paths).toEqual([
        'user',
        'user.address',
        'user.address.city',
        'user.address.street',
      ]);
    });
  });

  describe('exclude option', () => {
    it('excludes an entire branch', () => {
      const input = {
        user: {
          name: 'Darek',
          password: {
            hash: 'secret',
          },
        },
        settings: {
          theme: 'dark',
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
          exclude: ['user.password'],
        },
      );

      expect(paths).toContain('user');
      expect(paths).toContain('user.name');
      expect(paths).not.toContain('user.password');
      expect(paths).not.toContain('user.password.hash');
      expect(paths).toContain('settings.theme');
    });

    it('excludes multiple branches', () => {
      const input = {
        user: {
          password: 'secret',
          name: 'Darek',
        },
        metadata: {
          internal: true,
        },
        visible: {
          value: true,
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
          exclude: ['user.password', 'metadata'],
        },
      );

      expect(paths).not.toContain('user.password');
      expect(paths).not.toContain('metadata');
      expect(paths).not.toContain('metadata.internal');

      expect(paths).toContain('user.name');
      expect(paths).toContain('visible.value');
    });
  });

  describe('circular references', () => {
    it('detects a direct circular reference', () => {
      const input: {
        name: string;
        self?: unknown;
      } = {
        name: 'root',
      };

      input.self = input;

      const result = walk.Object(input, () => {}, {
        checkCircural: true,
        walkGetters: false,
      });

      expect(result.circs).toEqual([
        {
          pathToObj: 'self',
          circuralTargetPath: '',
        },
      ]);
    });

    it('detects a nested circular reference', () => {
      const parent: {
        name: string;
        child?: unknown;
      } = {
        name: 'parent',
      };

      const child = {
        name: 'child',
        parent,
      };

      parent.child = child;

      const result = walk.Object(parent, () => {}, {
        checkCircural: true,
        walkGetters: false,
      });

      expect(result.circs).toContainEqual({
        pathToObj: 'child.parent',
        circuralTargetPath: '',
      });
    });

    it('marks iterator options when the current object is circular', () => {
      const input: {
        nested?: unknown;
      } = {};

      input.nested = input;

      const circularPaths: string[] = [];

      walk.Object(
        input,
        (_value, path, _changeValueTo, options) => {
          if (options?.isCircural) {
            circularPaths.push(path);
          }
        },
        {
          checkCircural: true,
          walkGetters: false,
        },
      );

      expect(circularPaths).toEqual(['nested']);
    });

    it('does not recurse forever when circular checking is enabled', () => {
      const input: {
        value: number;
        self?: unknown;
      } = {
        value: 1,
      };

      input.self = input;

      const iterator = vi.fn();

      expect(() => {
        walk.Object(input, iterator, {
          checkCircural: true,
          walkGetters: false,
        });
      }).not.toThrow();

      expect(iterator.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('special values', () => {
    it('visits null without trying to traverse its children', () => {
      const input = {
        nullValue: null,
        nextValue: true,
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toEqual(['nullValue', 'nextValue']);
    });

    it('visits undefined values', () => {
      const input = {
        missing: undefined,
      };

      const visited: Array<[string, unknown]> = [];

      walk.Object(
        input,
        (value, path) => {
          visited.push([path, value]);
        },
        {
          walkGetters: false,
        },
      );

      expect(visited).toEqual([['missing', undefined]]);
    });

    it('visits functions as values', () => {
      const handler = (): string => 'result';

      const input = {
        handler,
      };

      const visited: Array<[string, unknown]> = [];

      walk.Object(
        input,
        (value, path) => {
          visited.push([path, value]);
        },
        {
          walkGetters: false,
        },
      );

      expect(visited).toEqual([['handler', handler]]);
    });

    it('walks keys containing dashes and dollar signs', () => {
      const input = {
        'some-key': {
          $value: 123,
        },
      };

      const paths: string[] = [];

      walk.Object(
        input,
        (_value, path) => {
          paths.push(path);
        },
        {
          walkGetters: false,
        },
      );

      expect(paths).toEqual(['some-key', 'some-key.$value']);
    });
  });
});

describe('walk.ObjectBy', () => {
  it('walks an object stored under a selected property', () => {
    const context = {
      metadata: 'untouched',
      data: {
        user: {
          name: 'Darek',
        },
      },
    };

    const paths: string[] = [];

    walk.ObjectBy(
      'data',
      context,
      (_value, path) => {
        paths.push(path);
      },
      {
        walkGetters: false,
      },
    );

    expect(paths).toEqual(['', 'user', 'user.name']);
  });

  it('allows replacing the selected root property', () => {
    const context: {
      data: {
        old?: boolean;
        replacement?: boolean;
      };
    } = {
      data: {
        old: true,
      },
    };

    walk.ObjectBy(
      'data',
      context,
      (_value, path, changeValueTo, options) => {
        if (path === '') {
          changeValueTo({
            replacement: true,
          });

          options?.skipObject?.();
        }
      },
      {
        walkGetters: false,
      },
    );

    expect(context.data).toEqual({
      replacement: true,
    });
  });

  it('does not modify unrelated context properties', () => {
    const context = {
      id: 123,
      data: {
        value: 'before',
      },
    };

    walk.ObjectBy(
      'data',
      context,
      (_value, path, changeValueTo) => {
        if (path === 'value') {
          changeValueTo('after');
        }
      },
      {
        walkGetters: false,
      },
    );

    expect(context).toEqual({
      id: 123,
      data: {
        value: 'after',
      },
    });
  });
});


