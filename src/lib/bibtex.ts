interface BibAuthor {
	given: string;
	family: string;
	suffix?: string;
	literal?: string;
}

type AbstractPart = string | { tag: 'strong' | 'sub'; text: string };

export interface BibEntry {
	id: string;
	type: string;
	title: string;
	authors: string[];
	starredAuthor?: string;
	citation: string;
	citationKey?: string;
	year?: number;
	listingYear?: number;
	venue?: string;
	url?: string;
	doi?: string;
	volume?: string;
	number?: string;
	pages?: string;
	abstract?: string;
	abstractParagraphs?: AbstractPart[][];
	abstractSource?: string;
	category: string;
	keywords: string[];
}

function decodeText(value: string): string {
	return value.replace(/(?<!\\)[{}]/g, '').replace(/\\([{}%&_#$])/g, '$1').replace(/\s+/g, ' ');
}

function displayText(value: string): string {
	return decodeText(value).trim();
}

function abstractParagraph(raw: string): AbstractPart[] {
	const text = raw.trim().replace(/\s+/g, ' ');
	const parts: AbstractPart[] = [];
	let start = 0;
	for (const match of text.matchAll(/\\textbf\{([^{}]+)\}|(?<!\\)\$((?:\\.|[^\\$])+)\$/g)) {
		parts.push(decodeText(text.slice(start, match.index)));
		if (match[1] !== undefined) {
			parts.push({ tag: 'strong', text: decodeText(match[1]) });
		} else {
			const math = match[2].replace(/\\times\b/g, '×').replace(/\\sqrt\{(\w)\}/g, '√$1');
			const tokens = math.split(/((?<!\\)_(?:\{[^{}]+\}|[a-zA-Z0-9]))/);
			for (const [index, token] of tokens.entries()) {
				if (index % 2 === 1) {
					parts.push({ tag: 'sub', text: decodeText(token.slice(1)) });
				} else {
					parts.push(decodeText(token));
				}
			}
		}
		start = match.index + match[0].length;
	}
	parts.push(decodeText(text.slice(start)));
	return parts.filter(part => part !== '');
}

function splitOutsideBraces(value: string, separator: RegExp): string[] {
	const delimiter = new RegExp(separator.source, 'iy');
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < value.length; i++) {
		if (value[i] === '\\') { i++; continue; }
		if (value[i] === '{') depth++;
		if (value[i] === '}') depth--;
		delimiter.lastIndex = i;
		const match = depth === 0 ? delimiter.exec(value) : null;
		if (match) {
			parts.push(value.slice(start, i).trim());
			i += match[0].length - 1;
			start = i + 1;
		}
	}
	parts.push(value.slice(start).trim());
	return parts.filter(Boolean);
}

function nameParts(name: string): BibAuthor {
	const trimmed = name.trim();
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		return { literal: displayText(trimmed), given: '', family: '' };
	}
	const commaParts = splitOutsideBraces(trimmed, /,/).map(displayText);
	if (commaParts.length > 1) {
		return {
			family: commaParts[0],
			given: commaParts.at(-1) ?? '',
			...(commaParts.length > 2 ? { suffix: commaParts[1] } : {}),
		};
	}
	const words = splitOutsideBraces(trimmed, /\s+/);
	const particle = words.findIndex((word, index) => index > 0 && /^\p{Ll}/u.test(word));
	const familyStart = particle === -1 ? words.length - 1 : particle;
	return {
		given: displayText(words.slice(0, familyStart).join(' ')),
		family: displayText(words.slice(familyStart).join(' ')),
	};
}

function displayAuthor(author: BibAuthor): string {
	return author.literal ?? [author.given, author.family].filter(Boolean).join(' ') +
		(author.suffix ? `, ${author.suffix}` : '');
}

function condensedBibtex(type: string, id: string, fields: Record<string, string>): string {
	const underReview = fields.journal === 'Under review';
	const citationType = underReview ? 'unpublished' : type;
	const values = { ...fields };
	if (underReview) {
		delete values.journal;
		values.note = 'Under review';
	}

	const lines: string[] = [];
	for (const name of ['author', 'title', 'journal', 'booktitle', 'series', 'volume', 'number', 'pages', 'publisher', 'year', 'note']) {
		const value = values[name]?.trim().replace(/\s+/g, ' ');
		if (!value) continue;
		const prefix = '  ' + name.padEnd(12) + ' = {';
		const content = name === 'author'
			? splitOutsideBraces(value, /\s+and\s+/).join(' and\n' + ' '.repeat(prefix.length))
			: value;
		lines.push(prefix + content + '}');
	}
	return '@' + citationType + '{' + id + ',\n' + lines.join(',\n') + '\n}';
}

function skipTrivia(source: string, start: number): number {
	let i = start;
	while (i < source.length) {
		if (/\s/.test(source[i])) i++;
		else if (source[i] === '%') {
			const end = source.indexOf('\n', i);
			i = end === -1 ? source.length : end + 1;
		} else break;
	}
	return i;
}

// Read one balanced entry or field, without treating braces inside quoted fields as entry boundaries.
function readBlock(source: string, start: number, entry = false) {
	const opener = source[start];
	const closer = opener === '(' ? ')' : opener === '"' ? '"' : '}';
	let depth = 0;
	let quoted = false;
	for (let i = start + 1; i < source.length; i++) {
		const char = source[i];
		if (char === '\\') { i++; continue; }
		if (entry && depth === 0 && !quoted && char === '%') {
			i = skipTrivia(source, i) - 1;
			continue;
		}
		if (entry && depth === 0 && char === '"') { quoted = !quoted; continue; }
		if (!quoted && depth === 0 && char === closer) return { value: source.slice(start + 1, i), end: i + 1 };
		if (char === '{') depth++;
		if (char === '}') depth--;
		if (depth < 0) break;
	}
	throw new Error(`Unterminated BibTeX block: ${source.slice(start, start + 60)}`);
}

function parseFields(body: string, macros: Map<string, string>): Record<string, string> {
	const fields: Record<string, string> = {};
	let index = skipTrivia(body, 0);
	while (index < body.length) {
		const keyMatch = body.slice(index).match(/^([A-Za-z][\w-]*)\s*=\s*/);
		if (!keyMatch) throw new Error(`Invalid BibTeX field near: ${body.slice(index, index + 60)}`);
		const key = keyMatch[1].toLowerCase();
		index += keyMatch[0].length;
		let value = '';
		do {
			index = skipTrivia(body, index);
			if (body[index] === '{' || body[index] === '"') {
				const block = readBlock(body, index);
				value += block.value;
				index = block.end;
			} else {
				const token = body.slice(index).match(/^[\w:+.-]+/)?.[0];
				if (!token) throw new Error(`Missing BibTeX value for ${key}`);
				const expanded = /^\d+$/.test(token) ? token : macros.get(token.toLowerCase());
				if (expanded === undefined) throw new Error(`Undefined BibTeX string: ${token}`);
				value += expanded;
				index += token.length;
			}
			index = skipTrivia(body, index);
			if (body[index] !== '#') break;
			index++;
		} while (index <= body.length);
		fields[key] = value;
		if (index < body.length && body[index] !== ',') throw new Error(`Expected comma after BibTeX field ${key}`);
		index = skipTrivia(body, index + 1);
	}
	return fields;
}

export function parseBibtex(raw: string): BibEntry[] {
	const entries: BibEntry[] = [];
	const ids = new Set<string>();
	const macros = new Map(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		.map((month) => [month.slice(0, 3).toLowerCase(), month]));
	let index = 0;
	while (index < raw.length) {
		index = skipTrivia(raw, index);
		if (index >= raw.length) break;
		if (raw[index] !== '@') { index++; continue; }
		const header = raw.slice(index).match(/^@(\w+)\s*([{(])/);
		if (!header) throw new Error(`Invalid BibTeX entry near: ${raw.slice(index, index + 60)}`);
		const type = header[1].toLowerCase();
		const block = readBlock(raw, index + header[0].length - 1, true);
		index = block.end;
		if (type === 'comment' || type === 'preamble') continue;
		if (type === 'string') {
			for (const [key, value] of Object.entries(parseFields(block.value, macros))) macros.set(key, value);
			continue;
		}
		const comma = block.value.indexOf(',');
		const id = block.value.slice(0, comma).trim();
		if (comma < 1 || !id) throw new Error('BibTeX entry needs a citation key and fields');
		if (ids.has(id)) throw new Error(`Duplicate BibTeX key: ${id}`);
		ids.add(id);
		const fields = parseFields(block.value.slice(comma + 1), macros);
		if (!fields.title?.trim()) throw new Error(`BibTeX entry ${id} needs a title`);
		const authorParts = fields.author ? splitOutsideBraces(fields.author, /\s+and\s+/).map(nameParts) : [];
		const abstractParagraphs = fields.abstract?.split(/\r?\n\s*\r?\n/).map(abstractParagraph).filter(parts => parts.length);
		const text = (key: string) => fields[key] ? displayText(fields[key]) : undefined;
		const publicField = text('public')?.toLowerCase();
		const readYear = (key: 'year' | 'listingyear') => {
			const value = text(key);
			if (value === undefined) return undefined;
			const year = Number(value);
			if (!Number.isInteger(year)) throw new Error(`Invalid BibTeX ${key} in ${id}`);
			return year;
		};
		entries.push({
			id, type,
			title: displayText(fields.title),
			authors: authorParts.map(displayAuthor),
			starredAuthor: text('starredauthor'),
			citation: condensedBibtex(type, id, fields),
			citationKey: text('citationkey'),
			year: readYear('year'),
			listingYear: readYear('listingyear'),
			venue: text('venue') ?? text('journal') ?? text('booktitle') ??
				(type === 'unpublished' && text('note')?.toLowerCase() === 'under review' ? 'Under review' : undefined),
			url: text('url'),
			doi: text('doi'),
			volume: text('volume'),
			number: text('number'),
			pages: text('pages'),
			abstract: abstractParagraphs?.map(parts => parts.map(part => {
				if (typeof part === 'string') return part;
				return part.tag === 'sub' ? '_' + part.text : part.text;
			}).join('')).join('\n\n'),
			abstractParagraphs,
			abstractSource: text('abstractsource'),
			category: publicField === 'yes' || publicField === 'pub' ? 'Publication' : publicField === 'wp' ? 'Working Paper' : publicField === 'wip' ? 'Work in Progress' : 'Other',
			keywords: text('keywords')?.split(',').map((keyword) => keyword.trim()).filter(Boolean) ?? [],
		});
	}
	return entries.sort((a, b) => (b.listingYear ?? b.year ?? 0) - (a.listingYear ?? a.year ?? 0));
}
