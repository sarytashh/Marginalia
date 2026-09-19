import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F4F0E8",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7D2E3B",
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    },
  );
}
