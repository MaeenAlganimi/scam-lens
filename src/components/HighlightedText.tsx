import type { Highlight, HighlightCategory } from "@/lib/types";

const PRIORITY: HighlightCategory[] = [
  "credentials",
  "link",
  "payment",
  "impersonation",
  "prize",
  "urgency",
];

interface Segment {
  text: string;
  category?: HighlightCategory;
}

export function segmentsFor(text: string, highlights: readonly Highlight[]): Segment[] {
  const ranges = highlights.filter(
    (highlight) => highlight.start >= 0 && highlight.end <= text.length && highlight.start < highlight.end,
  );
  const cuts = new Set<number>([0, text.length]);
  for (const range of ranges) {
    cuts.add(range.start);
    cuts.add(range.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segments: Segment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index] ?? 0;
    const end = points[index + 1] ?? text.length;
    if (start === end) continue;
    const present = new Set<HighlightCategory>();
    for (const range of ranges) {
      if (range.start < end && range.end > start) present.add(range.category);
    }
    const category = PRIORITY.find((item) => present.has(item));
    segments.push({ text: text.slice(start, end), category });
  }

  return segments;
}

export function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: readonly Highlight[];
}) {
  const segments = segmentsFor(text, highlights);
  return (
    <p dir="auto" className="message-body text-base leading-7">
      {segments.map((segment, index) =>
        segment.category ? (
          <mark key={`${index}-${segment.category}`} data-category={segment.category}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
