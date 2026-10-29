"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HighlightedText } from "@/components/HighlightedText";
import { LensMark } from "@/components/LensMark";
import { ScoreRing } from "@/components/ScoreRing";
import { translate, type MessageKey } from "@/lib/i18n";
import { OCR_LANG_BY_LOCALE, type OcrLang } from "@/lib/ocr";
import { SAMPLE_LABEL_KEYS, SAMPLES } from "@/lib/samples";
import { analyzeMessage } from "@/lib/score";
import type { Analysis, HighlightCategory, Locale } from "@/lib/types";

export const MAX_MESSAGE_CHARS = 20_000;

const LANGUAGE_BUTTONS: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
  { id: "es", label: "Español" },
];

const CATEGORY_ORDER: HighlightCategory[] = [
  "urgency",
  "payment",
  "prize",
  "credentials",
  "impersonation",
  "link",
];

function quote(text: string, start: number, end: number): string {
  const raw = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (raw.length <= 90) return raw;
  return `${raw.slice(0, 87)}…`;
}

export function Analyzer() {
  const messageId = useId();
  const ocrLangId = useId();
  const fileId = useId();
  const resultRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusResult = useRef(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ocrLang, setOcrLang] = useState<OcrLang>("eng");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  function chooseLocale(next: Locale) {
    setLocale(next);
    setOcrLang(OCR_LANG_BY_LOCALE[next]);
  }

  useEffect(() => {
    if (!shouldFocusResult.current || !analysis) return;
    resultRef.current?.focus();
    shouldFocusResult.current = false;
  }, [analysis]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function t(key: MessageKey, params?: Record<string, string>) {
    return translate(locale, key, params);
  }

  function publish(nextText: string, sampleId: string | null) {
    const clipped = nextText.slice(0, MAX_MESSAGE_CHARS);
    setText(clipped);
    setActiveSample(sampleId);
    setError(null);
    setNotice(
      nextText.length > MAX_MESSAGE_CHARS
        ? t("ocr.truncated", { limit: String(MAX_MESSAGE_CHARS) })
        : null,
    );
    if (!clipped.trim()) {
      setAnalysis(null);
      setError(t("error.empty"));
      return;
    }
    shouldFocusResult.current = true;
    setAnalysis(analyzeMessage(clipped));
  }

  function onAnalyze() {
    publish(text, activeSample);
  }

  function onClear() {
    setText("");
    setAnalysis(null);
    setActiveSample(null);
    setError(null);
    setNotice(null);
    setOcrStatus("idle");
    setFileName(null);
    setPreviewUrl(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrStatus("reading");
    setOcrProgress(0);
    setError(null);
    try {
      const { recognizeImage } = await import("@/lib/ocr");
      const recognized = await recognizeImage(file, ocrLang, setOcrProgress);
      if (!recognized) {
        setOcrStatus("error");
        setError(t("ocr.empty"));
        return;
      }
      setOcrStatus("idle");
      publish(recognized, null);
    } catch {
      setOcrStatus("error");
      setError(t("ocr.failed"));
    }
  }

  const direction = locale === "ar" ? "rtl" : "ltr";
  const bandKey = analysis ? (`band.${analysis.band}` as const) : null;
  const summaryKey = analysis ? (`band.${analysis.band}Summary` as const) : null;
  const presentCategories = CATEGORY_ORDER.filter((category) =>
    analysis?.highlights.some((highlight) => highlight.category === category),
  );

  return (
    <div dir={direction} lang={locale} className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <a className="skip-link" href={`#${messageId}`}>
        {t("nav.skip")}
      </a>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <LensMark />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("app.name")}</h1>
            <p className="mt-1 text-lg text-muted">{t("app.tagline")}</p>
          </div>
        </div>
        <div role="group" aria-label={t("language.group")} className="flex rounded-full border border-line bg-card p-1">
          {LANGUAGE_BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              lang={button.id}
              aria-pressed={locale === button.id}
              onClick={() => chooseLocale(button.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                locale === button.id ? "bg-teal text-white" : "text-ink"
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </header>

      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">{t("app.intro")}</p>

      <section className="panel mb-6 p-4 sm:p-5" aria-labelledby="privacy-title">
        <h2 id="privacy-title" className="text-base font-semibold">
          {t("privacy.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{t("privacy.summary")}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{t("privacy.local")}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{t("privacy.ocr")}</p>
        <details className="mt-3 text-sm leading-6 text-muted">
          <summary className="cursor-pointer font-medium text-ink">{t("privacy.more")}</summary>
          <ul className="mt-2 list-disc space-y-2 ps-5">
            <li>{t("privacy.limit")}</li>
          </ul>
        </details>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form
          className="panel p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onAnalyze();
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={messageId} className="text-base font-semibold">
              {t("field.message")}
            </label>
            <p className="text-sm text-muted">{t("field.characters", { count: String(text.length) })}</p>
          </div>
          <p id={`${messageId}-hint`} className="mt-1 text-sm text-muted">
            {t("field.messageHint")}
          </p>
          <textarea
            id={messageId}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setActiveSample(null);
              setAnalysis(null);
            }}
            maxLength={MAX_MESSAGE_CHARS}
            rows={9}
            spellCheck
            aria-describedby={`${messageId}-hint`}
            className="mt-3 w-full resize-y rounded-xl border border-line bg-white px-3 py-3 text-base leading-6"
          />

          <div className="mt-4">
            <h2 className="text-sm font-semibold">{t("samples.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("samples.note")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  aria-pressed={activeSample === sample.id}
                  onClick={() => publish(sample.text, sample.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    activeSample === sample.id
                      ? "border-teal bg-teal text-white"
                      : "border-line bg-white text-ink"
                  }`}
                >
                  {t(SAMPLE_LABEL_KEYS[sample.id] as MessageKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <h2 className="text-sm font-semibold">{t("field.screenshot")}</h2>
            <p className="mt-1 text-sm text-muted">{t("field.screenshotHint")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                htmlFor={fileId}
                className="cursor-pointer rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium focus-within:outline focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-teal"
              >
                {fileName ?? t("field.screenshot")}
                <input
                  id={fileId}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void onFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
              <label htmlFor={ocrLangId} className="text-sm text-muted">
                {t("field.ocrLanguage")}
              </label>
              <select
                id={ocrLangId}
                value={ocrLang}
                onChange={(event) => setOcrLang(event.target.value as OcrLang)}
                className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm"
              >
                <option value="eng">{t("ocr.eng")}</option>
                <option value="ara">{t("ocr.ara")}</option>
                <option value="spa">{t("ocr.spa")}</option>
                <option value="eng+ara+spa">{t("ocr.all")}</option>
              </select>
            </div>
            {previewUrl ? (
              // The preview is a local blob URL created from the file the user picked.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fileName ?? t("field.screenshot")} className="mt-3 max-h-48 rounded-lg border border-line" />
            ) : null}
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {ocrStatus === "reading" ? t("ocr.progress", { percent: String(ocrProgress) }) : null}
            </p>
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-high">
              {error}
            </p>
          ) : null}
          {notice ? <p className="mt-2 text-sm text-muted">{notice}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white">
              {ocrStatus === "reading" ? t("action.ocrBusy") : t("action.analyze")}
            </button>
            <button type="button" onClick={onClear} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium">
              {t("action.clear")}
            </button>
          </div>
        </form>

        <section className="panel p-4 sm:p-5" aria-labelledby="result-title">
          <h2 id="result-title" ref={resultRef} tabIndex={-1} className="text-base font-semibold">
            {t("result.scoreLabel")}
          </h2>
          {analysis && bandKey && summaryKey ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-4">
                <ScoreRing score={analysis.score} band={analysis.band} />
                <div>
                  <p className={`text-2xl font-semibold band-${analysis.band}`}>{t(bandKey)}</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t(summaryKey)}</p>
                  <p className="mt-2 text-sm text-muted">
                    {t("result.parts", {
                      rules: String(analysis.parts.rules),
                      links: String(analysis.parts.links),
                      classifier: String(analysis.parts.classifier),
                    })}
                  </p>
                </div>
              </div>

              <h3 className="mt-6 text-sm font-semibold">{t("result.why")}</h3>
              <ul className="mt-2 space-y-2">
                {analysis.reasons.map((reason) => (
                  <li key={`${reason.id}-${reason.params?.host ?? ""}-${reason.params?.brand ?? ""}-${reason.params?.phrase ?? ""}`} className="flex gap-3 text-sm leading-6">
                    {reason.points > 0 ? (
                      <span className="mt-0.5 h-fit rounded-full bg-paper px-2 py-0.5 text-xs font-semibold tabular-nums">
                        <span className="sr-only">{t("points.label", { points: String(reason.points) })}</span>
                        <span aria-hidden="true">+{reason.points}</span>
                      </span>
                    ) : (
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gold" aria-hidden="true" />
                    )}
                    <span>{t(reason.id as MessageKey, reason.params)}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-sm font-semibold">{t("result.flagged")}</h3>
              {analysis.highlights.length === 0 ? (
                <p className="mt-2 text-sm text-muted">{t("result.noneFlagged")}</p>
              ) : (
                <>
                  <ul className="mt-2 flex flex-wrap gap-2" aria-label={t("result.flagged")}>
                    {presentCategories.map((category) => (
                      <li key={category} className="text-xs">
                        <mark data-category={category}>{t(`category.${category}` as MessageKey)}</mark>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-xl border border-line bg-white p-3">
                    <HighlightedText text={text} highlights={analysis.highlights} />
                  </div>
                  <ul className="mt-3 space-y-2">
                    {analysis.highlights.map((highlight, index) => (
                      <li key={`${highlight.reasonId}-${highlight.start}-${index}`} className="text-sm leading-6">
                        <span className="font-medium">{t(`category.${highlight.category}` as MessageKey)}: </span>
                        <span dir="auto">“{quote(text, highlight.start, highlight.end)}”. </span>
                        <span className="text-muted">{t(highlight.reasonId as MessageKey, highlight.params)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-lg font-medium">{t("result.emptyTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{t("result.emptyBody")}</p>
            </div>
          )}
        </section>
      </div>

      <details className="panel mt-6 p-4 sm:p-5">
        <summary className="cursor-pointer text-base font-semibold">{t("method.title")}</summary>
        <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
          <p>{t("method.intro")}</p>
          <p>{t("method.rules")}</p>
          <p>{t("method.links")}</p>
          <p>{t("method.classifier")}</p>
          <p>{t("method.bands")}</p>
        </div>
      </details>

      <footer className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <p>{t("footer.credit")}</p>
        <p>{t("footer.license")}</p>
      </footer>
    </div>
  );
}
