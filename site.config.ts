import { defineSiteConfig } from "./src/config/site";

export const siteConfig = defineSiteConfig({
  author: "Casey Rowan",
  title: "Casey Rowan",
  siteUrl: process.env.SITE_URL || "http://localhost:4321",
  description: "Casey Rowan studies how street design shapes heat, rainfall, and air quality.",
  hero: {
    headline: "",
    subheadline: "Field Scientist at Alder Bay Field Lab",
    profileImage: "/profile.png",
    profileAlt: "Casey Rowan’s initials on a coastal contour map",
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
