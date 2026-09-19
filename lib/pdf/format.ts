export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    const kilobytes = bytes / 1024;
    return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
  }

  const megabytes = bytes / (1024 * 1024);
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

export function formatPageCount(pageCount: number | null): string | null {
  if (pageCount === null) {
    return null;
  }

  return pageCount === 1 ? "1 page" : `${pageCount} pages`;
}

export function formatUploadedOn(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ] as const;
  const month = months[date.getUTCMonth()];
  if (month === undefined) {
    return isoDate.slice(0, 10);
  }
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}
