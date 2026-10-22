# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DAU students and the wider campus community use the site to read Press Club publications, follow current campus writing, and submit anonymous Tea for editorial review. Press Club members maintain publication archives, write signed blog posts, and moderate Tea before publication.

## Product Purpose

The Press Club website is DAU's public home for its flagship Entelechy magazine, NNN, signed online stories, and moderated anonymous campus conversation. Success means readers can quickly distinguish these formats, find current and archived work, and understand who is accountable for each kind of writing.

## Positioning

One student newsroom works at multiple speeds: archived publications preserve the record, signed blogs respond between editions, and anonymous Tea lets students contribute through a moderation gate.

## Operating Context

Readers browse the public site without an account. Tea submissions go to a private Press Club review desk before publication. Publication PDFs and blog metadata are maintained in Supabase; production runs on Vercel.

## Capabilities and Constraints

- Entelechy and NNN are PDF publication archives, with Entelechy treated as the flagship throughout the interface.
- Blogs are signed Press Club stories with a public index and individual reading pages.
- Tea is anonymous, but every submission must be reviewed before it becomes public.
- Service credentials remain server-only; public database reads are limited with row-level security.
- The editorial interface for creating blogs remains an open decision; initial publishing uses the private Supabase project dashboard.

## Brand Commitments

The product name is The Press Club at Dhirubhai Ambani University. Existing copy distinguishes the quick campus pulse from the long view and uses direct, editorial language without fabricated claims or content.

## Evidence on Hand

The repository contains the live Next.js site, a working Tea moderation flow, Entelechy and NNN archive foundations, one published authentic Entelechy edition, and one unapproved NNN PDF. Clearly labelled test drafts exist only to exercise the Blog and Tea editorial workflows; they are not authentic campus reporting.

## Product Principles

- Make authorship and anonymity unmistakable.
- Publish nothing before its editorial gate is satisfied.
- Keep current stories discoverable without weakening the publication archives.
- Never fabricate campus reporting, editions, authors, or engagement.
- Make every public reading surface usable on mobile and with reduced motion.
