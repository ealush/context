export function createContext<T extends Record<string, any>>(
  init?: (ctxRef: T, parentContext: T | void) => T | null
) {
  const storage: { ctx?: T; ancestry: T[] } = { ancestry: [] };

  return {
    run,
    bind,
    use,
  };

  function run<R>(ctxRef: T, fn: (context: T) => R): R {
    const parentContext = use();

    const out = {
      ...(parentContext ? parentContext : {}),
      ...(init?.(ctxRef, parentContext) ?? ctxRef),
    };

    const ctx = set(Object.freeze(out));
    storage.ancestry.unshift(ctx);
    const res = fn(ctx);

    clear();
    return res;
  }

  function bind<R>(ctxRef: T, fn: (...args: any[]) => R, ...args: any[]) {
    return function(...runTimeArgs: any[]) {
      return run<R>(ctxRef, function() {
        return fn(...args, ...runTimeArgs);
      });
    };
  }

  function use() {
    return storage.ctx;
  }

  function set(value: T): T {
    return (storage.ctx = value);
  }

  function clear() {
    storage.ancestry.shift();
    set(storage.ancestry[0] ?? null);
  }
}
