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

## Overview

The general strategy is to have a folder in your project that will hold the information about changes as text files, named in a way that prevents merge conflicts.

Because these are text files (not commits) editing them for language and details is simple and accessible--unlike, for example, rewriting git commits.

Because each change is in its own file, likelihood of a merge conflict is very low--unlike, for example, trying to keep a single `CHANGELOG.md` file conflict-free.

As part of your release strategy, you would take all text files in the specified folder and merge them into a single text file. That final text file would be your official changelog.

## Details

In a typical flow, there are three main times where you will interact with the change-journal:

1. When creating a change, e.g. making a pull request.
2. When inspecting a change, e.g. the peer review step.
3. When publishing changes, e.g. when making a release.

> Note: All CLI examples use the long-form version for readability, but there are shorter flags available. If no flags are passed in, it will look for a configuration file `changejournal.config.js` for the required properties.

### 1. Create a Change

When making a change, e.g. a pull request or similar, you would create one or more text YAML files in the configured folder, for example in `/changes` create a file `2021-12-09-some-things.yml`.

The file name is not used internally, so it only needs to be unique enough to prevent duplicates between releases, but it's best to adopt a convention to reduce risk of merge conflicts. Using ticket IDs or dates is natural, then add a few words to describe it. For example:

- In a Jira team, if the project is `PROJ` and ticket ID is `123`: `/changes/PROJ-123-refactor-scaffold.yml`
- In a less formal team, using an approximate date when the developer started the work: `/changes/2021-12-09-refactor-scaffold.yml`
- In a team with fewer changes, using names might be enough: `/changes/refactor-scaffold.yml`

The files themselves are YAML or JSON, and have a simple structure: the key is the "type" of change (e.g. `added`, `security`, etc.) and the value is the human-readable change message.

```yaml
added:
  - Shopping cart widget handles multiple languages. See the [docs](/link.html) for details.
fix:
  - Initializing request-parser without timezone no longer fails.
```

If you use a type and scope (usually the format `type[scope]: message`) you can also use the slightly-deeper structure:

```yaml
added:
  cart:
    - Shopping cart widget handles multiple languages. See the [docs](/link.html) for details.
fix:
  http:
    - Initializing request-parser without timezone no longer fails.
```

(Note: you can also do the inverse, e.g. `cart -> added` instead of `added -> cart` if you want. Just do `cart` as a type and `added` as a scope.)

The CLI tool can help you create or append a change message file:

```shell
changejournal change # CLI UI will ask questions
```

Or pass in the parameters for a non UI version:

```shell
changejournal change \
	--type fix \
	--scope http \
	--semver major \
	--message "Initializing request dies without timezone."
```

### 2. Inspecting a Change

To validate all change files, as part of automated pull-request testing for example, you will want to make sure all files are valid YAML and use the right types and/or scopes:

```shell
changejournal test --folder=./changes
```

The CLI output is a markdown-formatted, human-readable summary of the validity of all files in the specified folder, as well as the overall highest semver bump, which you could use to e.g. post to the pull request as a bot message or generated report.

If a change file is an invalid format, or has an unspecified type or scope, the program will exit with an error.

> Note: it is the intention of the author to provide additional automated tooling for Github Workflows and Bitbucket Pipelines, e.g. "assert that the PR triggering the Workflow has a change file" and then "post output back as a comment". These are planned to be built into the CLI tool.

### 3. Merging Changes

During a release, or at other times during the development flow (such as pre-release or some styles of QA flow), you will want to merge all change files into a single file. This file would be the release (or "release candidate") change notes, and you would then review that to make sure it was human-readable and sensible.

The merged output would also indicate what the semver version bump would be, e.g. if all changes are only `patch` level the overall release would also only be a patch version bump.

If all you want to do is figure out the semver version bump, you could simply do:

```shell
changejournal semver --folder=./changes
# => "patch"
```

Merging the change files from a folder generates a single YAML file containing all merged changes:

```shell
changejournal merge \
	--folder=./changes \
	--output=./releases \
	--file=v1.2.3.yaml
```

You'll notice that the `output` parameter requires the full version number to be set, which may be hard to chain as a set of commands. As a help, if you pass in a folder to `output` *and* a version format with `version`, it'll generate the filename for you:

```shell
changejournal merge \
	--folder=./changes \
	--version="R-{{major}}.{{minor}}.{{patch}}" \
	--format=yaml \
	--output=./releases \
	--pretty
```

Using this approach will look in the `output` folder for existing release files, extract the highest semver numbered release, and increment based on the change file version bumps.

By default, after writing the merged files, the CLI tool will remove the change files.

For example, if the folder structure in this scenario looked like this:

```
/changes
	/PROJ-1234-refactor-scaffold.yaml
/releases
	/3.2.0.yaml
	/3.3.0.yaml
	/3.3.1.yaml
```

If the `refactor-scaffold` change file had only a `patch` version bump, the final folder structure would look like this:

```
/releases
	/3.2.0.yaml
	/3.3.0.yaml
	/3.3.1.yaml
	/3.3.2.yaml
```

## CLI Tool

Installing `changejournal` adds a CLI tool, which has sub-commands for the flow steps described.

Although you can pass in 

The CLI tool has the following options:

* `--folder/-f` *(required)* - The folder path in which to look for change files.
* `--types/--type/-t` - Comma-separated names of types. If multiple flags are used, comma-separation will not be used. (Default: `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`)
* `--scopes/--scope/-s` - Comma-separated names of types. If multiple flags are used, comma-separation will not be used. (Default: not used)
* `--output/-o` - If set, a file will be written containing all merged changes from the input fulder.
* `--format/-f` - The format to write the output file. Supported: `yml`/`yaml`, `json`, `md`, `csv`. If not set, the format will be based on the output file extension, or will fall back to YAML.

also `-c` e.g. `changejournal test -c` looks for `changejournal.config.js` or `.json` then you have

```js
export default {
	folder: './changes', // changes vs staged?
	output: './???', // output for which thing?
	types: [ 'added', 'changed', 'etc' ],
	scopes: [ 'http', 'audio' ],
	format: 'json', // md, yaml, etc
}
```


```shell
changejournal test --folder=./changes \
	--types=feat,fix,docs,chore \
	--scopes=cart,http,audio
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
