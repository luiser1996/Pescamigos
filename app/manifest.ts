import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pescamigos",
    short_name: "Pescamigos",
    description: "Catálogo y diario privado de pesca",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf5",
    theme_color: "#dff3df",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
