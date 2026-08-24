/// <reference lib="webworker" />
/**
 * Dedicated worker that runs qpdf (compiled to WebAssembly) off the main
 * thread, so encrypting / decrypting large PDFs never freezes the UI.
 */

type RunRequest = {
  id: number;
  args: string[];
  input: Uint8Array;
};

type RunResponse =
  | { id: number; ok: true; output: Uint8Array; stderr: string; code: number }
  | { id: number; ok: false; error: string; stderr: string; code: number };

const IN = "/in.pdf";
const OUT = "/out.pdf";

let modulePromise: Promise<any> | null = null;
let stderrBuffer: string[] = [];

const wasmUrl = new URL("/wasm/qpdf.wasm", self.location.origin).toString();

async function getModule() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const mod = await import("@neslinesli93/qpdf-wasm");
      const createModule: any = (mod as any).default ?? mod;
      return await createModule({
        locateFile: () => wasmUrl,
        noInitialRun: true,
        print: (line: string) => stderrBuffer.push(line),
        printErr: (line: string) => stderrBuffer.push(line),
      });
    })().catch((e) => {
      modulePromise = null;
      throw e;
    });
  }
  return modulePromise;
}

const cleanup = (qpdf: any) => {
  for (const path of [IN, OUT]) {
    try {
      qpdf.FS.unlink(path);
    } catch {
      /* file may not exist */
    }
  }
};

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { id, args, input } = event.data;
  stderrBuffer = [];
  let qpdf: any;

  try {
    qpdf = await getModule();
  } catch (e: any) {
    const res: RunResponse = {
      id,
      ok: false,
      error: `ENGINE_LOAD_FAILED: ${e?.message || e}`,
      stderr: "",
      code: -1,
    };
    (self as unknown as Worker).postMessage(res);
    return;
  }

  let code = -1;
  try {
    cleanup(qpdf);
    qpdf.FS.writeFile(IN, input);
    code = qpdf.callMain(args);
  } catch (e: any) {
    // Emscripten throws ExitStatus for non-zero exits.
    if (typeof e?.status === "number") {
      code = e.status;
    } else {
      cleanup(qpdf);
      const res: RunResponse = {
        id,
        ok: false,
        error: e?.message || String(e),
        stderr: stderrBuffer.join("\n"),
        code,
      };
      (self as unknown as Worker).postMessage(res);
      return;
    }
  }

  // qpdf exit codes: 0 = success, 3 = success with warnings, 2 = error.
  let output: Uint8Array | null = null;
  if (code === 0 || code === 3) {
    try {
      output = qpdf.FS.readFile(OUT);
    } catch {
      output = null;
    }
  }
  cleanup(qpdf);

  if (output && output.byteLength > 0) {
    const copy = new Uint8Array(output);
    const res: RunResponse = {
      id,
      ok: true,
      output: copy,
      stderr: stderrBuffer.join("\n"),
      code,
    };
    (self as unknown as Worker).postMessage(res, [copy.buffer]);
  } else {
    const res: RunResponse = {
      id,
      ok: false,
      error: "QPDF_FAILED",
      stderr: stderrBuffer.join("\n"),
      code,
    };
    (self as unknown as Worker).postMessage(res);
  }
};

export {};
