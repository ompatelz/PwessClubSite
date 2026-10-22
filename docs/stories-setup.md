# Stories publishing

`/Blog` is the public home for signed Press Club writing. Each article opens at
`/Blog/<slug>`.

Campus Tea remains separate at `/Tea`; moderation remains at `/press-club`.

## Publish a blog

Use the private Supabase dashboard and create a row in `blog_posts` with:

- `slug`: lowercase words separated by hyphens
- `title`: the public headline
- `excerpt`: a short standfirst for the Stories index
- `body`: plain-text paragraphs separated by blank lines
- `author`: the credited writer or desk
- `status`: keep `draft` while editing; set `published` when approved
- `published_at`: the public publication date and time

Draft rows are not readable through the public API. A published row also needs a non-null `published_at`; the database rejects incomplete publication attempts.

## Tea

Tea continues to use `/Tea` for submissions and `/press-club` for moderation. Only posts marked `published` appear on `/Tea`.

## Future workflow

A first-party blog editor can replace dashboard publishing later. Until then, keep Supabase dashboard access limited to trusted Press Club editors.
