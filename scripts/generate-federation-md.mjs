#!/usr/bin/env node

/**
 * Generate FEDERATION.md from registry.json
 *
 * Usage: node scripts/generate-federation-md.mjs [--output FEDERATION.md]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const registryPath = resolve(root, 'registry.json');
const outputPath = process.argv.includes('--output')
  ? resolve(process.argv[process.argv.indexOf('--output') + 1])
  : resolve(root, 'FEDERATION.md');

const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));

const statusBadge = (status) => {
  switch (status) {
    case 'active': return 'Active';
    case 'planned': return 'Planned';
    case 'suspended': return 'Suspended';
    case 'revoked': return 'Revoked';
    default: return status;
  }
};

const trustBadge = (level) => {
  switch (level) {
    case 'rootIssuer': return 'Root Issuer';
    case 'trustedProxy': return 'Trusted Proxy';
    case 'selfAttested': return 'Self-Attested';
    default: return level;
  }
};

const escPipe = (s) => (s || '').replace(/\|/g, '\\|');

// --- Trust Anchor ---

const ta = registry.trustAnchor;

let md = `# PDTF Federation Registry

> **Auto-generated from \`registry.json\`** — do not edit manually.
>
> Version: **${registry.version}** | Last updated: **${registry.lastUpdated}**

## Trust Anchor

| Field | Value |
|-------|-------|
| **Name** | ${ta.name} |
| **Entity Identifier** | \`${ta.entity_identifier}\` |
| **Trust Mark Issuer** | ${ta.trust_mark_issuer ? 'Yes' : 'No'} |
| **Well-Known URL** | \`${ta.entity_identifier}/.well-known/openid-federation\` |

## Trust Mark Definitions

The trust anchor defines the following trust marks for the PDTF ecosystem:

| Trust Mark ID | Description |
|---------------|-------------|
`;

for (const [tmId, tmDef] of Object.entries(ta.trust_mark_definitions)) {
  md += `| \`${tmId}\` | ${escPipe(tmDef.description)} |\n`;
}

// --- Federation Entities ---

md += `
## Federation Entities

### Credential Issuers

| Name | Entity Identifier | Trust Level | Status | Trust Marks | Authorised Paths |
|------|-------------------|-------------|--------|-------------|------------------|
`;

const issuers = Object.values(registry.issuers || {});
for (const issuer of issuers) {
  const paths = issuer.authorisedPaths.map(p => `\`${p}\``).join(', ');
  const marks = (issuer.trust_marks || []).map(tm => {
    const short = tm.split('/').pop();
    return `\`${short}\``;
  }).join(', ');
  md += `| **${escPipe(issuer.name)}** | \`${escPipe(issuer.entity_identifier)}\` | ${trustBadge(issuer.trustLevel)} | ${statusBadge(issuer.status)} | ${marks} | ${paths} |\n`;
}

// --- Entity Details ---

md += `
### Entity Details

`;

for (const issuer of issuers) {
  md += `#### ${issuer.name}\n\n`;
  md += `- **Slug:** \`${issuer.slug}\`\n`;
  md += `- **Entity Identifier:** \`${issuer.entity_identifier}\`\n`;
  md += `- **DID:** \`${issuer.did}\`\n`;
  md += `- **Trust Level:** ${trustBadge(issuer.trustLevel)}\n`;
  md += `- **Status:** ${statusBadge(issuer.status)}\n`;
  if (issuer.proxyFor) md += `- **Proxy For:** \`${issuer.proxyFor}\`\n`;
  md += `- **Trust Marks:**\n`;
  for (const tm of (issuer.trust_marks || [])) {
    const def = ta.trust_mark_definitions[tm];
    md += `  - \`${tm}\`${def ? ` — ${def.description}` : ''}\n`;
  }
  md += `- **Authorised Paths:**\n`;
  for (const p of issuer.authorisedPaths) {
    md += `  - \`${p}\`\n`;
  }
  if (issuer.validFrom) md += `- **Valid From:** ${issuer.validFrom}\n`;
  if (issuer.validUntil) md += `- **Valid Until:** ${issuer.validUntil}\n`;
  if (issuer.regulatoryRegistration) md += `- **Regulatory Registration:** ${issuer.regulatoryRegistration}\n`;
  md += '\n';
}

// --- User Account Providers ---

const providers = Object.values(registry.userAccountProviders || {});
if (providers.length > 0) {
  md += `### User Account Providers

| Name | Entity Identifier | Status | Trust Marks |
|------|-------------------|--------|-------------|
`;

  for (const p of providers) {
    const marks = (p.trust_marks || []).map(tm => {
      const short = tm.split('/').pop();
      return `\`${short}\``;
    }).join(', ');
    md += `| **${escPipe(p.name)}** | \`${escPipe(p.entity_identifier)}\` | ${statusBadge(p.status)} | ${marks} |\n`;
  }

  md += '\n';

  for (const p of providers) {
    md += `#### ${p.name}\n\n`;
    md += `- **Slug:** \`${p.slug}\`\n`;
    md += `- **Entity Identifier:** \`${p.entity_identifier}\`\n`;
    md += `- **DID:** \`${p.did}\`\n`;
    md += `- **Status:** ${statusBadge(p.status)}\n`;
    md += `- **Trust Marks:**\n`;
    for (const tm of (p.trust_marks || [])) {
      const def = ta.trust_mark_definitions[tm];
      md += `  - \`${tm}\`${def ? ` — ${def.description}` : ''}\n`;
    }
    if (p.managedOrganisations) md += `- **Managed Organisations:** ${p.managedOrganisations}\n`;
    if (p.validFrom) md += `- **Valid From:** ${p.validFrom}\n`;
    if (p.validUntil) md += `- **Valid Until:** ${p.validUntil}\n`;
    md += '\n';
  }
}

// --- TIR to Federation Mapping ---

md += `## TIR to Federation Mapping

This table shows how the original Trusted Issuer Registry concepts map to OpenID Federation equivalents:

| TIR Concept | OpenID Federation Equivalent |
|-------------|------------------------------|
| TIR entry | Subordinate entity statement |
| \`authorisedPaths\` | Trust mark \`delegation.authorised_paths\` claim |
| \`trustLevel: rootIssuer\` | Trust mark with \`trust_level: root_issuer\` |
| \`trustLevel: trustedProxy\` | Trust mark with \`trust_level: trusted_proxy\` + \`proxy_for\` |
| \`userAccountProviders\` | Trust mark \`account-provider\` |
| TIR validation CI | Federation metadata validation |

---

*Generated by \`scripts/generate-federation-md.mjs\`*
`;

writeFileSync(outputPath, md, 'utf-8');
console.log(`Generated ${outputPath}`);
