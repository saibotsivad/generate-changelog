# WORK IN PROGRESS (STATUS: PRE-DRAFT)

the idea is that you have a folder like /changelog in your project

any pull request adds one or more yaml files like this:

```yaml
security:
  - Stuffs on fire yo.
fix:
  - More fixes.
```

any file name is fine, but by convention probably use ticket ids or dates or something

now there are never any changelog merge conflicts

its easy to update or add pull request changelog entries, either by editing that file or adding a new one

as part of automated tests you would run something like

```
node ./changelog.js ./changelog
```

if there isn't a changelog entry at all, it'll throw an error

if the changelog entries aren't valid it'll throw

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
