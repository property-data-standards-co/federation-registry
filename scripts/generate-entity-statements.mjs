#!/usr/bin/env node

/**
 * Generate OpenID Federation artifacts from registry.json
 *
 * Outputs to dist/:
 *   - Trust anchor entity configuration
 *   - Subordinate entity statements (one per entity)
 *   - Trust marks (one per entity + trust mark combination)
 *   - Leaf entity configurations (one per entity)
 *
 * These are unsigned JSON reference artifacts. In production they would be
 * signed JWTs served from live HTTPS endpoints. The signing step will be
 * added when real key material is available.
 *
 * Usage: node scripts/generate-entity-statements.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(root, 'dist');

const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf-8'));

// Placeholder Ed25519 JWK — NOT real key material
const PLACEHOLDER_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'PLACEHOLDER_PUBLIC_KEY_BASE64URL',
  kid: 'placeholder-key-1',
  use: 'sig'
};

function makeJwk(kid) {
  return { ...PLACEHOLDER_JWK, kid };
}

const now = Math.floor(Date.now() / 1000);
const oneYear = 365 * 24 * 60 * 60;

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Collect all entities (issuers + account providers)
function allEntities() {
  const entities = [];
  for (const [slug, entry] of Object.entries(registry.issuers || {})) {
    entities.push({ ...entry, slug, category: 'issuer' });
  }
  for (const [slug, entry] of Object.entries(registry.userAccountProviders || {})) {
    entities.push({ ...entry, slug, category: 'accountProvider' });
  }
  return entities;
}

// Map trust level from registry format to federation format
function federationTrustLevel(trustLevel) {
  switch (trustLevel) {
    case 'rootIssuer': return 'root_issuer';
    case 'trustedProxy': return 'trusted_proxy';
    case 'selfAttested': return 'self_attested';
    default: return trustLevel;
  }
}

// Determine credential types from trust marks
function credentialTypesFromTrustMarks(trustMarks) {
  const types = [];
  for (const tm of trustMarks) {
    if (tm.includes('title-data-provider')) {
      types.push({ format: 'ldp_vc', types: ['VerifiableCredential', 'TitleCredential'] });
    }
    if (tm.includes('search-provider')) {
      types.push({ format: 'ldp_vc', types: ['VerifiableCredential', 'PropertyCredential'] });
    }
    if (tm.includes('energy-data-provider')) {
      types.push({ format: 'ldp_vc', types: ['VerifiableCredential', 'PropertyCredential'] });
    }
    if (tm.includes('environmental-data-provider')) {
      types.push({ format: 'ldp_vc', types: ['VerifiableCredential', 'PropertyCredential'] });
    }
  }
  // Deduplicate by JSON key
  const seen = new Set();
  return types.filter(t => {
    const key = JSON.stringify(t);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- 1. Trust Anchor Entity Configuration ---

function generateTrustAnchorConfig() {
  const ta = registry.trustAnchor;

  const trustMarkIssuers = {};
  for (const tmId of Object.keys(ta.trust_mark_definitions)) {
    trustMarkIssuers[tmId] = [ta.entity_identifier];
  }

  const config = {
    _note: 'Unsigned reference artifact. In production this would be a signed JWT at /.well-known/openid-federation',
    iss: ta.entity_identifier,
    sub: ta.entity_identifier,
    iat: now,
    exp: now + oneYear,
    jwks: {
      keys: [makeJwk('propdata-trust-anchor-key-1')]
    },
    metadata: {
      federation_entity: {
        organization_name: ta.name,
        homepage_uri: ta.entity_identifier,
        trust_mark_issuer: ta.trust_mark_issuer
      }
    },
    trust_mark_issuers: trustMarkIssuers,
    trust_mark_owners: {
      [ta.entity_identifier]: {
        trust_mark_definitions: ta.trust_mark_definitions
      }
    }
  };

  const anchorHost = new URL(ta.entity_identifier).hostname;
  writeJson(
    resolve(distDir, anchorHost, '.well-known', 'openid-federation'),
    config
  );

  return config;
}

// --- 2. Subordinate Entity Statements ---

function generateSubordinateStatement(entity) {
  const ta = registry.trustAnchor;

  const statement = {
    _note: 'Unsigned reference artifact. In production this would be a signed JWT from the trust anchor.',
    iss: ta.entity_identifier,
    sub: entity.entity_identifier,
    iat: now,
    exp: now + oneYear,
    jwks: {
      keys: [makeJwk(`${entity.slug}-key-1`)]
    }
  };

  // Add OID4VCI metadata for issuers
  if (entity.category === 'issuer') {
    const credentialsSupported = credentialTypesFromTrustMarks(entity.trust_marks || []);
    statement.metadata = {
      openid_credential_issuer: {
        credential_issuer: entity.entity_identifier,
        credential_endpoint: `${entity.entity_identifier}/credential`,
        credentials_supported: credentialsSupported.map(cs => ({
          ...cs,
          cryptographic_binding_methods_supported: ['did:key', 'did:web']
        }))
      }
    };
  }

  // Add account provider metadata
  if (entity.category === 'accountProvider') {
    statement.metadata = {
      federation_entity: {
        organization_name: entity.name
      }
    };
  }

  const anchorHost = new URL(ta.entity_identifier).hostname;
  const subEncoded = encodeURIComponent(entity.entity_identifier);
  writeJson(
    resolve(distDir, anchorHost, 'federation', `fetch?sub=${subEncoded}`),
    statement
  );

  return statement;
}

// --- 3. Trust Marks ---

function generateTrustMark(entity, trustMarkId) {
  const ta = registry.trustAnchor;

  const trustMark = {
    _note: 'Unsigned reference artifact. In production this would be a signed JWT (trust mark).',
    iss: ta.entity_identifier,
    sub: entity.entity_identifier,
    id: trustMarkId,
    iat: now,
    exp: now + oneYear,
    ref: `${trustMarkId}/policy`
  };

  // Add PDTF delegation extension
  if (entity.authorisedPaths) {
    trustMark.delegation = {
      authorised_paths: entity.authorisedPaths,
      trust_level: federationTrustLevel(entity.trustLevel || 'selfAttested')
    };
    if (entity.proxyFor) {
      trustMark.delegation.proxy_for = entity.proxyFor;
    }
  }

  return trustMark;
}

// --- 4. Leaf Entity Configurations ---

function generateEntityConfig(entity, trustMarks) {
  const ta = registry.trustAnchor;

  const config = {
    _note: 'Unsigned reference artifact. In production this would be a signed JWT at the entity\'s /.well-known/openid-federation',
    iss: entity.entity_identifier,
    sub: entity.entity_identifier,
    iat: now,
    exp: now + oneYear,
    jwks: {
      keys: [makeJwk(`${entity.slug}-key-1`)]
    },
    metadata: {},
    trust_marks: trustMarks.map(tm => ({
      id: tm.id,
      trust_mark: 'eyJhbGciOiJFZERTQSIsInR5cCI6InRydXN0LW1hcmsrand0In0.PLACEHOLDER.SIGNATURE'
    })),
    authority_hints: [ta.entity_identifier]
  };

  // Add OID4VCI metadata for issuers
  if (entity.category === 'issuer') {
    const credentialsSupported = credentialTypesFromTrustMarks(entity.trust_marks || []);
    config.metadata.openid_credential_issuer = {
      credential_issuer: entity.entity_identifier,
      credential_endpoint: `${entity.entity_identifier}/credential`,
      credentials_supported: credentialsSupported.map(cs => ({
        ...cs,
        cryptographic_binding_methods_supported: ['did:key', 'did:web']
      }))
    };
  }

  // Add federation entity metadata
  config.metadata.federation_entity = {
    organization_name: entity.name
  };

  return config;
}

function entityConfigPath(entityId) {
  const url = new URL(entityId);
  const host = url.hostname;
  const pathParts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);

  if (pathParts.length > 0) {
    return resolve(distDir, 'entity-configs', host, pathParts.join('/') + '.json');
  }
  return resolve(distDir, 'entity-configs', host + '.json');
}

// --- Main ---

function main() {
  console.log('Generating OpenID Federation artifacts from registry.json...\n');

  // 1. Trust anchor
  generateTrustAnchorConfig();
  console.log(`  Trust anchor: ${registry.trustAnchor.entity_identifier}`);

  const entities = allEntities();
  let trustMarkCount = 0;

  for (const entity of entities) {
    // 2. Subordinate statement
    generateSubordinateStatement(entity);
    console.log(`  Subordinate statement: ${entity.entity_identifier}`);

    // 3. Trust marks
    const entityTrustMarks = [];
    for (const tmId of (entity.trust_marks || [])) {
      const tm = generateTrustMark(entity, tmId);
      entityTrustMarks.push(tm);
      trustMarkCount++;
    }

    // 4. Entity configuration
    const entityConfig = generateEntityConfig(entity, entityTrustMarks);
    writeJson(entityConfigPath(entity.entity_identifier), entityConfig);
    console.log(`  Entity config: ${entity.entity_identifier}`);
  }

  // Write trust marks as a collected file per entity
  for (const entity of entities) {
    const marks = [];
    for (const tmId of (entity.trust_marks || [])) {
      marks.push(generateTrustMark(entity, tmId));
    }
    if (marks.length > 0) {
      const url = new URL(entity.entity_identifier);
      const host = url.hostname;
      const pathParts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      const filename = pathParts.length > 0
        ? `${host}/${pathParts.join('/')}-trust-marks.json`
        : `${host}-trust-marks.json`;
      writeJson(resolve(distDir, 'trust-marks', filename), marks);
    }
  }

  console.log(`\nGenerated:`);
  console.log(`  1 trust anchor entity configuration`);
  console.log(`  ${entities.length} subordinate entity statements`);
  console.log(`  ${trustMarkCount} trust marks`);
  console.log(`  ${entities.length} leaf entity configurations`);
  console.log(`\nOutput: dist/`);
}

main();
