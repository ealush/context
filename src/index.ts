type TypeCTXRef = { [key: string]: any };

export interface ICTXFN {
  (context: Context): any;
}

type ContextOptions = {
  use: () => Context | void;
  set: (value: any) => any;
  queryableProperties: TQueryableProperties;
};

type TQueryableProperties = { [key: string]: true };

export type TCTX = {
  use: () => Context | void;
  run: (ctxRef: TypeCTXRef, fn: ICTXFN) => any;
};

const getInnerName = (name: string): string => `__${name}`;

class Context {
  private _parentContext: Context | null = null;
  [key: string]: any;

  static is(value: any): value is Context {
    return value instanceof Context;
  }

  constructor(
    { use, set, queryableProperties }: ContextOptions,
    ctxRef: TypeCTXRef
  ) {
    const ctx = use();

    if (ctxRef && typeof ctxRef === 'object') {
      for (const key in queryableProperties) {
        if (Object.prototype.hasOwnProperty.call(ctxRef, key)) {
          this[getInnerName(key)] = ctxRef[key];
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
      if (Context.is(ctx._parentContext)) {
        ctx = ctx._parentContext;
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

const createContext = () => {
  const storage = {
    ctx: undefined,
  };

  const queryableProperties: TQueryableProperties = {};

  const addQueryableProperties = (ctxRef: TypeCTXRef): TQueryableProperties => {
    if (!ctxRef || typeof ctxRef !== 'object') {
      return {};
    }

    for (const key in ctxRef) {
      if (Object.prototype.hasOwnProperty.call(ctxRef, key)) {
        queryableProperties[key] = true;
      }
    }

    return queryableProperties;
  };

  const use = (): Context | void => storage.ctx;
  const set = (value: any) => (storage.ctx = value);
  const clear = () => {
    const ctx = use();

    if (!Context.is(ctx)) {
      return;
    }

    set(ctx.parentContext);
  };
  const run = (ctxRef: TypeCTXRef, fn: ICTXFN) => {
    const queryableProperties = addQueryableProperties(ctxRef);
    const ctx = new Context({ set, use, queryableProperties }, ctxRef);

    const res = fn(ctx);

    clear();
    return res;
  };

  return {
    use,
    run,
  };
};

export default createContext;
