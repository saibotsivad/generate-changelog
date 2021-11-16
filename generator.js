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
		data: yaml.load(readFileSync(join(folder, filename), 'utf8'))
	}))

const allowedTypes = [
	'add',
	'breaking',
	'change',
	'deprecate',
	'fix',
	'remove',
	'security'
]

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
				errors.push(`Found non-array entry for "${key}" key. Each change type entry must be an array of string messages.`)
			} else {
				data[key].forEach((entry, index) => {
					if (typeof entry !== 'string') {
						errors.push(`Found non-string array entry at "${key}.${index}". All array entries must be strings.`)
					}
				})
			}
		})
	}
	return errors.map(error => ({ filename, error }))
}

const validateYamlFiles = files => files.map(validateYamlFile).flat().filter(Boolean)

const validateFiles = files => {
	if (!files.length) {
		console.log('No change entries found. Pull requests must have a changelog file.')
		process.exit(1)
	}
	const errors = validateYamlFiles(files)
	if (errors.length) {
		errors.forEach(({ filename, error }) => { console.log(error) })
		process.exit(1)
	}
	return files
}

module.exports = {
	validateFiles
}
