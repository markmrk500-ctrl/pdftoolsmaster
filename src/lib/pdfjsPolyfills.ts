// Must be imported before pdfjs-dist so older Safari/Android get these APIs
// before the PDF.js module evaluates.
if (typeof (Promise as any).withResolvers !== "function") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof (Array.prototype as any).at !== "function") {
  // eslint-disable-next-line no-extend-native
  (Array.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

if (typeof (String.prototype as any).replaceAll !== "function") {
  // eslint-disable-next-line no-extend-native
  (String.prototype as any).replaceAll = function (search: string | RegExp, replacement: string) {
    if (search instanceof RegExp) return this.replace(search, replacement);
    return this.split(search).join(replacement);
  };
}

if (typeof (globalThis as any).structuredClone !== "function") {
  (globalThis as any).structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
}