const FILTER_PARAM = "filter";

const initialized = new WeakSet<HTMLElement>();

function updateButton(button: HTMLButtonElement, active: boolean) {
	button.setAttribute("aria-pressed", String(active));
	button.dataset.active = String(active);
	button.classList.toggle("active", active);
}

export function setupPublicationFilters() {
	const controls = document.querySelector<HTMLElement>("[data-publication-filters]");
	if (!controls || initialized.has(controls)) return;
	initialized.add(controls);

	const buttons = Array.from(controls.querySelectorAll<HTMLButtonElement>("button[data-filter-param]"));
	const groups = Array.from(document.querySelectorAll<HTMLElement>("#papers-container [data-filter-section]"), section => ({
		section,
		year: section.dataset.filterSection!,
		papers: section.querySelectorAll<HTMLLIElement>("li[data-venue-group]"),
	}));
	const status = controls.querySelector<HTMLElement>("[data-filter-status]");
	const defaultButton = buttons.find(button => button.dataset.filter === "all")!;
	let selected = defaultButton;

	function render() {
		for (const button of buttons) updateButton(button, button === selected);
		const param = selected.dataset.filterParam;
		const value = selected.value;

		let shown = 0;
		for (const group of groups) {
			let visibleInGroup = 0;
			for (const paper of group.papers) {
				const paperValue = param === FILTER_PARAM ? group.year : paper.dataset.venueGroup;
				const visible = value === "all" || value === paperValue;
				paper.hidden = !visible;
				if (visible) visibleInGroup++;
			}
			group.section.hidden = visibleInGroup === 0;
			shown += visibleInGroup;
		}
		const label = selected.querySelector("[data-filter-label]")?.textContent ?? "All";
		if (status) {
			const noun = shown === 1 ? "publication" : "publications";
			status.textContent = value === "all" ? `${shown} ${noun} shown.` : `${shown} ${noun} shown in ${label}.`;
		}
	}

	function readLocation() {
		selected = defaultButton;
		// Links can contain multiple criteria. Honor the last valid selection.
		for (const [param, value] of new URLSearchParams(window.location.search)) {
			const match = buttons.find(button => button.dataset.filterParam === param && button.value === value);
			if (match) selected = match;
		}
		render();
	}

	function select(button: HTMLButtonElement) {
		const param = button.dataset.filterParam!;
		selected = button === selected
			? buttons.find(candidate => candidate.dataset.filterParam === param && candidate.value === "all")!
			: button;
		render();
		const url = new URL(window.location.href);
		url.searchParams.delete(FILTER_PARAM);
		url.searchParams.delete("venue");
		if (selected !== defaultButton) url.searchParams.set(param, selected.value);
		if (url.href === window.location.href) return;
		// File previews need navigation to update a query string on a file: URL.
		if (url.protocol === "file:") window.location.replace(url.href);
		else window.history.replaceState(window.history.state, "", url.href);
	}

	for (const button of buttons) {
		button.addEventListener("click", () => select(button));
	}
	window.addEventListener("popstate", readLocation);
	document.addEventListener("astro:before-swap", () => window.removeEventListener("popstate", readLocation), { once: true });
	readLocation();
}
