import { DependencyList, useCallback } from 'react';

type Callback = (...args: never[]) => unknown;

interface CallbackRecord {
  version: number;
  callback: Callback;
  proxied: Callback;
  deps: DependencyList;
}
const callbackMap = new Map<string | symbol, CallbackRecord>();

function proxyCallback<T extends Callback>(name: string|symbol, version: number, callback: T): T {
  return ((...args: never[]): unknown => {
    console.log(`invoke callback ${String(name)} v${version}`);
    return callback(...args);
  }) as T;
}

export function useCallbackDebug<T extends Callback>(name: string | symbol, callback: T, deps: DependencyList): T {
  const result = useCallback(callback, deps);
  let record = callbackMap.get(name);
  if (!record || record.callback !== result) {
    const prevDeps = record && record.deps;
    const newVersion = record ? record.version + 1 : 1;
    record = {
      version: newVersion,
      callback: result,
      deps,
      proxied: proxyCallback(name, newVersion, result),
    };
    console.log(`update callback ${String(name)} to v${record.version}, deps/prevDeps:`, deps, prevDeps);
    callbackMap.set(name, record);
  }
  return record.proxied as T;
}
