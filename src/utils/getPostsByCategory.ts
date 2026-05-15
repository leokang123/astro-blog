import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts";
import { getCategorySlugPath } from "./getUniqueCategories";

const getPostsByCategory = (
  posts: CollectionEntry<"blog">[],
  category: string
) =>
  getSortedPosts(
    posts.filter(post => getCategorySlugPath(post) === category)
  );

export default getPostsByCategory;
