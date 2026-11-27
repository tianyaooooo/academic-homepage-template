import type { ImageMetadata } from "astro";

interface PublicationFigure {
  image: ImageMetadata;
  alt: string;
  credit?: string;
  source?: string;
  license?: string;
}

// To add a thumbnail, import an image and give it the paper's BibTeX key:
// rainline: { image: rainlineImage, alt: "Timing of upstream and downstream gauge peaks" }
export const publicationFigures: Partial<Record<string, PublicationFigure>> = {};
