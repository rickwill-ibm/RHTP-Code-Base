/**
 * pdf-extract.mjs — real text extraction from PDF policy documents.
 *
 * Uses pdfjs-dist (Mozilla's own, actively-maintained PDF.js) directly,
 * via its Node/legacy build entry point. No OCR — scanned/image-only PDFs
 * will yield little or no text, and callers should treat a too-short
 * result as a real failure rather than silently proceeding with an empty
 * policy.
 *
 * NOTE: an earlier version of this file used the `pdf-parse` package, which
 * bundles a long-abandoned pdf.js v1.10.100 (circa 2017). Testing surfaced a
 * real, serious bug in that bundled build: parsing a second PDF in the same
 * Node process could silently return the *previous* PDF's text instead of
 * the new one's — confirmed via direct, isolated reproduction (freshly
 * allocated, non-pooled buffers; unrelated to any buffer-aliasing issue on
 * our side). Getting a policy silently swapped for a different one is
 * exactly the kind of error a prior-authorization system can't risk, so
 * this was switched to pdfjs-dist directly and re-verified with a
 * multi-file stress test (parsing several distinct PDFs, repeated, in
 * varied order, all in one process) before shipping.
 */

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MIN_USABLE_CHARS = 100;

/**
 * extractPdfText — returns the plain-text contents of a PDF buffer.
 * Throws if the PDF can't be parsed or yields effectively no text (e.g. a
 * scanned image PDF with no embedded text layer).
 */
export async function extractPdfText(buffer) {
  // `new Uint8Array(typedArrayOrBuffer)` copies the bytes into a fresh,
  // independent ArrayBuffer (per the JS spec) rather than viewing the
  // original — cheap insurance against any buffer-pool aliasing regardless
  // of what the caller passed in (a multer upload buffer, a small
  // fs.readFileSync result pulled from Node's shared pool, etc).
  const bytes = new Uint8Array(buffer);

  let pdf;
  try {
    const loadingTask = getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true });
    pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      // pdf.js reports each text run with hasEOL: true when the PDF's layout
      // puts a line break after it — use that to reconstruct real line
      // breaks instead of flattening the whole page into one line, which
      // both reads better and keeps the "Label: value" header convention
      // (used by our .txt seeds) parseable when it appears in a PDF too.
      for (const item of content.items) {
        if (!("str" in item)) continue;
        fullText += item.str + (item.hasEOL ? "\n" : " ");
      }
      fullText += "\n";
    }

    const text = fullText.trim();
    if (text.length < MIN_USABLE_CHARS) {
      throw new Error(
        `PDF yielded almost no extractable text (${text.length} chars) — it may be a scanned image without a text layer, which this tool can't OCR.`
      );
    }
    return text;
  } catch (err) {
    if (err.message?.startsWith("PDF yielded almost no")) throw err;
    throw new Error(`Could not read PDF: ${err.message}`);
  } finally {
    // Release the parsed document's internal resources — don't leave
    // anything alive across calls in this long-running process.
    await pdf?.destroy();
  }
}
