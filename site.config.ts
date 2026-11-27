import { defineSiteConfig } from "./src/config/site";

export const siteConfig = defineSiteConfig({
  author: "Qinghe Lu",
  title: "Qinghe Lu",
  siteUrl: process.env.SITE_URL || "http://localhost:4321",
  description: "Qinghe Lu studies how street design shapes heat, rainfall, and air quality.",
  hero: {
    headline: "陆清禾",
    subheadline: "Field Scientist at Alder Bay Field Lab",
    profileImage: "/src/assets/portraits/profile.png",
    profileAlt: "Portrait of Qinghe Lu, the fictional researcher featured in this template",
    profileImageWidth: 480,
    profileImageHeight: 480,
  },
  affiliations: [{ role: "Field Scientist", institution: "Alder Bay Field Lab" }],
  navLinks: [
    { href: "/", label: "Home" },
    { href: "/publications/", label: "Publications" },
    { href: "/cv/", label: "Experience" },
    { href: "/misc/", label: "Misc" },
  ],
  footer: { copyright: "Fictional profile for the Academic Homepage Template." },
});

export default siteConfig;
