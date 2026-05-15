import type { CollectionEntry } from "astro:content";
import { BLOG_PATH } from "@/content.config";
import postFilter from "./postFilter";
import { slugifyStr } from "./slugify";

export interface Category {
  category: string;
  categoryName: string;
  categoryLabel: string;
  categoryPath: string[];
  slugPath: string[];
  parentCategory: string | null;
  depth: number;
}

interface CategorySegment {
  name: string;
  slug: string;
}

export const getCategorySegments = (
  post: CollectionEntry<"blog">
): CategorySegment[] => {
  if (post.data.category !== "General") {
    return [
      {
        name: post.data.category,
        slug: slugifyStr(post.data.category),
      },
    ];
  }

  const folderSegments = post.filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(segment => segment.trim())
    .filter(segment => !segment.startsWith("_"))
    .slice(0, -1);

  if (!folderSegments?.length) {
    return [{ name: "General", slug: "general" }];
  }

  return folderSegments.map(segment => ({
    name: segment,
    slug: slugifyStr(segment),
  }));
};

export const getCategorySlugPath = (post: CollectionEntry<"blog">) =>
  getCategorySegments(post)
    .map(segment => segment.slug)
    .join("/");

const getUniqueCategories = (posts: CollectionEntry<"blog">[]) => {
  const categoryMap = new Map<string, Category>();

  posts
    .filter(postFilter)
    .forEach(post => {
      const segments = getCategorySegments(post);

      segments.forEach((_, index) => {
        const pathSegments = segments.slice(0, index + 1);
        const category = pathSegments.map(segment => segment.slug).join("/");
        const parentSegments = pathSegments.slice(0, -1);

        if (categoryMap.has(category)) return;

        categoryMap.set(category, {
          category,
          categoryName: pathSegments.map(segment => segment.name).join(" / "),
          categoryLabel: pathSegments.at(-1)?.name ?? category,
          categoryPath: pathSegments.map(segment => segment.name),
          slugPath: pathSegments.map(segment => segment.slug),
          parentCategory: parentSegments.length
            ? parentSegments.map(segment => segment.slug).join("/")
            : null,
          depth: pathSegments.length,
        });
      });
    });

  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.category.localeCompare(b.category)
  );

  return categories;
};

export const getCategoryChildren = (
  categories: Category[],
  parentCategory: string | null
) =>
  categories.filter(category => category.parentCategory === parentCategory);

export default getUniqueCategories;
