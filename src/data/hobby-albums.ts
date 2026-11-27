import type { ImageMetadata } from "astro";
import headland from "../assets/albums/headland.webp";
import boardwalk from "../assets/albums/boardwalk.webp";
import leafStudy from "../assets/albums/leaf-study.webp";
import saltmarsh from "../assets/albums/saltmarsh.webp";
import reedbed from "../assets/albums/reedbed.webp";

export const hobbyIntroduction =
  "I walk the shore paths, keep a pocket sketchbook, and watch the same stretch of saltmarsh change with the tide.";

interface AlbumImage {
  src: ImageMetadata;
  alt: string;
}

export interface HobbyAlbum {
  slug: string;
  title: string;
  description?: string;
  cover: ImageMetadata;
  coverPosition?: string;
  photos: [AlbumImage, ...AlbumImage[]];
}

export const hobbyAlbums: HobbyAlbum[] = [
  {
    slug: "shore-walks",
    title: "Shore Walks",
    description: "Two favorite stops on the walk from the headland to the old landing.",
    cover: headland,
    photos: [
      { src: headland, alt: "A sandy path curves over a green headland above still water at sunset." },
      { src: boardwalk, alt: "A pale wooden landing extends into a blue-green inlet." },
    ],
  },
  {
    slug: "pocket-sketchbooks",
    title: "Pocket Sketchbooks",
    cover: leafStudy,
    photos: [
      { src: leafStudy, alt: "An open sketchbook with a painted leafy sprig and a pencil study of its veins." },
    ],
  },
  {
    slug: "watching-the-tide",
    title: "Watching the Tide",
    description: "Marsh channels at low water and the reeds along their edge.",
    cover: saltmarsh,
    photos: [
      { src: saltmarsh, alt: "A winding tidal channel flows between ochre mudflats beneath a peach-colored sun." },
      { src: reedbed, alt: "A stand of reeds beside the tidewater, with low hills across the bay." },
    ],
  },
];
