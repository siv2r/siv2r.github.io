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
