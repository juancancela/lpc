#! /usr/bin/env node

/**
 *  LPC
 *  @author Juan Carlos Cancela <cancela.juancarlos@gmail.com>
 */

const express = require('express')
const colors = require('colors')
const fetch = require('node-fetch')
const fs = require('fs')
const program = require('commander')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const app = express()
const { log } = console
const { readdirSync } = fs

const DEFAULT_PROTOCOL = 'https'
const DEFAULT_PORT = 13376
const STORAGE_FOLDER_NAME = 'storage'
const STORAGE_FULL_PATH = require('path').join(__dirname, `/${STORAGE_FOLDER_NAME}`)

program
    .option('-port, --port <number>', 'port to be used by lpc', DEFAULT_PORT)
    .option('-protocol, --protocol <http|https>', 'protocol of proxied target', DEFAULT_PROTOCOL)
    .requiredOption('-hostname, --hostname <value>', 'hostname of proxied target')
program.parse(process.argv)

const encode = data => new Buffer(data).toString('base64')

const isResourceCached = resourceFileName =>
    readdirSync(`./${STORAGE_FOLDER_NAME}`).some(fileName => fileName.startsWith(resourceFileName))

const getResourceContentType = content => content.headers.get('content-type')

const getResourceExtension = (contentType, resourceFileName, resourceUrlExtension) => {
    if (contentType && contentType !== 'unknown') return `.${contentType.split('/')[1]}`
    if (resourceUrlExtension) return `.${resourceUrlExtension}`
    if (resourceFileName) return `.${resourceFileName.split('.')[1]}`
    return ''
}

const getResourcePath = (resourceUrl, resourceFileName, resourceUrlExtension, content) =>
    `${STORAGE_FULL_PATH}/${encode(resourceUrl)}${getResourceExtension(
        getResourceContentType(content),
        resourceFileName,
        resourceUrlExtension
    )}`

const getResourceUrlExtension = resourceUrl => {
    const name = resourceUrl.split('/')[resourceUrl.split('/').length - 1]
    const extension = name.split('.').length >= 2 ? name.split('.')[name.split('.').length - 1] : ''
    return extension
}

const cacheHitStrategy = (resourceFileName, resourceUrl, res) => {
    log(`[LPC][CACHE HIT] ${resourceUrl}`.bgGreen.brightWhite)
    const fileName = readdirSync(`./${STORAGE_FOLDER_NAME}`).filter(fileName =>
        fileName.startsWith(resourceFileName)
    )[0]
    res.sendFile(`${STORAGE_FULL_PATH}/${fileName}`)
}

const cacheMissStrategy = async (resourceUrl, resourceFileName, resourceUrlExtension, res) => {
    log(`[LPC][CACHE MISS] ${resourceUrl}`.bgMagenta.brightWhite)
    let resourcePath
    try {
        const content = await fetch(resourceUrl)
        const buffer = await Buffer.from(await content.arrayBuffer())
        resourcePath = getResourcePath(resourceUrl, resourceFileName, resourceUrlExtension, content)
        await writeFile(resourcePath, buffer)
        return res.sendFile(resourcePath)
    } catch (error) {
        log(`[LPC][ERROR] ${resourcePath} - ${error}`.underline.red)
    }
}

app.use(async (req, res) => {
    const { protocol, hostname } = program
    const { originalUrl } = req
    const resourceUrl = `${protocol}://${hostname}${originalUrl}`
    const resourceFileName = encode(resourceUrl)
    const resourceUrlExtension = getResourceUrlExtension(resourceUrl)

    isResourceCached(resourceFileName)
        ? cacheHitStrategy(resourceFileName, resourceUrl, res)
        : await cacheMissStrategy(resourceUrl, resourceFileName, resourceUrlExtension, res)
})

app.listen(program.port, () => log(`[LPC][APP] listening on port ${program.port}`.bgBlack.brightGreen))
