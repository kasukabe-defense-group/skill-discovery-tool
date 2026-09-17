# Contributing

`main` is protected. Every change comes in through a pull request — no
direct pushes, even for admins. No approval is required to merge, so
this isn't a bottleneck, it just means every change is a visible diff
first, and there's always a clean point to revert from if something
breaks.

## One-time setup

Clone the repo once, per person, per machine:

```
git clone https://github.com/kasukabe-defense-group/skill-discovery-tool.git
```

Copy `.env.example` to `.env.local` and fill in real values. Never put
real keys anywhere else — `.env.local` is gitignored on purpose.

## Every time you start a new task

Make sure you're starting from the latest `main`:

```
git checkout main
git pull
```

Then branch off it. Name the branch `your-name/what-youre-doing`:

```
git checkout -b your-name/what-youre-doing
```

Do the work, commit as you go:

```
git add .
git commit -m "short description of what changed"
```

Push it up (first push on a new branch needs `-u`):

```
git push -u origin your-name/what-youre-doing
```

Open a pull request on GitHub from your branch into `main`. Merge it
yourself once you're happy with it — feel free to ask someone to glance
at it first if you want a second opinion, but it's not a blocking gate.

Afterward, switch back to `main`, pull, and branch again for the next
task:

```
git checkout main
git pull
git checkout -b your-name/next-thing
```

## Keys and secrets

Never commit a `.env` file or paste a real key into any tracked file.
Locally they live in `.env.local`. Once deployed, they live in Vercel's
environment variable settings instead.
