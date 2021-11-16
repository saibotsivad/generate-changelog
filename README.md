# ChangeJournal

Change logs are often cryptic, hash-based log entries, technically useful but also hard to track through as a human, and wasting precious time as merge conflicts in pull requests. We need a better way: change *journals*.

Here's the overview:

* When you propose a change (aka a pull request) you also create a change-journal file.
* That file is the human-readable description of what changed.
* Since it's part of a pull request, your proposal history can exist with edits to language and grammar.
* The file is structured so that it can be programmatically merged with other similar files, to generate a human-readable "journal" of changes.

## Install

The normal way:

```sh
npm install changejournal --save-dev
```

## Using

There are three times where you will interact with the change-journal:

1. When you propose a change, e.g. make a pull request.
2. When you inspect a change as part of a review process.
3. When you merge a change.

### 1. Proposing a Change

the idea is that you have a folder like /changelog in your project

any pull request adds one or more yaml files like this:

```yaml
security:
  - Stuffs on fire yo.
fix:
  - More fixes.
```

any file name is fine, but by convention probably use ticket ids or dates or something to prevent collisions aka merge conflicts

this kind of supposes that you get X (more than 1) pull requests into a develop branch, and then at the end you generate a final changelog before releasing to production with a new version number

(it can still be only 1 pull request, it'll function just the same, with the same advantages)

now there are never any changelog merge conflicts

its easy to update or add pull request changelog entries, either by editing that file or adding a new one

### 2. Inspecting Changes

as part of automated tests you would run something like

```
node ./changelog.js ./changelog
```

if there isn't a changelog entry at all, it'll throw an error

if the changelog entries aren't valid it'll throw

### 3. Merging Changes

at the end, you would run like

```
node ./changelog.js ./changelog ./package.json
```

and it would spit out some nicely formatted markdown that you would save to a release file

so like then you'd have maybe something like

```
/releases
	/3.2.1.md
	/3.3.0.md
	etc.
```







----------------------------------------------------------------------------------------


## IN PARTICULAR

The proposition of previous things was that a changelog should come from
the git commits.

This does not make sense

- git commits are harder to review and edit in most UIs
- git commits are written to developers attempting to find details about changes
- changelogs are versioning notes, staged pre-release, meant for human consumption

Keeping notes in git commits is gate-keeping: you can't contribute (even with
simple things like documentation updates) unless you can git-rebase-interactive

using this, you can review peer reviews, suggest wording changes, etc, then squash

changelogs are both for humans (is this something I care about?) and machines (beep boop)

## MORE SPECIFIC TECHNICAL NOTES

You have a folder that you're designating the "input" folder. When people make pull requests, they put their YAML file in that folder.

You can merge and leave them all alone, say if you stack up a bunch of changes before releasing.

You would want (as an option) the ability to say "here are the release notes total given these bunch of YAML files".

Then when you go to do the actual release, you'd want to clear out the old files.

Commands:

- just the one, with options?

Options:

- where all the inputs are (a folder)
- whether to delete the inputs as part of command
- what format to output (yaml, md, json)
- where to (if any) write the aggregate output (or stdout???)
- what version???
	- version should be based on changes!!!
	- but in qa/etc you need some control...
	- maybe simply a flag for "unreleased" is good enough?
- run command and get back patch/minor/major to use with `npm version` (maybe with flag?)
