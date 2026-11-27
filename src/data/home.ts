import type { PublicationFigure } from "./selected-publication-figures";
import { driftmapFigure, rainlineFigure, shadegridFigure } from "./selected-publication-figures";

type Summary = string | (string | { strong: string })[];

interface FeaturedPublication {
  paper: string;
  /** Optional short project or method name. The full title comes from BibTeX. */
  name?: string;
  figure?: PublicationFigure;
  summary: Summary[];
}

const selectedPublications: FeaturedPublication[] = [
  {
    paper: "rainline",
    name: "Rainline",
    figure: rainlineFigure,
    summary: [
      "After a downpour, two flooded corners can look identical. One drains within minutes. The other feeds a pool that stretches across an intersection.",
      ["Rainline lines up readings from neighboring curbside gauges with the onset of rain. The ", { strong: "time between peaks" }, " helps a field crew decide where to look for a connected stretch of standing water."],
    ],
  },
  {
    paper: "shadegrid",
    name: "ShadeGrid",
    figure: shadegridFigure,
    summary: [
      "A shaded park can still be a hot walk away. ShadeGrid follows a pedestrian route through a street map and estimates where buildings and tree crowns cast shade as the sun moves.",
      ["Mapping ", { strong: "uninterrupted stretches of direct sun" }, " reveals where a short detour could offer relief on the way to the park."],
    ],
  },
  {
    paper: "driftmap",
    name: "DriftMap",
    figure: driftmapFigure,
    summary: [
      "When a street sensor gradually reads warmer than its neighbors, the equipment and the street are both plausible explanations.",
      ["DriftMap uses ", { strong: "short side-by-side measurements" }, " to test the instrument against a reference before treating the difference as a change in the neighborhood."],
    ],
  },
];

export const home = {
  background: "I study how heat and rain vary from one street to the next. I started out mapping drainage channels on foot. These days I pair field notebooks with sensors, especially in places where the nearest weather station misses what residents see on their own block.",
  email: "qinghe@example.org",
  selectedPublications,
  connect: {
    collaborations: "I welcome conversations with people tracing rain, heat, or other changes at street level. I especially enjoy comparing a puzzling sensor record with observations from someone who knows the site.",
    internships: "Students interested in fieldwork or environmental data analysis are welcome to email me with a question they would like to investigate.",
  },
  news: [
    { date: "2026-05", before: "Our field note on ", link: { text: "Rainline", href: "/publications/#rainline" }, after: " follows the path of water between two curbside gauges." },
    { date: "2026-03", before: "A new walking survey traces the boundary between sun and shade along the Alder Bay waterfront." },
    { date: "2026-01", before: "Our working paper ", link: { text: "DriftMap", href: "/publications/#driftmap" }, after: " explores how to diagnose a gradual change in a street sensor." },
    { date: "2025-10", before: "The autumn field practicum begins with an afternoon spent testing sensors side by side." },
    { date: "2025-07", before: "Our ", link: { text: "ShadeGrid", href: "/publications/#shadegrid" }, after: " study maps the gaps between patches of shade along a walking route." },
    { date: "2025-04", before: "The lab opens its first rain-gauge transect along Alder Bay’s canal walk." },
    { date: "2024-09", before: "I joined Alder Bay Field Lab as a field scientist." },
  ],
};
