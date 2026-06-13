# Publishing checklist

## Update Blogs

When a new post goes up on https://siv2r.substack.com:

If you have staged changes, commit or stash them first.
`./sync.sh` will refuse to run if you have staged changes.

```bash
./sync.sh
```

The script fetches the feed, rewrites the latest-posts list in
`index.html`, and stages the change.

## Notes (siv2r.in/notes/)

Notes are authored in the Obsidian vault (`~/Notes/knowledge/`) and selected via
`~/Notes/knowledge/_published.md`. To publish:

1. One-time setup on a new machine: `npm ci`.
2. Edit notes in Obsidian. Enable the Excalidraw plugin's SVG auto-export so embedded
   drawings have a sibling `.svg`.
3. Update `_published.md` to add, remove, reorder, or re-blurb notes.
4. Run `npm run build:notes` (or `scripts/build-notes.sh`).
5. Review the printed report and the git diff, then commit `notes/` and `notes.css`.

The vault path defaults to `~/Notes`. Override it with the `VAULT_PATH` env var.
