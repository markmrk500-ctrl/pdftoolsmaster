import "./pdfjsPolyfills";

// Centralized pdfjs-dist setup using the legacy build for maximum
// browser compatibility (iOS Safari, Samsung Internet, older Android Chrome).
// All AI tools that parse PDFs should import from here.

// Polyfill Promise.withResolvers for older iOS Safari (<17.4) and older
// Android Chrome — pdfjs-dist v4 legacy build calls it internally and
// throws "undefined is not a function (near '...i of t...')" without it.
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

// Polyfill Array.prototype.at (iOS Safari <13.4) just in case it's used.
if (typeof (Array.prototype as any).at !== "function") {
  // eslint-disable-next-line no-extend-native
  (Array.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// Small polyfills used by pdf.js and markdown rendering on older mobile WebKit.
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

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
