const getInnerName = name => `__${name}`;

class Context {
  constructor(context, ctxRef) {
    this.parentContext = null;
    this.childContext = null;

    const ctx = context.use();

    this.transformRef(ctxRef);

    if (ctx) {
      ctx.setChildContext(this);
    }

    context.set(this);
  }

  transformRef(ctxRef) {
    if (!ctxRef || typeof ctxRef !== 'object') {
      return;
    }

    for (const key in ctxRef) {
      if (Object.hasOwnProperty.call(ctxRef, key)) {
        this[getInnerName(key)] = ctxRef[key];
        this.addLookupProperty(key);
      }
    }
  }

  addLookupProperty(key) {
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

  lookup(key) {
    let ctx = this;

    do {
      if (ctx.hasOwnProperty(key)) {
        return ctx[key];
      }
      ctx = ctx.parentContext;
    } while (ctx);
  }

  setParentContext(parentContext) {
    this.parentContext = parentContext;
  }

  setChildContext(childContext) {
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

  const context = {
    use: () => storage.ctx,
    set: value => (storage.ctx = value),
    clear: () => {
      const ctx = context.use();
      if (ctx?.parentContext) {
        context.set(ctx.parentContext);
        ctx.parentContext.removeChildContext();
      } else {
        context.set(null);
      }
    },
    run: (ctxRef, fn) => {
      const ctx = new Context(context, ctxRef);

      let res;

      res = fn(ctx);

      context.clear();
      return res;
    },
  };

  return {
    use: context.use,
    run: context.run,
  };
};
