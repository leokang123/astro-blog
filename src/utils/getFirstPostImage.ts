import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";
import path from "node:path";

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/**/*.{avif,gif,jpeg,jpg,png,webp}",
  { eager: true }
);

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
  image: CollectionEntry<"blog">["data"]["ogImage"] | string,
  post?: Pick<CollectionEntry<"blog">, "filePath">
) => {
  if (!image) return undefined;

  if (typeof image !== "string") {
    return image.src;
  }

  const decodedSrc = decodeImageSrc(image);

  if (isRemoteUrl(decodedSrc) || decodedSrc.startsWith("/")) {
    return decodedSrc;
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

  return assetPath ? imageModules[assetPath]?.default.src : undefined;
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
