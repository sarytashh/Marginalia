import { ImageResponse } from "next/og";

export const alt =
  "Marginalia — lecture slides into grounded practice questions";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#6B6459",
          }}
        >
          <span>Marginalia</span>
          <span>Study tutor</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              width: 48,
              height: 1,
              background: "#7D2E3B",
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              maxWidth: 920,
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
            maxWidth: 760,
            lineHeight: 1.45,
          }}
        >
          Upload a PDF. Practice. Get graded against the source. Review what is
          still shaky.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
