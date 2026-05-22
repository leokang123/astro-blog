import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";
import { existsSync } from "node:fs";
import path from "node:path";

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/**/*.{avif,gif,jpeg,jpg,png,webp}",
  { eager: true }
);

export const MISSING_IMAGE_FALLBACK = "/missing-image.svg";

const markdownImagePattern = /!\[[^\]]*]\((?<src><[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const htmlImagePattern = /<img\b[^>]*\bsrc=["'](?<src>[^"']+)["'][^>]*>/gi;

const cleanImageSrc = (src: string) =>
  src.trim().replace(/^<(.+)>$/, "$1").split(/[?#]/)[0];

const isRemoteUrl = (src: string) => /^https?:\/\//i.test(src);

const decodeImageSrc = (src: string) => {
  const imageSrc = cleanImageSrc(src);

  try {
    return decodeURI(imageSrc);
  } catch {
    return imageSrc;
  }
};

export const resolvePostImageSrc = (
  image: string | undefined,
  post?: Pick<CollectionEntry<"blog">, "filePath">
) => {
  if (!image) return undefined;

  const decodedSrc = decodeImageSrc(image);

  if (isRemoteUrl(decodedSrc)) {
    return decodedSrc;
  }

  if (decodedSrc.startsWith("/")) {
    if (decodedSrc === MISSING_IMAGE_FALLBACK) return decodedSrc;

    const publicPath = path.join(process.cwd(), "public", decodedSrc.slice(1));
    return existsSync(publicPath) ? decodedSrc : MISSING_IMAGE_FALLBACK;
  }

  let assetPath: string | undefined;

  if (decodedSrc.startsWith("@/")) {
    assetPath = `/src/${decodedSrc.slice(2)}`;
  } else if (decodedSrc.startsWith("src/assets/images/")) {
    assetPath = `/${decodedSrc}`;
  } else if (post?.filePath) {
    const pathFromPost = path
      .join(path.dirname(post.filePath), decodedSrc)
      .replaceAll(path.sep, "/");

    if (pathFromPost.startsWith("src/assets/images/")) {
      assetPath = `/${pathFromPost}`;
    }
  }

  return assetPath
    ? imageModules[assetPath]?.default.src ?? MISSING_IMAGE_FALLBACK
    : undefined;
};

const firstMatchingImage = (
  body: string,
  pattern: RegExp,
  post: CollectionEntry<"blog">
) => {
  for (const match of body.matchAll(pattern)) {
    const src = match.groups?.src;
    if (!src) continue;

    const resolvedImage = resolvePostImageSrc(src, post);
    if (resolvedImage) return resolvedImage;
  }

  return undefined;
};

export const getFirstPostImage = (post: CollectionEntry<"blog">) => {
  const body = post.body ?? "";
  return (
    firstMatchingImage(body, markdownImagePattern, post) ??
    firstMatchingImage(body, htmlImagePattern, post)
  );
};
