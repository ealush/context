interface IContext {
  parentContext: IContext | null;
  childContext: IContext | null;
  [key: string]: any;

  lookup: (key: string) => any;
  setParentContext: (context: IContext) => void;
  setChildContext: (context: IContext) => void;
  removeChildContext: () => void;
}

export interface CTX {
  use(): IContext | void;
  runWith(ctxRef: Object, fn: (context: IContext) => any): any;
}

const createContext = ({ lookup = [] }: { lookup?: string[] } = {}): CTX => {
  const storage: {
    ctx?: IContext;
  } = {
    ctx: undefined,
  };

  class Context implements IContext {
    parentContext: IContext['parentContext'] = null;
    childContext: IContext['childContext'] = null;

    constructor(ctxRef: Object) {
      const ctx = use();
      Object.assign(this, ctxRef);
      if (ctx) {
        ctx.setChildContext(this);
      }

      set(this);
    }

    lookup(key: string): any {
      let ctx: IContext | null = this;
      do {
        if (ctx[key]) {
          return ctx[key];
        }
        ctx = ctx.parentContext;
      } while (ctx);
    }

    setParentContext(parentContext: IContext) {
      this.parentContext = parentContext;
    }

    setChildContext(childContext: IContext) {
      childContext.setParentContext(this);
      this.childContext = childContext;
    }

    removeChildContext() {
      this.childContext = null;
    }
  }

  const use = () => storage.ctx;

  const set = (value: any) => (storage.ctx = value);

  const clear = () => {
    const ctx = use();
    if (ctx?.parentContext) {
      set(ctx.parentContext);
      ctx.parentContext.removeChildContext();
    } else {
      set(null);
    }
  };

  const runWith = (ctxRef: Object, fn: (context: IContext) => any) => {
    const context = new Context(ctxRef);

    let res;

    try {
      res = fn(context);
    } catch {
      /*  */
    }
    clear();

    return res;
  };

  const addLookupProperty = (propertyName: string) => {
    const innerName = `__${propertyName}`;
    Object.defineProperty(Context.prototype, propertyName, {
      get: function() {
        return this.lookup([innerName]);
      },
      set: function(value) {
        return (this[innerName] = value);
      },
    });
  };

  (lookup || []).forEach(name => addLookupProperty(name));

  return {
    use,
    runWith,
  };
};

export default createContext;
