import { walk } from './lodash-walk-object'; // adjust path

describe('Date traversal', () => {
  it('should visit Date property but should not walk inside Date object', () => {
    const date = new Date('2026-10-08T12:00:00.000Z');

    // Add enumerable property explicitly to prove that Date is not traversed.
    (date as any).customProperty = {
      nested: 'should-not-be-visited',
    };

    const input = {
      createdAt: date,
      name: 'test',
    };

    const visited: Array<{
      path: string;
      value: unknown;
    }> = [];

    walk.Object(input, (value, lodashPath) => {
      visited.push({
        path: lodashPath,
        value,
      });
    });

    expect(visited.map(v => v.path)).toEqual(['createdAt', 'name']);

    expect(visited[0].value).toBe(date);

    expect(visited.some(v => v.path.startsWith('createdAt.'))).toBe(false);
  });

  it('should treat nested Dates as leaf values', () => {
    const input = {
      user: {
        createdAt: new Date('2026-10-08T12:00:00.000Z'),
        profile: {
          updatedAt: new Date('2026-10-08T13:00:00.000Z'),
        },
      },
    };

    const paths: string[] = [];

    walk.Object(input, (_value, lodashPath) => {
      paths.push(lodashPath);
    });

    expect(paths).toEqual([
      'user',
      'user.createdAt',
      'user.profile',
      'user.profile.updatedAt',
    ]);
  });

  it('should treat Dates inside arrays as leaf values', () => {
    const date = new Date('2026-10-08T12:00:00.000Z');

    (date as any).shouldNotBeVisited = true;

    const input = {
      dates: [date, new Date('2026-10-09T12:00:00.000Z')],
    };

    const paths: string[] = [];

    walk.Object(input, (_value, lodashPath) => {
      paths.push(lodashPath);
    });

    expect(paths).toEqual(['dates', 'dates[0]', 'dates[1]']);

    expect(paths).not.toContain('dates[0].shouldNotBeVisited');
  });
});
