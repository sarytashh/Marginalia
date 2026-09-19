import { describe, expect, it } from "vitest";

import { formatFileSize, formatPageCount, formatUploadedOn } from "@/lib/pdf/format";

describe("formatFileSize", () => {
  it("uses KB and MB at the expected thresholds", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2_500_000)).toBe("2.4 MB");
  });
});

describe("formatPageCount", () => {
  it("pluralizes and treats null as unknown", () => {
    expect(formatPageCount(null)).toBeNull();
    expect(formatPageCount(1)).toBe("1 page");
    expect(formatPageCount(3)).toBe("3 pages");
  });
});

describe("formatUploadedOn", () => {
  it("formats in UTC so server and client render the same string", () => {
    expect(formatUploadedOn("2026-09-19T10:50:08.529Z")).toBe("19 Sep 2026");
  });
});
