"""Make a built Astro site work under a project path or directly from disk."""
from argparse import ArgumentParser
from base64 import b64encode
from functools import cache
from html.parser import HTMLParser
from html import escape
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlsplit, urlunsplit
from xml.etree import ElementTree as ET

parser = ArgumentParser()
parser.add_argument("destination", type=Path)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
source = project / "dist"
out = args.destination.resolve()
if out == source or out.is_relative_to(source) or source.is_relative_to(out):
    raise SystemExit("Choose a separate destination outside the input dist tree.")
out.mkdir(parents=True, exist_ok=True)
shutil.copytree(source, out, dirs_exist_ok=True)

def relative_url(url, page):
    if not url.startswith("/") or url.startswith("//"):
        return url
    parsed = urlsplit(url)
    path = source / parsed.path.lstrip("/")
    if path.is_dir():
        path /= "index.html"
    return urlunsplit(("", "", os.path.relpath(path, page.parent), parsed.query, parsed.fragment))

@cache
def bundled_script(url):
    entry = source / url.lstrip("/")
    # pnpm stores Astro's pinned esbuild binary in its virtual store.
    binary = next(project.glob("node_modules/.pnpm/esbuild@*/node_modules/esbuild/bin/esbuild"))
    output = subprocess.check_output([binary, entry, "--bundle", "--format=iife", "--minify", "--log-level=error"], text=True)
    return output.replace("</script", r"<\/script")

class PortablePage(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=False)
        self.page, self.parts = page, []

    def start(self, tag, attrs, *, closed):
        attr = dict(attrs)
        if tag == "script" and attr.get("type") == "module" and attr.get("src", "").startswith("/"):
            self.parts.extend(['<script type="module">', bundled_script(attr["src"])])
            return
        rendered = []
        for name, value in attrs:
            if value is None:
                rendered.append(name)
                continue
            if name in ("href", "src", "poster"):
                value = relative_url(value, self.page)
            if name == "srcset":
                value = re.sub(r"(?<!\S)/[^,\s]+", lambda m: relative_url(m.group(), self.page), value)
            rendered.append(f'{name}="{escape(value, quote=True)}"')
        attributes = " " + " ".join(rendered) if rendered else ""
        self.parts.append(f"<{tag}{attributes}{'/' if closed else ''}>")

    def handle_starttag(self, tag, attrs): self.start(tag, attrs, closed=False)
    def handle_startendtag(self, tag, attrs): self.start(tag, attrs, closed=True)
    def handle_endtag(self, tag): self.parts.append(f"</{tag}>")
    def handle_data(self, data): self.parts.append(data)
    def handle_decl(self, decl): self.parts.append(f"<!{decl}>")
    def handle_comment(self, data): self.parts.append(f"<!--{data}-->")
    def handle_entityref(self, name): self.parts.append(f"&{name};")
    def handle_charref(self, name): self.parts.append(f"&#{name};")

for file in source.rglob("*.html"):
    page = PortablePage(file)
    page.feed(file.read_text())
    page.close()
    (out / file.relative_to(source)).write_text("".join(page.parts))

for file in source.rglob("*.css"):
    def css_asset(m):
        url = m.group(2)
        asset = source / url.lstrip("/")
        if asset.suffix in (".woff", ".woff2") and asset.exists():
            # Fonts loaded from a file: URL are restricted by some browsers.
            data = b64encode(asset.read_bytes()).decode()
            return f'url("data:font/{asset.suffix[1:]};base64,{data}")'
        return f'url("{relative_url(url, file)}")'
    css = re.sub(r"""url\((["']?)(/[^/)'"]*[^)'"]*?)\1\)""", css_asset, file.read_text())
    (out / file.relative_to(source)).write_text(css)

# Astro's sitemap generator builds URLs relative to its base ("/"). The
# robots.txt route advertises the actual publication URL, including any subpath.
index_name = "sitemap-index.xml"
listed_index = re.search(r"^Sitemap:\s*(\S+)", (source / "robots.txt").read_text(), re.MULTILINE)
if listed_index is None:
    raise ValueError("Expected robots.txt to advertise the sitemap index.")
public_root = listed_index[1].rsplit("/", 1)[0] + "/"
namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", namespace)
index = ET.parse(source / index_name)
for loc in index.findall("{*}sitemap/{*}loc"):
    original_root, filename = loc.text.rsplit("/", 1)
    if not (source / filename).is_file() or urlsplit(loc.text).netloc != urlsplit(public_root).netloc:
        continue
    loc.text = public_root + filename
    sitemap = ET.parse(source / filename)
    for entry in sitemap.findall("{*}url"):
        page = entry.find("{*}loc")
        if not page.text.startswith(original_root + "/"):
            continue
        route = page.text[len(original_root) + 1:]
        page.text = public_root + route
    sitemap.write(out / filename, encoding="utf-8", xml_declaration=True)
index.write(out / index_name, encoding="utf-8", xml_declaration=True)

(out / ".nojekyll").touch()
