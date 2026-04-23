import type { MetadataRoute } from "next";

// Generates /manifest.webmanifest at build time so the app is installable as
// a PWA on iOS and Android. Next.js links this automatically from <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KINETIC Trading Terminal",
    short_name: "KINETIC",
    description:
      "Bloomberg-inspired crypto trading terminal with live signals, paper trading, and price alerts.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0e0e0f",
    theme_color: "#0e0e0f",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
