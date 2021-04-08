function createContext<T extends Record<string, any>>(
  init?: (ctxRef: T, parentContext: T | void) => T | null
) {
  const storage: { ctx?: T; ancestry: T[] } = { ancestry: [] };

  return {
    run,
    bind,
    use,
  };

  function run(ctxRef: T, fn: (context: T) => any) {
    let parentContext = use();

    const out = {
      ...(parentContext ? parentContext : {}),
      ...(init?.(ctxRef, parentContext) ?? ctxRef),
    };

    const res = fn(set(Object.freeze(out)));

    clear();
    return res;
  }
  function bind(ctxRef: T, fn: (...args: any[]) => any, ...args: any[]) {
    return function(...runTimeArgs: any[]) {
      return run(ctxRef, function() {
        return fn(...args, ...runTimeArgs);
      });
    };
  }
  function use() {
    return storage.ctx;
  }

  function set(value: T): T {
    storage.ancestry.unshift(value);
    return (storage.ctx = value);
  }

  function clear() {
    storage.ancestry.shift();
    set(storage.ancestry[0] ?? null);
  }
}

export default createContext;
