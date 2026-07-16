// import { walk } from "./lodash-walk-object";

// describe('circular reference semantics', () => {
//   it('does not report ordinary sibling objects as circular', () => {
//     const input = {
//       a: {
//         child: 1,
//       },
//       b: {
//         child: 2,
//       },
//     };

//     const result = walk.Object(input, () => {}, {
//       checkCircural: true,
//       walkGetters: false,
//     });

//     expect(result.circs).toEqual([]);
//   });

//   it('does not report a shared object in sibling branches as circular', () => {
//     const shared = {
//       child: 1,
//     };

//     const input = {
//       a: shared,
//       b: shared,
//     };

//     const visitedPaths: string[] = [];

//     const result = walk.Object(
//       input,
//       (_value, path) => {
//         visitedPaths.push(path);
//       },
//       {
//         checkCircural: true,
//         walkGetters: false,
//       },
//     );

//     expect(result.circs).toEqual([]);

//     expect(visitedPaths).toContain('a.child');
//     expect(visitedPaths).toContain('b.child');
//   });

//   it('does not report a deeply shared object as circular', () => {
//     const shared = {
//       value: 123,
//     };

//     const input = {
//       left: {
//         nested: shared,
//       },
//       right: {
//         nested: shared,
//       },
//     };

//     const result = walk.Object(input, () => {}, {
//       checkCircural: true,
//       walkGetters: false,
//     });

//     expect(result.circs).toEqual([]);
//   });

//   it('still detects a direct self-reference', () => {
//     const input: {
//       name: string;
//       self?: unknown;
//     } = {
//       name: 'root',
//     };

//     input.self = input;

//     const result = walk.Object(input, () => {}, {
//       checkCircural: true,
//       walkGetters: false,
//     });

//     expect(result.circs).toEqual([
//       {
//         pathToObj: 'self',
//         circuralTargetPath: '',
//       },
//     ]);
//   });

//   it('still detects a reference to an active ancestor', () => {
//     interface Parent {
//       name: string;
//       child?: Child;
//     }

//     interface Child {
//       name: string;
//       parent: Parent;
//     }

//     const parent: Parent = {
//       name: 'parent',
//     };

//     const child: Child = {
//       name: 'child',
//       parent,
//     };

//     parent.child = child;

//     const result = walk.Object(parent, () => {}, {
//       checkCircural: true,
//       walkGetters: false,
//     });

//     expect(result.circs).toContainEqual({
//       pathToObj: 'child.parent',
//       circuralTargetPath: '',
//     });
//   });

//   it('detects a cycle through several levels', () => {
//     interface Node {
//       name: string;
//       next?: Node;
//     }

//     const first: Node = {
//       name: 'first',
//     };

//     const second: Node = {
//       name: 'second',
//     };

//     const third: Node = {
//       name: 'third',
//     };

//     first.next = second;
//     second.next = third;
//     third.next = first;

//     const result = walk.Object(first, () => {}, {
//       checkCircural: true,
//       walkGetters: false,
//     });

//     expect(result.circs).toContainEqual({
//       pathToObj: 'next.next.next',
//       circuralTargetPath: '',
//     });
//   });

//   it('walks a shared object once for each non-circular path', () => {
//     const shared = {
//       nested: {
//         value: 123,
//       },
//     };

//     const input = {
//       first: shared,
//       second: shared,
//       third: shared,
//     };

//     const valuePaths: string[] = [];

//     walk.Object(
//       input,
//       (_value, path) => {
//         if (path.endsWith('.nested.value')) {
//           valuePaths.push(path);
//         }
//       },
//       {
//         checkCircural: true,
//         walkGetters: false,
//       },
//     );

//     expect(valuePaths).toEqual([
//       'first.nested.value',
//       'second.nested.value',
//       'third.nested.value',
//     ]);
//   });
// });

