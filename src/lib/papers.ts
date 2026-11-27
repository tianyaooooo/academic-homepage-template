import citationsRaw from '../data/citations.bib?raw';
import publicationsRaw from '../data/publications.bib?raw';
import { venueFilters } from '../data/publication-venues';
import { parseBibtex, type BibEntry } from './bibtex';

export function readPublications(bibliography: string, references: string): BibEntry[] {
	const citations = new Map(parseBibtex(references).map(entry => [entry.id, entry.citation]));
	return parseBibtex(bibliography).map(paper => {
		if (!paper.citationKey) return paper;
		const citation = citations.get(paper.citationKey);
		if (!citation) throw new Error('Missing citation ' + paper.citationKey + ' for ' + paper.id);
		return { ...paper, citation };
	});
}

const papers = readPublications(publicationsRaw, citationsRaw);

export const publicationVenues = [
	...venueFilters,
	{ key: 'others', label: 'Others', aliases: [] },
	{ key: 'under-review', label: 'Under review', aliases: [] },
];

const venueKeys = new Map<string, string>();
for (const { key, label, aliases } of publicationVenues) {
	for (const name of [key, label, ...aliases]) {
		venueKeys.set(name.trim().toLowerCase(), key);
	}
}

export function publicationVenueGroup(venue?: string): string {
	return venueKeys.get(venue?.trim().toLowerCase() ?? '') ?? 'others';
}

export function getAllPapers(): BibEntry[] {
	return papers;
}

export function getFeaturedPapers(limit = 3, entries = papers): BibEntry[] {
	return entries.filter(paper => paper.category === 'Publication').slice(0, limit);
}
