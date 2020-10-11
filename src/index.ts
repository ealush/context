type TypeCTXRef = { [key: string]: any };

export interface ICTXFN {
  (context: Context): any;
}
interface Init {
  (ctxRef?: TypeCTXRef, parentContext?: Context | void): TypeCTXRef | null;
}

type ContextOptions = {
  use: () => Context | void;
  set: (value: any) => any;
  addQueryableProperties: (ctxRef: TypeCTXRef) => TQueryableProperties;
  init?: Init;
};

type TQueryableProperties = { [key: string]: true };

export type TCTX = {
  use: () => Context | void;
  run: (ctxRef: TypeCTXRef, fn: ICTXFN) => any;
  bind: (
    ctxRef: TypeCTXRef,
    fn: (...args: any[]) => any,
    ...args: any[]
  ) => (...runTimeArgs: any[]) => any;
};

const getInnerName = (name: string): string => `__${name}`;

class Context {
  private _parentContext: Context | null = null;
  [key: string]: any;

  static is(value: any): value is Context {
    return value instanceof Context;
  }

  constructor(
    { use, set, addQueryableProperties, init }: ContextOptions,
    ctxRef: TypeCTXRef
  ) {
    const ctx = use();

    const usedRef =
      typeof init === 'function' ? init(ctxRef, ctx) ?? ctxRef : ctxRef;

    const queryableProperties = addQueryableProperties(usedRef);

    if (usedRef && typeof usedRef === 'object') {
      for (const key in queryableProperties) {
        if (Object.prototype.hasOwnProperty.call(usedRef, key)) {
          this[getInnerName(key)] = usedRef[key];
        }
        this.addLookupProperty(key);
      }
    }

    if (ctx) {
      this.setParentContext(ctx);
    }

    set(this);
  }

  addLookupProperty(key: string) {
    const innerName = getInnerName(key);

    Object.defineProperty(this, key, {
      get() {
        return this.lookup(innerName);
      },
      set(value) {
        throw new Error(
          `Context: Unable to set "${key}" to \`${JSON.stringify(
            value
          )}\`. Context properties cannot be set directly. Use context.run() instead.`
        );
      },
    });
  }

  // @ts-ignore - we actually do use lookup
  private lookup(key: string) {
    let ctx: Context = this;
    do {
      if (ctx.hasOwnProperty(key)) {
        return ctx[key];
      }
      if (Context.is(ctx.parentContext)) {
        ctx = ctx.parentContext;
      } else {
        return;
      }
    } while (ctx);
  }

  private setParentContext(parentContext: Context) {
    if (Context.is(this)) {
      this._parentContext = parentContext;
    }
  }

  get parentContext(): Context | null {
    return this._parentContext;
  }
}

function createContext(init?: Init) {
  const storage = {
    ctx: undefined,
  };

  const queryableProperties: TQueryableProperties = {};

  function addQueryableProperties(ctxRef: TypeCTXRef): TQueryableProperties {
    if (!ctxRef || typeof ctxRef !== 'object') {
      return {};
    }

    for (const key in ctxRef) {
      if (Object.prototype.hasOwnProperty.call(ctxRef, key)) {
        queryableProperties[key] = true;
      }
    }

    return queryableProperties;
  }

  function use(): Context | void {
    return storage.ctx;
  }
  function set(value: any) {
    return (storage.ctx = value);
  }
  function clear() {
    const ctx = use();

    if (!Context.is(ctx)) {
      return;
    }

    set(ctx.parentContext);
  }
  function run(ctxRef: TypeCTXRef, fn: ICTXFN) {
    const ctx = new Context({ set, use, addQueryableProperties, init }, ctxRef);

    const res = fn(ctx);

    clear();
    return res;
  }

  function bind(
    ctxRef: TypeCTXRef,
    fn: (...args: any[]) => any,
    ...args: any[]
  ) {
    return function(...runTimeArgs: any[]) {
      return run(ctxRef, function() {
        return fn(...args, ...runTimeArgs);
      });
    };
  }

  return {
    use,
    run,
    bind,
  };
}

export default createContext;
