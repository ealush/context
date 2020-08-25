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

const getInnerName = (name: string): string => `__${name}`;

class Context {
  parentContext: Context | null = null;
  childContext: Context | null = null;
  [key: string]: any;

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
      ctx.setChildContext(this);
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
          )}\`. Context properties cannot be set directly. Use, use context.run() instead.`
        );
      },
    });
  }

  lookup(key: string) {
    let ctx: Context = this;

    do {
      if (ctx.hasOwnProperty(key)) {
        return ctx[key];
      }
      if (ctx.parentContext instanceof Context) {
        ctx = ctx.parentContext;
      }
    } while (ctx);
  }

  setParentContext(parentContext: Context) {
    if (this instanceof Context) {
      this.parentContext = parentContext;
    }
  }

  setChildContext(childContext: Context) {
    childContext.setParentContext(this);
    this.childContext = childContext;
  }

  removeChildContext() {
    this.childContext = null;
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

    if (!(ctx instanceof Context)) {
      return;
    }
    if (ctx?.parentContext) {
      set(ctx.parentContext);
      ctx.parentContext.removeChildContext();
    } else {
      set(null);
    }
  };
  const run = (ctxRef: TypeCTXRef, fn: ICTXFN) => {
    const queryableProperties = addQueryableProperties(ctxRef);
    const ctx = new Context({ set, use, queryableProperties }, ctxRef);

    let res;

    res = fn(ctx);

    clear();
    return res;
  };

  return {
    use,
    run,
  };
};

export default createContext;
