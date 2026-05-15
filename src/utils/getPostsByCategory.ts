import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";
import { getCategorySlugPath } from "./getUniqueCategories";

const postTimestamp = (post: CollectionEntry<"blog">) =>
  new Date(post.data.modDatetime ?? post.data.pubDatetime).getTime();

const getPostsByCategory = (
  posts: CollectionEntry<"blog">[],
  category: string
) =>
  posts
    .filter(postFilter)
    .filter(post => getCategorySlugPath(post) === category)
    .sort((a, b) => {
      const orderA = a.data.order;
      const orderB = b.data.order;

      if (orderA !== undefined || orderB !== undefined) {
        if (orderA === undefined) return 1;
        if (orderB === undefined) return -1;
        if (orderA !== orderB) return orderA - orderB;
      }

      return postTimestamp(b) - postTimestamp(a);
    });

export default getPostsByCategory;
