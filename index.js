const { version } = require('./package.json')
const { readdirSync, readFileSync } = require('fs')
const { join } = require('path')
const sade = require('sade')
const semver = require('semver')
const yaml = require('js-yaml')
const wrap = require('word-wrapper')

const getChangelogYamlFiles = folder => readdirSync(folder)
	.map(filename => ({
		filename,
		data: yaml.safeLoad(readFileSync(join(folder, filename), 'utf8'))
	}))

const allowedTypes = [ 'add', 'breaking', 'change', 'deprecate', 'fix', 'remove', 'security' ]

const getRelease = map => {
	if (map.breaking) return 'major'
	if (map.add) return 'minor'
	return 'patch'
}

const validateYamlFile = ({ filename, data }) => {
	const errors = []
	if (typeof data !== 'object') {
		errors.push('File contents were not parsed as an object.')
	} else {
		Object.keys(data).forEach(key => {
			if (!allowedTypes.includes(key)) {
				errors.push(`Found unsupported change type "${key}". Supported keys: ${allowedTypes.join(', ')}`)
			} else if (!Array.isArray(data[key])) {
				errors.push(`Found non-array entry for "${key}" key. Each change type entry needs an array of string messages.`)
			} else {
				data[key].forEach((entry, index) => {
					if (typeof entry !== 'string') {
						errors.push(`Found non-string array entry at "${key}.${index}".`)
					}
				})
			}
		})
	}
	return errors.length
		? errors.map(line => `[${filename}] ${line}`)
		: null
}

const validateYamlFiles = files => files.map(validateYamlFile).flat().filter(Boolean)

const loadAndValidate = folder => {
	const files = getChangelogYamlFiles(folder)
	if (!files.length) {
		console.log('No change entries found.')
		process.exit(1)
	}
	const errors = validateYamlFiles(files)
	if (errors.length) {
		errors.forEach(error => { console.log(error) })
		process.exit(1)
	}
	return files
}

const prog = sade('changelog').version(version)

prog.command('validate <folder>')
	.describe('Validate the YAML files in a changelog folder.')
	.action(async (folder) => {
		loadAndValidate(folder)
		console.log('No errors found.')
		process.exit(0)
	})

prog.command('condense <folder> <package>')
	.option('--lineWidth, -l', 'The line width at which to wrap change entries. [Default: 80]')
	.option('--date, -d', 'Specify exact date string. [Default: current time in ISO format]')
	.describe('Condense the YAML files in a changelog folder into a single file, auto detecting new version number from package.json file.')
	.action(async (folder, package, opts) => {
		const files = loadAndValidate(folder)
		const condensed = files.reduce((map, { data }) => {
			Object.keys(data).forEach(key => {
				map[key] = map[key] || []
				map[key].push(...data[key])
			}, {})
			return map
		}, {})

		const { version: oldVersion } = require(package)
		const versionHeader = `# ${semver.inc(oldVersion, getRelease(condensed))} (${opts.date || new Date().toISOString().substr(0, 10)})` + '\n'
		const typeHeader = type => '\n## ' + type[0].toUpperCase() + type.substr(1) + ':\n\n'
		const formatChangeText = text => {
			const lines = wrap(text, { width: opts.lineWidth || 80 }).split('\n')
			return lines.map((line, index) => {
				if (index) return `  ${line}`
				return `* ${line}`
			}).join('\n') + '\n'
		}

		const markdown = allowedTypes.reduce((lines, type) => {
			if (condensed[type]) {
				lines.push(typeHeader(type))
				condensed[type].forEach(text => {
					lines.push(formatChangeText(text))
				})
			}
			return lines
		}, [ versionHeader ])
		console.log(markdown.join('').trim())
	})

prog.parse(process.argv)