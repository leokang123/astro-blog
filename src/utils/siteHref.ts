import { SITE } from "@/config";

const siteHref = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const pathWithLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const alreadyHasBasePath =
    SITE.basePath &&
    (pathWithLeadingSlash === SITE.basePath ||
      pathWithLeadingSlash.startsWith(`${SITE.basePath}/`));
  const pathWithBase = alreadyHasBasePath
    ? pathWithLeadingSlash
    : `${SITE.basePath}${pathWithLeadingSlash}`.replaceAll("//", "/");
  const url = new URL(pathWithBase, SITE.website);
  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(url.pathname);

  if (!hasFileExtension && !url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }

  return url.href;
};

export default siteHref;
