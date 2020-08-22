interface IContext {
  parentContext: IContext | null;
  childContext: IContext | null;
  [key: string]: any;

  lookup: (key: string) => IContext | void;
  setParentContext: (context: IContext) => void;
  setChildContext: (context: IContext) => void;
  removeChildContext: () => void;
}

export interface CTX {
  use(): IContext | void;
  runWith(ctxRef: Object, fn: (context: IContext) => any): any;
}

type LookupItem = string | { key: string; defaultValue: any };

const createContext = ({
  lookup = [],
}: { lookup?: LookupItem[] } = {}): CTX => {
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

    lookup(key: string): IContext | void {
      let ctx: IContext | null = this;
      do {
        if (ctx.hasOwnProperty(key)) {
          return ctx;
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

  const addLookupProperty = (lookupItem: LookupItem) => {
    let key: string;

    if (typeof lookupItem === 'string') {
      key = lookupItem;
    } else if (typeof lookupItem?.key === 'string') {
      key = lookupItem.key;
    } else {
      return;
    }

    if (!key) {
      return;
    }

    const innerName = `__${key}`;
    Object.defineProperty(Context.prototype, key, {
      get: function() {
        const parentContext = this.lookup(innerName);

        if (!parentContext) {
          if (
            lookupItem &&
            typeof lookupItem !== 'string' &&
            Object.hasOwnProperty.call(lookupItem, 'defaultValue')
          ) {
            this[innerName] = lookupItem.defaultValue;
            return this[key];
          } else {
            return;
          }
        }

        return parentContext[innerName];
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
