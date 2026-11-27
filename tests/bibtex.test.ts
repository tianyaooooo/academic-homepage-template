import { describe, expect, test } from "vitest";
import { parseBibtex } from "../src/lib/bibtex";
import { getFeaturedPapers, publicationVenueGroup, readPublications } from "../src/lib/papers";
import { venueFilters } from "../src/data/publication-venues";

describe("parseBibtex", () => {
	test("retains abstract paragraphs, symbols, and the source of the author text", () => {
		const [paper] = parseBibtex(String.raw`@article{example,
			title = {Example},
			abstract = {The first
				sentence.

				The lamp reached 50\% charge.},
			abstractsource = {https://example.org/paper}
		}`);
		expect(paper.abstract).toBe("The first sentence.\n\nThe lamp reached 50% charge.");
		expect(paper.abstractSource).toBe("https://example.org/paper");
	});

	test("uses the listing year for grouping while citing the paper's own year", () => {
		const [first, second] = parseBibtex(
			'@article{conference,title={Conference paper},year=2025}\n@misc{preprint,title={Preprint},year=2024,listingyear=2026}'
		);
		expect([first.id, second.id]).toEqual(["preprint", "conference"]);
		expect(first.listingYear).toBe(2026);
		expect(first.citation).toMatch(/year\s*= \{2024\}/);
	});

	test("typesets emphasis and inline math while preserving literal dollars", () => {
		const source = String.raw`@unpublished{math,title={Example},
			abstract={A \textbf{model} uses $T_0/\sqrt{n}$ and a $3\times$ multiplier.

			Cost in \$/day and \{literal\} braces.}}`;
		const [paper] = parseBibtex(source);
		expect(paper.abstractParagraphs).toEqual([
			['A ', { tag: 'strong', text: 'model' }, ' uses ', 'T', { tag: 'sub', text: '0' }, '/√n', ' and a ', '3×', ' multiplier.'],
			['Cost in $/day and {literal} braces.'],
		]);
		expect(paper.abstract).toContain('T_0/√n');
		expect(paper.citation).not.toContain("abstract");
	});

	test("keeps entries separate across comments and preserves BibTeX capitalization", () => {
		const first = '@article{one,title={One {DNA} study},year={2024},doi={10.1234/test},volume={12},number={3},pages={20--30}}';
		const entries = parseBibtex(`${first}\n% between entries\n@article(two,title="Two",year=2025)\n% end`);
		expect(entries.map(({ id, title }) => [id, title])).toEqual([
			["two", "Two"], ["one", "One DNA study"],
		]);
		expect(entries[1].citation).toContain("One {DNA} study");
		expect(entries[1].citation).toMatch(/pages\s*= \{20--30\}/);
		expect(entries[1].citation).not.toContain("doi");
	});

	test("preserves organization authors, family particles, and suffixes", () => {
		const [paper] = parseBibtex('@article{names,title={Names},author={{Research and Development Group} and de la Cruz, Jr., Juan and Ada van Rossum},year=2025}');
		expect(paper.authors).toEqual(["Research and Development Group", "Juan de la Cruz, Jr.", "Ada van Rossum"]);
		expect(paper.citation).toContain("{Research and Development Group} and\n                  de la Cruz, Jr., Juan");
	});

	test("rejects malformed or duplicate records instead of publishing partial data", () => {
		expect(() => parseBibtex('@article{bad,title={Unclosed}')).toThrow(/bad|unterminated/i);
		expect(() => parseBibtex('@article{x,title={One}}\n@article{x,title={Two}}')).toThrow(/duplicate.*x/i);
		expect(() => parseBibtex('@article{missing,year=2025}')).toThrow(/title/i);
		expect(parseBibtex('% Empty library\n')).toEqual([]);
	});

	test("handles string macros, escaped delimiters, and comments between fields", () => {
		const [paper] = parseBibtex(String.raw`@string{venue = "Journal"}
		@article{escaped,
		  title = {A \{literal\} and {nested} title},
		  % a field comment with @ and }
		  journal = venue # " of Tests", year = 2025,
		  abstract = "A {braced} and \"quoted\" example"
		}
		% trailing comment`);
		expect(paper.venue).toBe("Journal of Tests");
		expect(paper.title).toBe("A {literal} and nested title");
		expect(paper.abstract).toContain('quoted');
		expect(paper.citation).toMatch(/journal\s*= \{Journal of Tests\}/);
		expect(() => parseBibtex('@article{x,title=undefinedmacro}')).toThrow(/undefined.*string/i);
	});
	test("parses nested braces in titles and abstracts", () => {
		const entries = parseBibtex(`
      @article{smith2025nested,
        title = {Keeping {AI} and {HCI} Capitalized},
        author = {Smith, Ada and Lee, Bo},
        journal = {Journal of Tests},
        year = {2025},
        abstract = {A study with {nested {brace}} content.},
        public = {yes}
      }
    `);

		expect(entries[0].title).toBe("Keeping AI and HCI Capitalized");
		expect(entries[0].abstract).toBe("A study with nested brace content.");
		expect(entries[0].authors).toEqual(["Ada Smith", "Bo Lee"]);
		expect(entries[0].category).toBe("Publication");
	});

	test("parses quoted values and working paper category", () => {
		const entries = parseBibtex(`
      @misc{doe2024quoted,
        title = "Quoted Field Paper",
        author = "Doe, Jane and Public, John Q.",
        year = "2024",
        public = "wp",
        url = "https://example.com/paper"
      }
    `);

		expect(entries[0].title).toBe("Quoted Field Paper");
		expect(entries[0].authors).toEqual(["Jane Doe", "John Q. Public"]);
		expect(entries[0].category).toBe("Working Paper");
		expect(entries[0].url).toBe("https://example.com/paper");
	});

	test("sorts entries by year descending", () => {
		const entries = parseBibtex(`
      @misc{old, title = {Old}, year = {2020}}
      @misc{new, title = {New}, year = {2026}}
    `);

		expect(entries.map((entry) => entry.id)).toEqual(["new", "old"]);
	});

	test("treats an omitted public field as other", () => {
		const [entry] = parseBibtex(`
      @misc{uncategorized, title = {Uncategorized}}
    `);

		expect(entry.category).toBe("Other");
	});

	test("selects only publications for the home page", () => {
		const entries = parseBibtex(`
      @misc{working, title = {Working}, year = {2026}, public = {wp}}
      @misc{published, title = {Published}, year = {2025}, public = {yes}}
      @misc{other, title = {Other}, year = {2024}}
    `);

		expect(getFeaturedPapers(3, entries).map((entry) => entry.id)).toEqual([
			"published",
		]);
	});

	test("uses the formal reference for Cite while preserving the public anchor and venue badge", () => {
		const listing = '@inproceedings{short,title={Street study},author={A. River},venue={Forum},citationkey={river2025},year=2025}';
		const reference = '@inproceedings{river2025,title={Street study},author={A. River},booktitle={Proceedings of the Town Forum},pages={11--14},year=2025}';
		const [paper] = readPublications(listing, reference);
		expect(paper.id).toBe("short");
		expect(paper.venue).toBe("Forum");
		expect(paper.citation).toBe(`@inproceedings{river2025,
  author       = {A. River},
  title        = {Street study},
  booktitle    = {Proceedings of the Town Forum},
  pages        = {11--14},
  year         = {2025}
}`);
		expect(() => readPublications(listing, "")).toThrow(/Missing citation river2025 for short/);
	});

	test("groups the configured labels and aliases under the same venue button", () => {
		for (const { key, label, aliases } of venueFilters) {
			expect(publicationVenueGroup(label)).toBe(key);
			for (const alias of aliases) expect(publicationVenueGroup(alias)).toBe(key);
		}
		expect(publicationVenueGroup(" Under Review ")).toBe("under-review");
		expect(publicationVenueGroup()).toBe("others");
	});

	test("shows an unpublished entry's review status from its ordinary BibTeX note", () => {
		const [draft] = parseBibtex('@unpublished{d,title={Sketch},author={Rowan, Casey},note={Under review},listingyear=2025}');
		expect(draft.venue).toBe("Under review");
		expect(draft.authors).toEqual(["Casey Rowan"]);
		expect(draft.citation).toContain("note         = {Under review}");
		expect(draft.citation).not.toMatch(/listingyear|2025|journal/);
	});

	test("cites an undated manuscript without giving its listing year as a publication date", () => {
		const [paper] = parseBibtex('@unpublished{draft,title={{Draft}},journal={Under review},listingyear=2027,public={wp}}');
		expect(paper.citation).toContain('note         = {Under review}');
		expect(paper.citation).not.toMatch(/journal|year|2027|public/);
	});

	test("the compact citation excludes fields used only on the website", () => {
		const [paper] = parseBibtex('@article{lake,title={A lake},author={River, Morgan},venue={Notes},journal={Field Notes},year=2024,abstract={Short note.},starredauthor={Morgan River},url={https://example.org/lake}}');
		expect(paper.starredAuthor).toBe("Morgan River");
		expect(paper.authors).toContain(paper.starredAuthor);
		expect(parseBibtex(paper.citation)[0].venue).toBe("Field Notes");
		expect(paper.citation).not.toMatch(/^\s*(abstract|venue|starredauthor|url)\s*=/m);
	});
});
