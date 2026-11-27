"""Build a relocatable export for the current GitHub repository."""
import os
import re
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
output = root / "site-export"


def pages_url():
    override = os.environ.get("SITE_URL")
    if override:
        url = urlsplit(override)
        if url.scheme not in ("http", "https") or not url.netloc or url.query or url.fragment:
            raise SystemExit("SITE_URL must be a full site URL, optionally including a project path.")
        return override.rstrip("/") + "/"
    remote = subprocess.run(
        ["git", "remote", "get-url", "origin"], cwd=root, capture_output=True, text=True
    ).stdout.strip()
    match = re.fullmatch(
        r"(?:https://github\.com/|git@github\.com:|ssh://git@github\.com/)"
        r"([\w.-]+)/([\w.-]+?)(?:\.git)?/?", remote, re.I,
    )
    if not match:
        raise SystemExit("Set SITE_URL to your public site address, or add a GitHub origin remote.")
    owner, repo = match.groups()
    host = owner.lower() + ".github.io"
    return f"https://{host}/" if repo.lower() == host else f"https://{host}/{repo}/"


if output.exists() and (output.is_symlink() or not (output / ".nojekyll").is_file()):
    raise SystemExit("site-export already exists and is not a generated export. Move it before building.")
url = pages_url()
print(f"Building for {url}", flush=True)
subprocess.run(["pnpm", "run", "build"], cwd=root, env={**os.environ, "SITE_URL": url}, check=True)
with TemporaryDirectory(prefix=".pages-build-", dir=root) as temp:
    staged = Path(temp) / "site"
    subprocess.run([sys.executable, root / "scripts/portable.py", staged], check=True)
    if output.exists():
        output.rename(Path(temp) / "previous")
    staged.rename(output)
print(f"Static site is ready in {output.name}/.")
