#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'node_modules', '@diffusionstudio', 'piper-wasm', 'build')
const dest = join(root, 'public', 'piper-wasm')

if (!existsSync(src)) {
  console.warn('@diffusionstudio/piper-wasm not installed, skipping copy')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })
cpSync(join(src, 'piper_phonemize.data'), join(dest, 'piper_phonemize.data'))
cpSync(join(src, 'piper_phonemize.wasm'), join(dest, 'piper_phonemize.wasm'))
console.log('Copied Piper WASM files to public/piper-wasm/')
