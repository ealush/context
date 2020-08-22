export interface IContext {
  parentContext: IContext | null;
  childContext: IContext | null;
  [key: string]: any;

  lookup: (key: string) => IContext | void;
  setParentContext: (context: IContext) => void;
  setChildContext: (context: IContext) => void;
  removeChildContext: () => void;
}

export interface ICTXFN {
  (context: IContext): any;
}

export interface CTX {
  use(): IContext | void;
  runWith(ctxRef: Object, fn: ICTXFN): any;
}

type DefaultValueType = any | ICTXFN;

type LookupItem = string | { key: string; defaultValue: DefaultValueType };

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
        if (Object.hasOwnProperty.call(ctx, key)) {
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

  const runWith = (ctxRef: Object, fn: ICTXFN) => {
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
            return (this[key] =
              typeof lookupItem.defaultValue === 'function'
                ? lookupItem.defaultValue(use())
                : lookupItem.defaultValue);
          } else {
            return undefined;
          }
        }

        return parentContext[innerName];
      },
      set: function(value) {
        this[innerName] = value;
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
