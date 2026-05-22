import { defineConfig, envField, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { existsSync } from "node:fs";
import path from "node:path";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";

const missingImageFallback = "/missing-image.svg";

const cleanImageUrl = (url: string) =>
  url.trim().replace(/^<(.+)>$/, "$1").split(/[?#]/)[0];

const isRemoteImageUrl = (url: string) =>
  /^(?:https?:|data:|blob:)/i.test(url);

const toLocalImagePath = (url: string, markdownPath?: string) => {
  const cleanUrl = cleanImageUrl(url);

  if (!cleanUrl || isRemoteImageUrl(cleanUrl)) return undefined;

  let decodedUrl = cleanUrl;
  try {
    decodedUrl = decodeURI(cleanUrl);
  } catch {
    // Keep the original URL if it is not valid URI text.
  }

  if (decodedUrl.startsWith("@/")) {
    return path.join(process.cwd(), "src", decodedUrl.slice(2));
  }

  if (decodedUrl.startsWith("/src/")) {
    return path.join(process.cwd(), decodedUrl.slice(1));
  }

  if (decodedUrl.startsWith("src/")) {
    return path.join(process.cwd(), decodedUrl);
  }

  if (decodedUrl.startsWith("/")) {
    return path.join(process.cwd(), "public", decodedUrl.slice(1));
  }

  return markdownPath
    ? path.resolve(path.dirname(markdownPath), decodedUrl)
    : undefined;
};

function remarkMissingImageFallback() {
  return (tree: { children?: unknown[] }, file: { history?: string[] }) => {
    const markdownPath = file.history?.[0];

    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") return;

      const imageNode = node as { type?: string; url?: string; children?: unknown[] };
      if (imageNode.type === "image" && typeof imageNode.url === "string") {
        const imagePath = toLocalImagePath(imageNode.url, markdownPath);

        if (imagePath && !existsSync(imagePath)) {
          imageNode.url = missingImageFallback;
        }
      }

      imageNode.children?.forEach(visit);
    };

    visit(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  base: SITE.basePath || undefined,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
      remarkMissingImageFallback,
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
    fonts: [
      {
        name: "Google Sans Code",
        cssVariable: "--font-google-sans-code",
        provider: fontProviders.google(),
        fallbacks: ["monospace"],
        weights: [300, 400, 500, 600, 700],
        styles: ["normal", "italic"],
      },
    ],
  },
});
