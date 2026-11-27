import type { ImageMetadata } from "astro";
import rainline from "../assets/home/rainline.png";
import shadegrid from "../assets/home/shadegrid.png";
import driftmap from "../assets/home/driftmap.png";

export interface PublicationFigure {
  image: ImageMetadata;
  alt: string;
  useViewer?: boolean;
  credit?: string;
}

export const rainlineFigure: PublicationFigure = {
  image: rainline,
  alt: "Water peaks briefly at the upper gauge shortly after rain begins. The lower gauge rises later and drains more slowly.",
};

export const shadegridFigure: PublicationFigure = {
  image: shadegrid,
  alt: "An illustrative street map marks shaded stretches of a walking route in teal and sunny stretches in orange.",
};

export const driftmapFigure: PublicationFigure = {
  image: driftmap,
  useViewer: true,
  alt: "Two sensors follow the same temperature pattern. After they are placed side by side, one continues to report higher readings.",
};
