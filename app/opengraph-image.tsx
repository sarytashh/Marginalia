import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt =
  "Marginalia — lecture slides into grounded practice questions";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// The OG renderer cannot read woff2, so these load the woff/ttf builds of the
// same families the app uses. This route is prerendered at build time.
async function loadFont(relativePath: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "node_modules", relativePath));
}

export default async function OpenGraphImage() {
  const [serif, sans] = await Promise.all([
    loadFont("@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff"),
    loadFont("geist/dist/fonts/geist-sans/Geist-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#F4F0E8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#211E1B",
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span style={{ fontFamily: "Source Serif 4", fontSize: 34 }}>
            Marginalia
          </span>
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6B6459",
            }}
          >
            Study tutor
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              width: 56,
              height: 2,
              background: "#7D2E3B",
              marginBottom: 32,
            }}
          />
          <div
            style={{
              fontFamily: "Source Serif 4",
              fontSize: 76,
              lineHeight: 1.12,
              letterSpacing: "-0.015em",
              maxWidth: 980,
            }}
          >
            Questions from your lecture slides, not from general knowledge.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#6B6459",
            lineHeight: 1.45,
          }}
        >
          Upload a PDF. Practice. Get graded against the source. Review what is still shaky.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Serif 4", data: serif, style: "normal", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
