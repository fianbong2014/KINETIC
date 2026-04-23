import { ImageResponse } from "next/og";

// Apple Touch Icon — iOS requires 180x180. iOS doesn't respect maskable
// purpose, so we add a bit more breathing room around the K.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0e0e0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "60%",
            background: "#00ffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#004343",
            fontSize: 100,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.1em",
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          }}
        >
          K
        </div>
      </div>
    ),
    size
  );
}
