import type { Locale } from "@/lib/types";

/**
 * OCR runs in the browser through tesseract.js 5.1.1.
 *
 * The npm package supplies the API. The worker, the WebAssembly core, and
 * the language data are loaded from jsDelivr at these pinned versions.
 * tesseract.js builds one language URL per code only when `langPath` is
 * left empty, because each language is its own package:
 *   https://cdn.jsdelivr.net/npm/@tesseract.js-data/<lang>/4.0.0_best_int
 *
 * The image and the recognized text stay in the browser. The CDN receives
 * a request for the engine files, not for the message.
 */
export const TESSERACT_VERSION = "5.1.1";
export const TESSERACT_LANG_DATA = "4.0.0_best_int";

export const TESSERACT_PATHS = {
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${TESSERACT_VERSION}/dist/worker.min.js`,
  corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@v${TESSERACT_VERSION}`,
} as const;

export const OCR_LANG_BY_LOCALE: Record<Locale, "eng" | "ara" | "spa"> = {
  en: "eng",
  ar: "ara",
  es: "spa",
};

export type OcrLang = "eng" | "ara" | "spa" | "eng+ara+spa";

interface OcrWorker {
  recognize: (image: Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

interface TesseractApi {
  createWorker: (
    langs: string,
    oem: number,
    options: {
      workerPath: string;
      corePath: string;
      logger: (message: { status: string; progress: number }) => void;
    },
  ) => Promise<OcrWorker>;
  OEM: { LSTM_ONLY: number };
}

function asApi(value: unknown): TesseractApi {
  const record = value as TesseractApi & { default?: TesseractApi };
  if (typeof record.createWorker === "function") return record;
  if (record.default && typeof record.default.createWorker === "function") return record.default;
  throw new Error("Could not load the OCR engine.");
}

export async function recognizeImage(
  image: Blob,
  lang: OcrLang,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const api = asApi(await import("tesseract.js"));
  const worker = await api.createWorker(lang, api.OEM.LSTM_ONLY, {
    workerPath: TESSERACT_PATHS.workerPath,
    corePath: TESSERACT_PATHS.corePath,
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  try {
    const result = await worker.recognize(image);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}
