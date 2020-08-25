# Context

Simple utility that creates a multi-layerd context singleton.
It allows you to keep reference for shared variables, and access them later down in your function call.

It was built for [vest](https://github.com/ealush/vest) validations frameworks, but can be used in all sort of places.


```js
// myContext.js
import createContext from 'context';

export default createContext();
```

```js
// framework.js

import context from './myContext.js'

function suite(id, tests) {
  context.rn({suiteId: id}, () => tests());
  // ...
}

function group(name, groupTests) {
  const { suiteId } = context.use();

  context.rn({
    group: name
  }, () => groupTests());
}

function test(message, cb) {
  const { suiteId, group } = context.use();

  const testId = Math.random(); // 0.8418151199238901

  const testData = context.rn({test: testId}, () => cb())

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
        suiteId: 'some_id',
        childContext: {
          group: 'some_group_name'
        }
      }
     */

       test('blah blah', () => {
        /*
          context now is:
          {
            suiteId: 'some_id',
            childContext: {
              group: 'some_group_name',
              childContext: {
                test: 0.8418151199238901
              }
            }
          }
         */
       })

   });

});

```