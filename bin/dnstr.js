#!/usr/bin/env node

// dnstr - resolve a Nostr identity to its domain via did:nostr
// See https://did-nostr.com
//
// Usage:
//   dnstr <npub | hex pubkey | did:nostr:...>
//   dnstr --doc <id>          print the full DID document
//   DNSTR_RESOLVER=https://example.com dnstr <id>

const DEFAULT_RESOLVER = 'https://nostr.social'

// --- minimal bech32 decode (for npub) ---

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

// BIP-173 checksum: polymod over the expanded prefix plus all data
// words (including the 6 checksum words) must equal 1.
function bech32VerifyChecksum (prefix, words) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  const values = []
  for (const c of prefix) values.push(c.charCodeAt(0) >> 5)
  values.push(0)
  for (const c of prefix) values.push(c.charCodeAt(0) & 31)
  values.push(...words)
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i]
    }
  }
  return chk === 1
}

function bech32Decode (str) {
  const pos = str.lastIndexOf('1')
  if (pos < 1 || pos + 7 > str.length) throw new Error('invalid bech32')
  const prefix = str.slice(0, pos).toLowerCase()
  const words = []
  for (const c of str.slice(pos + 1).toLowerCase()) {
    const v = CHARSET.indexOf(c)
    if (v === -1) throw new Error('invalid bech32 character')
    words.push(v)
  }
  if (!bech32VerifyChecksum(prefix, words)) {
    throw new Error('invalid bech32 checksum')
  }
  // convert 5-bit words to bytes, dropping the 6-word checksum
  const data = words.slice(0, -6)
  let acc = 0
  let bits = 0
  const bytes = []
  for (const w of data) {
    acc = (acc << 5) | w
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 0xff)
    }
  }
  return { prefix, bytes }
}

// --- normalise input to a hex pubkey ---

function toHexPubkey (input) {
  let id = input.trim()

  if (id.startsWith('did:nostr:')) {
    id = id.slice('did:nostr:'.length)
  }

  if (id.startsWith('npub1')) {
    const { prefix, bytes } = bech32Decode(id)
    if (prefix !== 'npub' || bytes.length !== 32) throw new Error('invalid npub')
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  if (/^[0-9a-fA-F]{64}$/.test(id)) {
    return id.toLowerCase()
  }

  throw new Error(`unrecognised identifier: ${input}`)
}

// --- main ---

const args = process.argv.slice(2)
const showDoc = args.includes('--doc')
const name = args.find(a => !a.startsWith('--'))

if (!name) {
  console.error('Usage: dnstr [--doc] <npub | hex pubkey | did:nostr:...>')
  process.exit(1)
}

let pubkey
try {
  pubkey = toHexPubkey(name)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

const resolver = process.env.DNSTR_RESOLVER || DEFAULT_RESOLVER
const url = `${resolver}/.well-known/did/nostr/${pubkey}.json`

try {
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`Resolver returned ${res.status} for did:nostr:${pubkey}`)
    process.exit(1)
  }
  const doc = await res.json()

  if (showDoc) {
    console.log(JSON.stringify(doc, null, 2))
    process.exit(0)
  }

  const website = doc.profile?.website ||
    (Array.isArray(doc.alsoKnownAs) &&
      doc.alsoKnownAs.find(a => a.startsWith('http')))

  if (website) {
    console.log(website)
  } else {
    console.error(`No website found for did:nostr:${pubkey}`)
    process.exit(1)
  }
} catch (err) {
  console.error('Error fetching DID document:', err.message)
  process.exit(1)
}
