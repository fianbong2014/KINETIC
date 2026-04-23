import { ImageResponse } from "next/og";

// Runtime-generated app icon — black canvas with cyan Zap bolt, matching the
// brand. Used for favicon, PWA install icon, and browser tab.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
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
            width: "70%",
            height: "70%",
            background: "#00ffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#004343",
            fontSize: 120,
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
