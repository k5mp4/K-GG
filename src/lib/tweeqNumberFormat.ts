type ParsedNumber = {
  value: number;
  token: string;
  index: number;
};

export type FormatInfo = {
  scale: number;
  offset: number;
  prefix: string;
  suffix: string;
  precision: number;
};

const NUMBER_TOKEN = /-?\d[\d,]*(?:\.\d+)?/;

function parseFormattedNumber(formatted: string): ParsedNumber | null {
  const match = NUMBER_TOKEN.exec(formatted);
  if (!match || match.index === undefined) return null;
  const value = Number(match[0].replaceAll(',', ''));
  if (!Number.isFinite(value)) return null;
  return { value, token: match[0], index: match.index };
}

function decimalPlaces(value: number): number {
  const text = String(value);
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
}

/** Recover simple unit/percentage formatting for Tweeq's numeric display. */
export function inferFormatInfo(
  format: ((value: number) => string) | undefined,
  value: number,
  min: number,
  max: number,
  step: number,
): FormatInfo | null {
  if (!format) return null;

  const candidates = [
    value,
    min,
    max,
    min + (max - min) * 0.25,
    min + (max - min) * 0.5,
    min + (max - min) * 0.75,
    value + step,
    value - step,
  ].filter(Number.isFinite);

  const unique = [...new Set(candidates)];
  for (const first of unique) {
    const firstParsed = parseFormattedNumber(format(first));
    if (!firstParsed) continue;

    for (const second of unique) {
      if (second === first) continue;
      const secondParsed = parseFormattedNumber(format(second));
      if (!secondParsed) continue;

      const scale = (secondParsed.value - firstParsed.value) / (second - first);
      if (!Number.isFinite(scale) || Math.abs(scale) < 1e-9) continue;

      const firstFormatted = format(first);
      return {
        scale,
        offset: firstParsed.value - scale * first,
        prefix: firstFormatted.slice(0, firstParsed.index),
        suffix: firstFormatted.slice(firstParsed.index + firstParsed.token.length),
        precision: Math.max(decimalPlaces(firstParsed.value), decimalPlaces(secondParsed.value)),
      };
    }
  }

  return null;
}
