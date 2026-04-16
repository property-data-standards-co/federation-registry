#!/usr/bin/env node
/**
 * PDTF OpenID Federation artifact generator.
 *
 * Reads registry.json + Trust Anchor key material and produces:
 *   dist/.well-known/openid-federation   — Trust Anchor Entity Configuration (self-signed JWT)
 *   dist/entities/{slug}.jwt             — Subordinate Entity Statement per issuer
 *   dist/trust-marks/{slug}.jwt          — Property Trust Mark JWT per issuer
 *   dist/CNAME                           — GitHub Pages custom domain
 */

import { readFileSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ed25519 } from '@noble/curves/ed25519';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function signJwt(header, payload, privateKeyBytes) {
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;
  const signature = ed25519.sign(new TextEncoder().encode(message), privateKeyBytes);
  return `${headerB64}.${payloadB64}.${b64url(signature)}`;
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

// ---------------------------------------------------------------------------
// Load inputs
// ---------------------------------------------------------------------------

const registry = JSON.parse(readFileSync(resolve(ROOT, 'registry.json'), 'utf8'));
const publicJwk = JSON.parse(readFileSync(resolve(ROOT, 'public-jwk.json'), 'utf8'));

const privateJwkRaw = process.env.TRUST_ANCHOR_PRIVATE_JWK;
if (!privateJwkRaw) {
  console.error('❌ Missing TRUST_ANCHOR_PRIVATE_JWK environment variable');
  process.exit(1);
}
const privateJwk = JSON.parse(privateJwkRaw);
const privateKeyBytes = Buffer.from(privateJwk.d, 'base64url');

const ANCHOR = 'https://registry.propdata.org.uk';
const now = Math.floor(Date.now() / 1000);
const oneYear = 365 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Prepare dist/
// ---------------------------------------------------------------------------

const dist = resolve(ROOT, 'dist');
ensureDir(resolve(dist, '.well-known'));
ensureDir(resolve(dist, 'entities'));
ensureDir(resolve(dist, 'trust-marks'));

// Copy CNAME for GitHub Pages
const cnameSrc = resolve(ROOT, 'CNAME');
writeFileSync(resolve(dist, 'CNAME'), readFileSync(cnameSrc, 'utf8'));

// ---------------------------------------------------------------------------
// Collect all issuers (issuers + userAccountProviders)
// ---------------------------------------------------------------------------

const allEntries = [
  ...Object.values(registry.issuers || {}),
  ...Object.values(registry.userAccountProviders || {}),
];

// ---------------------------------------------------------------------------
// 1. Trust Anchor Entity Configuration
// ---------------------------------------------------------------------------

const subordinates = allEntries.map(e => `${ANCHOR}/entities/${e.slug}`);

const entityConfig = signJwt(
  { alg: 'EdDSA', kid: 'trust-anchor-1', typ: 'entity-statement+jwt' },
  {
    iss: ANCHOR,
    sub: ANCHOR,
    iat: now,
    exp: now + oneYear,
    jwks: { keys: [publicJwk] },
    metadata: {
      federation_entity: {
        organization_name: 'Property Data Standards Company',
        homepage_uri: 'https://propdata.org.uk',
        contacts: ['trust@propdata.org.uk'],
      },
    },
    subordinates,
  },
  privateKeyBytes,
);

writeFileSync(resolve(dist, '.well-known', 'openid-federation'), entityConfig);
console.log('✅ .well-known/openid-federation');

// ---------------------------------------------------------------------------
// 2. Subordinate Entity Statements
// ---------------------------------------------------------------------------

for (const entry of allEntries) {
  const stmt = signJwt(
    { alg: 'EdDSA', kid: 'trust-anchor-1', typ: 'entity-statement+jwt' },
    {
      iss: ANCHOR,
      sub: entry.did,
      iat: now,
      exp: now + oneYear,
      metadata: {
        federation_entity: {
          organization_name: entry.name,
        },
        ...(entry.authorisedPaths && {
          pdtf: {
            trust_level: entry.trustLevel,
            authorised_paths: entry.authorisedPaths,
            ...(entry.proxyFor && { proxy_for: entry.proxyFor }),
          },
        }),
      },
    },
    privateKeyBytes,
  );
  writeFileSync(resolve(dist, 'entities', `${entry.slug}.jwt`), stmt);
  console.log(`✅ entities/${entry.slug}.jwt`);
}

// ---------------------------------------------------------------------------
// 3. Trust Marks
// ---------------------------------------------------------------------------

for (const entry of allEntries) {
  const delegation = {};
  if (entry.trustLevel) delegation.trust_level = entry.trustLevel;
  if (entry.authorisedPaths) delegation.authorised_paths = entry.authorisedPaths;
  if (entry.proxyFor) delegation.proxy_for = entry.proxyFor;

  const mark = signJwt(
    { alg: 'EdDSA', kid: 'trust-anchor-1', typ: 'trust-mark+jwt' },
    {
      iss: ANCHOR,
      sub: entry.did,
      iat: now,
      id: `${ANCHOR}/trust-marks/property-data-provider`,
      trust_mark_id: 'property-data-provider',
      ref: entry.slug,
      ...(Object.keys(delegation).length > 0 && { delegation }),
    },
    privateKeyBytes,
  );
  writeFileSync(resolve(dist, 'trust-marks', `${entry.slug}.jwt`), mark);
  console.log(`✅ trust-marks/${entry.slug}.jwt`);
}

console.log(`\n🎉 Generated federation artifacts for ${allEntries.length} entities`);
