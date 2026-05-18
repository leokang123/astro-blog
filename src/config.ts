import settings from "./user-settings.json";

const USER_SITE = settings.USER_SITE;

const normalizeSiteUrl = (siteUrl: string) => {
  const url = new URL(siteUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.href;
};

const normalizeBasePath = (basePath?: string) => {
  const trimmedBasePath = basePath?.trim() ?? "";

  if (!trimmedBasePath || trimmedBasePath === "/") {
    return "";
  }

  const basePathWithLeadingSlash = trimmedBasePath.startsWith("/")
    ? trimmedBasePath
    : `/${trimmedBasePath}`;

  return basePathWithLeadingSlash.endsWith("/")
    ? basePathWithLeadingSlash.slice(0, -1)
    : basePathWithLeadingSlash;
};

const publicSiteUrl = process.env.PUBLIC_SITE_URL?.trim();
const publicProfileUrl = process.env.PUBLIC_PROFILE_URL?.trim();

const website = normalizeSiteUrl(publicSiteUrl || USER_SITE.website);
const basePath = normalizeBasePath(process.env.PUBLIC_BASE_PATH);
const profile =
  publicProfileUrl ||
  (publicSiteUrl
    ? new URL(`${basePath}/about/`.replaceAll("//", "/"), website).href
    : USER_SITE.profile);

export const SITE = {
  ...USER_SITE,
  website,
  basePath,
  profile,
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/satnaing/astro-paper/edit/main/",
  },
  dynamicOgImage: false,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Seoul", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
