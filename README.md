# Context

Simple utility that creates a multi-layerd context singleton.
It allows you to keep reference for shared variables, and access them later down in your function call even if not declared in the same scope.

It was built for [vest](https://github.com/ealush/vest) validations frameworks, but can be used in all sort of places.

```js
// myContext.js
import createContext from 'context';

export default createContext();
```

```js
// framework.js

import context from './myContext.js';

function suite(id, tests) {
  context.run({ suiteId: id }, () => tests());
  // ...
}

function group(name, groupTests) {
  const { suiteId } = context.use();

  context.run(
    {
      group: name,
    },
    () => groupTests()
  );
}

function test(message, cb) {
  const { suiteId, group } = context.use();

  const testId = Math.random(); // 0.8418151199238901

  const testData = context.run({ test: testId }, () => cb());

  // ...
}

export { suite, group, test } from './framework';
```

```js
import testFramework from './framwork.js';

suite('some_id', () => {
  /*
    context now is:
    {
      suiteId: 'some_id'
    }
 */

  group('some_group_name', () => {
    /*
      context now is:
      {
        group: 'some_group_name',
        parentContext: {
          suiteId: 'some_id',
        }
      }
     */

    test('blah blah', () => {
      /*
          context now is:
          {
            test: 0.8418151199238901,
            parentContext: {
              group: 'some_group_name',
              parentContext: {
                suiteId: 'some_id',
              }
            }
          }
         */
    });
  });
});
```

## Binding a function with context

You can bind a function to a context with ctx.bind, this allows you to create a bound function that's when called - will be called with that bound context, even if not in the same scope anymore.

```js
const boundFunction = ctx.bind(ctxRef, fn, ...args);

boundFunction() // Will run with the context as if you run it directly within ctx.run();
```

## Context initialization

You can add an init function to your context creation. The init function will run every time you call context.run, to allow you to set in-flight keys to your context. It accepts two params - the provided ctxRef, and the parent context when nested.
