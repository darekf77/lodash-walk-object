import { TaonBaseClass } from 'taon/src';

import { walk } from './lodash-walk-object';

export async function startCli(
  argsv: string[],
  filename: string,
): Promise<void> {
  //#region @backendFunc
  console.log('Hello from cli');

  class Book extends TaonBaseClass<Book> {
    declare name?: string;
  }

  class BookExtended extends Book {
    declare title?: string;
  }

  const books = [
    new Book().clone({ name: 'book1' }),
    new Book().clone({ name: 'book2' }),
    new BookExtended().clone({
      name: 'book extended',
    }),
    {
      booking: [
        new Book().clone({ name: 'book12' }),
        new Book().clone({ name: 'book32' }),
      ]
    }
  ];

  walk.Object(
    books,
    (v, lodashPath, changeValue) => {
      console.log({ lodashPath });
    },
    {
      walkGetters: false,
    },
  );

  process.exit(0);
  //#endregion
}

export default startCli;
