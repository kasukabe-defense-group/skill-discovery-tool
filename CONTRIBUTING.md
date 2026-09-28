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

Install dependencies (also needed again any time `package.json` changes
on a branch you pull):

```
npm install
```

Requires Node >=18.17.0.

Copy `.env.example` to `.env.local` and fill in real values. Never put
real keys anywhere else — `.env.local` is gitignored on purpose.

Leaving `MATCHING_PROVIDER=mock` (the default) needs no key at all and
is enough to see every screen and state. To exercise real matching,
set `MATCHING_PROVIDER=groq` and get your **own** free key from
https://console.groq.com/keys — there's no shared key to copy from
anyone else's setup, by design.

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

Do the work, commit as you go. Name the files you changed rather than
`git add .` — it's easy to sweep in something you didn't mean to
(a stray env file, a build artifact) if the `.gitignore` ever misses it:

```
git add app/some-file.js data/skills.json
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
