import config from "../site.config";

const portraits = import.meta.glob<string>(
  "/src/assets/portraits/*.{png,jpg,jpeg,webp,avif,svg}",
  { eager: true, import: "default", query: "?url" },
);

// Vite gives each bundled portrait a content-based URL. External and public URLs pass through.
const resolveImage = (url: string) => portraits[url] ?? url;

export const siteConfig = {
  ...config,
  hero: { ...config.hero, profileImage: resolveImage(config.hero.profileImage) },
  ogImage: config.ogImage ? resolveImage(config.ogImage) : config.ogImage,
};

export default siteConfig;
