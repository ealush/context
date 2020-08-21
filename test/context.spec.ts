import createContext, { CTX } from '../src';

const typeSafeContext = (ctx: CTX) => {
  const context = ctx.use();
  if (!context) {
    throw new Error();
  }

  return context;
};

describe('createContext', () => {
  let ctx: CTX;

  beforeEach(() => {
    ctx = createContext({
      lookup: ['prop1', 'prop2', 'prop3'],
    });
  });

  it('Returns context interface', () => {
    expect(ctx).toMatchSnapshot();
  });

  it('should detfault context to undefined', () => {
    expect(ctx.use()).toBeUndefined();
  });

  it('Should create a new context when runWith is called', done => {
    ctx.runWith({}, () => {
      const context = ctx.use();

      if (context) {
        expect(context.constructor.name).toBe('Context');
        done();
      }
    });
  });

  it('Should pass current context as an argument to callback function', done => {
    ctx.runWith({}, context => {
      expect(ctx.use()).toBe(context);

      done();
    });
  });

  it('Should return the `runWith` execution result', () => {
    expect(ctx.runWith({}, () => 'some_value')).toBe('some_value');
  });

  it('Should add ctxRef properties to created context', done => {
    ctx.runWith(
      {
        word: 'test',
        number: 100,
        bool: false,
      },
      () => {
        expect(ctx.use()).toMatchObject({
          word: 'test',
          number: 100,
          bool: false,
        });
        done();
      }
    );
  });

  it('Should prefix lookup properties with __', done => {
    ctx.runWith(
      {
        word: 'test',
        prop1: 'example',
      },
      () => {
        expect(ctx.use()).toMatchObject({
          word: 'test',
          __prop1: 'example',
        });
        done();
      }
    );
  });

  it('Should initialize child and parent context with null', done => {
    ctx.runWith({}, () => {
      expect(ctx.use()).toMatchObject({
        childContext: null,
        parentContext: null,
      });
      done();
    });
  });

  it('Should lookup `lookup` properties on higher levels when not present on current level', () => {
    const control = jest.fn();
    ctx.runWith(
      {
        prop1: 'prop1__top_level',
        prop2: 'prop2__top_level',
        prop3: 'prop3__top_level',
        non_lookup: 'non_lookup_top_level',
      },
      () => {
        const context = typeSafeContext(ctx);

        expect(context.prop1).toBe('prop1__top_level');
        expect(context.prop2).toBe('prop2__top_level');
        expect(context.prop3).toBe('prop3__top_level');
        expect(context.non_lookup).toBe('non_lookup_top_level');

        control();
        ctx.runWith({}, () => {
          const context = typeSafeContext(ctx);

          expect(context.prop1).toBe('prop1__top_level');
          expect(context.prop2).toBe('prop2__top_level');
          expect(context.prop3).toBe('prop3__top_level');
          expect(context.non_lookup).toBeUndefined();
          control();
          ctx.runWith(
            {
              prop2: 'prop2__mid_level',
            },
            () => {
              const context = typeSafeContext(ctx);
              expect(context.prop1).toBe('prop1__top_level');
              expect(context.prop2).toBe('prop2__mid_level');
              expect(context.prop3).toBe('prop3__top_level');
              expect(context.non_lookup).toBeUndefined();
              control();
              ctx.runWith(
                {
                  prop1: 'prop1__low_level',
                },
                () => {
                  const context = typeSafeContext(ctx);
                  expect(context.prop1).toBe('prop1__low_level');
                  expect(context.prop2).toBe('prop2__mid_level');
                  expect(context.prop3).toBe('prop3__top_level');
                  expect(context.non_lookup).toBeUndefined();
                  control();
                }
              );
            }
          );
        });
      }
    );
    expect(control).toHaveBeenCalledTimes(4);
  });

  it('Should clear recent context level after completing its callback run', () => {
    const control = jest.fn();
    ctx.runWith({ prop1: 'prop1__top_level' }, () => {
      const context = typeSafeContext(ctx);
      ctx.runWith({ prop1: 'prop1__mid_level' }, () => {
        const context = typeSafeContext(ctx);
        ctx.runWith(
          {
            prop1: 'prop1__low_level',
          },
          () => {
            expect(typeSafeContext(ctx).prop1).toBe('prop1__low_level');
            control();
          }
        );

        // finished low level
        expect(typeSafeContext(ctx).prop1).toBe('prop1__mid_level');
        expect(typeSafeContext(ctx)).toBe(context);
        control();
      });

      // finished mid level
      expect(typeSafeContext(ctx).prop1).toBe('prop1__top_level');
      expect(typeSafeContext(ctx)).toBe(context);
      control();
    });
    expect(control).toHaveBeenCalledTimes(3);
  });

  it('Should catch thrown exceptions inside callback', () => {
    ctx.runWith({}, () => {
      throw new Error();
    });
  });

  it('Should add parent and child context references to each context object', done => {
    ctx.runWith({}, ctx1 => {
      ctx.runWith({}, ctx2 => {
        ctx.runWith({}, ctx3 => {
          ctx.runWith({}, ctx4 => {
            ctx.runWith({}, () => {
              expect(typeSafeContext(ctx).parentContext).toBe(ctx4);
              expect(ctx4.parentContext).toBe(ctx3);
              expect(ctx3.parentContext).toBe(ctx2);
              expect(ctx2.parentContext).toBe(ctx1);
              expect(ctx1.childContext).toBe(ctx2);
              expect(ctx2.childContext).toBe(ctx3);
              expect(ctx3.childContext).toBe(ctx4);
              expect(ctx4.childContext).toBe(typeSafeContext(ctx));

              expect(typeSafeContext(ctx)).toMatchSnapshot();
              done();
            });
          });
        });
      });
    });
  });

  it('Creates getters and setters for passed property names', () => {
    const ctx = createContext();

    console.log(ctx.use());
  });
});
