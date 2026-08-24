# True AES-256 Locking & Unlocking with qpdf

Replace the current browser-side password logic in **Protect PDF** and **Unlock PDF** with qpdf — the same engine desktop tools use — compiled to WebAssembly and run entirely inside the visitor's browser. Nothing is uploaded.

## What changes for users

**Protect PDF**
- Real AES-256 encryption (PDF 2.0 / R6), the standard banks, law firms and hospitals expect — not the lighter protection used today.
- Optional separate owner password, so you can allow opening but block editing.
- Permission checkboxes that actually take effect: printing (none / low-res / high-res), copying text, modifying, annotating, form filling, page assembly, accessibility extraction.
- A short "encryption strength" line on the result so people can see what was applied.

**Unlock PDF**
- Correct passwords now produce a genuinely decrypted, fully text-searchable PDF — including AES-256 files that today fall back to flattened page images.
- Owner-restriction-only files are unlocked with no password, as before.
- Clear, distinct messages for "password required", "wrong password" and "damaged file".
- The image-only fallback stays as a last resort, and still warns when it is used.

## Behaviour and safeguards

- The qpdf engine (~1.3 MB) loads only when someone actually clicks Protect or Unlock, so page load speed is unaffected. A "Preparing secure engine…" state covers that moment.
- If the engine fails to load (offline, blocked CDN, unsupported browser), the tools fall back to today's behaviour instead of erroring out, and say which method was used.
- Very large files are processed in a worker so the page never freezes; a progress indicator runs throughout.
- Passwords are never logged, stored, or sent anywhere.

## Copy and SEO updates

- Remove the "for AES-256 use a desktop app like Adobe Acrobat" caveat from Protect PDF — it no longer applies.
- Update both pages' FAQs, intro text and SEO sections to state AES-256 support, and keep existing keyword coverage intact.

## Technical notes

- Add `@neslinesli93/qpdf-wasm` (qpdf compiled to WASM, MIT/Apache-2.0, browser-ready). The `.wasm` binary is copied into `public/wasm/qpdf.wasm` and located via `locateFile` so no external CDN is required at runtime.
- New `src/lib/qpdf.ts`: lazy singleton loader (`noInitialRun`, MEMFS `/in` and `/out` dirs), plus `encryptPdf(bytes, opts)` and `decryptPdf(bytes, password)` helpers that write input to MEMFS, run `callMain`, read the output, and clean up. stderr is captured and mapped to typed errors (`QpdfPasswordError`, `QpdfCorruptError`) instead of leaking raw qpdf output.
- Encryption invocation: `--encrypt <user> <owner> 256 [--print=…] [--modify=…] [--extract=y|n] [--annotate=y|n] [--form=y|n] [--assemble=y|n] [--accessibility=y|n] --` with `--allow-insecure` only when an empty user password is deliberately chosen.
- Decryption invocation: `--password=<pw> --decrypt`, with `--password-mode=unicode` retried on failure for non-ASCII passwords.
- Run inside a dedicated web worker (`src/workers/qpdf.worker.ts`) with transferable `Uint8Array` payloads; main thread keeps a small typed promise-based RPC wrapper.
- `ProtectPdf.tsx` and `UnlockPdf.tsx` switch to the qpdf path first; existing `@cantoo/pdf-lib` and pdf.js rasterisation paths are kept strictly as fallbacks.
- Vite config: exclude the qpdf module from dependency pre-bundling so the Emscripten glue loads correctly, and ensure `fs`/`path` Node imports resolve to empty stubs in the browser build.
