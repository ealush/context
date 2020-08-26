import createContext, { TCTX } from '../src';

const typeSafeContext = (ctx: TCTX) => {
  const context = ctx.use();
  if (!context) {
    throw new Error();
  }
  return context;
};

describe('Context', () => {
  let ctx: TCTX;

  beforeEach(() => {
    ctx = createContext();
  });
  describe('createContext', () => {
    it('Should return a new context on each run', () => {
      expect(createContext()).not.toBe(createContext());
    });

    it('Should return all methods', () => {
      expect(createContext()).toMatchSnapshot();
    });
  });

  describe('Context.run', () => {
    it('Should create a new context instance', () => {
      const top = ctx.use();

      ctx.run({}, () => {
        expect(ctx.use()).not.toBe(top);
      });
    });

    it('Should pass current context as second argument', () => {
      ctx.run({}, context => {
        expect(ctx.use()).toBe(context);
      });
    });

    it('Adds provided `ctxref` properties to current context level', () => {
      ctx.run(
        {
          id: 55,
          user: 'boomsa',
        },
        () => {
          expect(typeSafeContext(ctx).id).toBe(55);
          expect(typeSafeContext(ctx).user).toBe('boomsa');
        }
      );
    });

    it('Returns undefined when property is not in context', () => {
      ctx.run(
        {
          id: 55,
        },
        () => {
          expect(typeSafeContext(ctx).id).toBe(55);
          expect(typeSafeContext(ctx).user).toBeUndefined();
        }
      );
    });

    it('Should clear context after callback run', () => {
      expect(ctx.use()).toBeUndefined();
      ctx.run({}, () => {
        expect(ctx.use()).toMatchSnapshot();
      });
      expect(ctx.use()).toBeNull();
    });

    describe('Context nesting', () => {
      it('Should refer to closest defined value', () => {
        ctx.run(
          {
            id: 99,
            name: 'watermelonbunny',
          },
          () => {
            expect(typeSafeContext(ctx).id).toBe(99);
            expect(typeSafeContext(ctx).name).toBe('watermelonbunny');

            ctx.run(
              {
                name: 'Emanuelle',
                color: 'blue',
              },
              () => {
                expect(typeSafeContext(ctx).id).toBe(99);
                expect(typeSafeContext(ctx).name).toBe('Emanuelle');
                expect(typeSafeContext(ctx).color).toBe('blue');

                ctx.run({}, () => {
                  expect(typeSafeContext(ctx).id).toBe(99);
                  expect(typeSafeContext(ctx).name).toBe('Emanuelle');
                  expect(typeSafeContext(ctx).color).toBe('blue');
                });
              }
            );
          }
        );
      });

      it('Should return previous context value after nested context run', () => {
        ctx.run(
          {
            id: 99,
            name: 'watermelonbunny',
          },
          () => {
            ctx.run(
              {
                name: 'Emanuelle',
                color: 'blue',
              },
              () => {
                ctx.run({}, () => null);
                expect(typeSafeContext(ctx).id).toBe(99);
                expect(typeSafeContext(ctx).name).toBe('Emanuelle');
                expect(typeSafeContext(ctx).color).toBe('blue');
              }
            );
            expect(typeSafeContext(ctx).id).toBe(99);
            expect(typeSafeContext(ctx).name).toBe('watermelonbunny');
          }
        );
      });
    });
  });
});
