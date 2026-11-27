/**
 * Order, button labels, and alternate venue names for the Publications filters.
 * An alias can group a workshop with its parent venue. Other venues automatically
 * appear under Others. Pick unique keys for shareable URLs, e.g. ?venue=fs.
 * The built-in keys all, others and under-review are reserved.
 */
export const venueFilters: readonly {
  key: string;
  label: string;
  aliases: readonly string[];
}[] = [
  { key: "fs", label: "FS", aliases: ["Field Signals", "Field Signals Workshop"] },
  { key: "ufm", label: "UFM", aliases: ["Urban Field Methods"] },
];
