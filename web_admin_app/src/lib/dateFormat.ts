const isoDatePattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
const rocDatePattern = /^(\d{2,3})[-/](\d{1,2})[-/](\d{1,2})/;

export function formatTaiwanDate(value: string) {
  const rocMatch = value.match(rocDatePattern);
  if (rocMatch && Number(rocMatch[1]) < 1911) {
    const month = Number(rocMatch[2]);
    const day = Number(rocMatch[3]);
    if (!month || !day) return value;
    return `${Number(rocMatch[1])} 年 ${month} 月 ${day} 日`;
  }

  const match = value.match(isoDatePattern);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return value;

  return `${year - 1911} 年 ${month} 月 ${day} 日`;
}

export function formatDisplayDate(value: string | null | undefined) {
  if (!value) return "";
  return formatTaiwanDate(value);
}

export const rocDateInputHint = "日期輸入：年/月/日；例：114/07/11";

export function formatRocDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const match = value.match(isoDatePattern);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return value;

  return `${year - 1911}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

export function toIsoDateValue(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  const isoMatch = trimmed.match(isoDatePattern);
  if (isoMatch) {
    return `${isoMatch[1]}-${String(Number(isoMatch[2])).padStart(2, "0")}-${String(Number(isoMatch[3])).padStart(2, "0")}`;
  }

  const rocMatch = trimmed.match(rocDatePattern);
  if (!rocMatch) return null;
  const rocYear = Number(rocMatch[1]);
  const month = Number(rocMatch[2]);
  const day = Number(rocMatch[3]);
  if (!rocYear || !month || !day) return null;

  return `${rocYear + 1911}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
