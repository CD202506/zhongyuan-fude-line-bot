const isoDatePattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;

export function formatTaiwanDate(value: string) {
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
