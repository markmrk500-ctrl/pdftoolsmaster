/**
 * Browser-side qpdf (WebAssembly) helpers for real AES-256 PDF encryption
 * and decryption. Everything runs locally in a worker — no uploads, and
 * passwords never leave the device.
 */

export class QpdfPasswordError extends Error {
  constructor(message = "The password is required or incorrect for this PDF.") {
    super(message);
    this.name = "QpdfPasswordError";
  }
}

export class QpdfCorruptError extends Error {
  constructor(message = "This file couldn't be read as a valid PDF.") {
    super(message);
    this.name = "QpdfCorruptError";
  }
}

export class QpdfUnavailableError extends Error {
  constructor(message = "The secure PDF engine couldn't be loaded.") {
    super(message);
    this.name = "QpdfUnavailableError";
  }
}

const IN = "/in.pdf";
const OUT = "/out.pdf";

type Pending = {
  resolve: (bytes: Uint8Array) => void;
  reject: (err: unknown) => void;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, Pending>();

const isPasswordStderr = (stderr: string) => {
  const s = stderr.toLowerCase();
  return (
    s.includes("invalid password") ||
    s.includes("incorrect password") ||
    s.includes("password is required") ||
    s.includes("encrypted with a password")
  );
};

function getWorker(): Worker {
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../workers/qpdf.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch (e) {
    throw new QpdfUnavailableError();
  }

  worker.onmessage = (event: MessageEvent<any>) => {
    const data = event.data;
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);

    if (data.ok) {
      entry.resolve(data.output as Uint8Array);
      return;
    }

    const stderr: string = data.stderr || "";
    if (typeof data.error === "string" && data.error.startsWith("ENGINE_LOAD_FAILED")) {
      entry.reject(new QpdfUnavailableError());
    } else if (isPasswordStderr(stderr)) {
      entry.reject(new QpdfPasswordError());
    } else {
      entry.reject(new QpdfCorruptError());
    }
  };

  worker.onerror = () => {
    for (const [, entry] of pending) entry.reject(new QpdfUnavailableError());
    pending.clear();
    worker?.terminate();
    worker = null;
  };

  return worker;
}

function run(args: string[], input: Uint8Array): Promise<Uint8Array> {
  const w = getWorker();
  const id = ++seq;
  const copy = new Uint8Array(input);
  return new Promise<Uint8Array>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, args, input: copy }, [copy.buffer]);
  });
}

/** Warm the engine up so the first real run feels instant. */
export function preloadQpdf(): void {
  try {
    getWorker();
  } catch {
    /* engine unavailable — callers fall back */
  }
}

export type PrintPermission = "none" | "low" | "full";

export type EncryptOptions = {
  userPassword: string;
  ownerPassword?: string;
  /** Allow printing, and at what fidelity. */
  print?: PrintPermission;
  /** Allow copying / extracting text and images. */
  copy?: boolean;
  /** Allow modifying page content. */
  modify?: boolean;
  /** Allow adding comments and annotations. */
  annotate?: boolean;
  /** Allow filling in form fields. */
  fillForms?: boolean;
  /** Allow inserting, deleting and rotating pages. */
  assemble?: boolean;
};

/**
 * Encrypt a PDF with 256-bit AES (PDF 2.0 / R6) and the requested permissions.
 */
export async function encryptPdf(
  bytes: ArrayBuffer | Uint8Array,
  opts: EncryptOptions
): Promise<Uint8Array> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const user = opts.userPassword ?? "";
  const owner = opts.ownerPassword?.trim() ? opts.ownerPassword : user;
  const yn = (v: boolean | undefined, fallback: boolean) =>
    (v ?? fallback) ? "y" : "n";

  const args = [
    "--encrypt",
    user,
    owner,
    "256",
    `--print=${opts.print ?? "full"}`,
    `--extract=${yn(opts.copy, false)}`,
    `--modify-other=${yn(opts.modify, false)}`,
    `--annotate=${yn(opts.annotate, false)}`,
    `--form=${yn(opts.fillForms, true)}`,
    `--assemble=${yn(opts.assemble, false)}`,
  ];
  if (!user) args.push("--allow-insecure");
  args.push("--", IN, OUT);

  return run(args, input);
}

/**
 * Fully decrypt a PDF: removes the open password (when supplied) and all
 * owner restrictions, keeping the text layer searchable.
 */
export async function decryptPdf(
  bytes: ArrayBuffer | Uint8Array,
  password = ""
): Promise<Uint8Array> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const base = ["--decrypt", "--", IN, OUT];

  try {
    return await run(password ? [`--password=${password}`, ...base] : base, input);
  } catch (e) {
    // Retry with explicit Unicode password handling for non-ASCII passwords.
    if (password && e instanceof QpdfPasswordError && /[^\x20-\x7E]/.test(password)) {
      return run(
        [`--password=${password}`, "--password-mode=unicode", ...base],
        input
      );
    }
    throw e;
  }
}

/** True when the PDF needs a password just to open it. */
export async function needsOpenPassword(
  bytes: ArrayBuffer | Uint8Array
): Promise<boolean> {
  try {
    await decryptPdf(bytes, "");
    return false;
  } catch (e) {
    return e instanceof QpdfPasswordError;
  }
}
