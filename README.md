# PDTF Federation Registry

The Federation Registry is the seed data from which [OpenID Federation](https://openid.net/specs/openid-federation-1_0.html) Entity Statements, Trust Marks, and Entity Configurations are generated for the [Property Data Trust Framework (PDTF) 2.0](https://github.com/property-data-standards-co) ecosystem.

It defines **who** is authorised to issue **which** property credentials, expressed as OpenID Federation trust marks with PDTF-specific delegation claims.

## How It Works

```
registry.json (seed data)
    │
    ├── node scripts/generate-entity-statements.mjs
    │       │
    │       ├── dist/propdata.org.uk/.well-known/openid-federation  (trust anchor)
    │       ├── dist/propdata.org.uk/federation/fetch?sub=...       (subordinate statements)
    │       ├── dist/trust-marks/...                                (trust marks per entity)
    │       └── dist/entity-configs/...                             (leaf entity configurations)
    │
    └── node scripts/generate-federation-md.mjs
            │
            └── FEDERATION.md  (human-readable view)
```

`registry.json` is the single authoritative source. The build scripts generate unsigned JSON reference artifacts showing the structure of the OpenID Federation metadata. In production, these would be signed JWTs served from live HTTPS endpoints.

## Trust Anchor

The federation trust anchor is **Property Data Standards** (`https://propdata.org.uk`). It:

- Issues subordinate entity statements for each entity in the federation
- Issues trust marks certifying what each entity is authorised to do
- Publishes its entity configuration at `/.well-known/openid-federation`

## Trust Marks

Trust marks are the PDTF-specific mechanism for expressing what an entity is authorised to do. Each is a signed assertion from the trust anchor:

| Trust Mark | Meaning |
|------------|---------|
| `title-data-provider` | Authorised to issue TitleCredentials |
| `search-provider` | Authorised to issue property search credentials |
| `regulated-conveyancer` | SRA/CLC regulated conveyancing firm |
| `energy-data-provider` | Authorised to issue EPC/energy credentials |
| `environmental-data-provider` | Authorised to issue environmental risk credentials |
| `account-provider` | Authorised to issue user DIDs on behalf of persons |

Each trust mark carries a `delegation` extension with `authorised_paths` — the specific PDTF entity:path combinations the holder can credential.

## Viewing the Registry

See **[FEDERATION.md](./FEDERATION.md)** for a human-readable view, auto-generated from `registry.json`.

## Adding an Entity

1. Fork this repository
2. Edit `registry.json` — add your entry under `issuers` or `userAccountProviders`
3. Required fields:
   - `slug` — unique identifier (must match the object key)
   - `entity_identifier` — your HTTPS entity identifier for OpenID Federation
   - `did` — your Decentralised Identifier (`did:web:...`)
   - `trust_marks` — which trust marks you're applying for
   - `authorisedPaths` — PDTF entity:path patterns you'll credential
   - `trustLevel` — `rootIssuer` (primary source) or `trustedProxy` (intermediary)
4. Validate locally:
   ```bash
   npx ajv-cli validate -s schema/registry.schema.json -d registry.json --spec=draft2020 -c ajv-formats
   node scripts/generate-entity-statements.mjs
   ```
5. Open a Pull Request with:
   - Your organisation name, DID, and entity identifier
   - The PDTF paths you intend to credential
   - Evidence of authorisation (for `trustedProxy` entries, confirmation from the root issuer)
   - Regulatory registration URL (for `rootIssuer` entries)

## Review Process

All registry changes require:

- **Schema validation** — CI validates against `schema/registry.schema.json`
- **Uniqueness checks** — no duplicate DIDs, slugs, or entity identifiers
- **Build check** — entity statement generation must succeed
- **Maintainer review** — at least one PDTF maintainer must approve
- **For `rootIssuer` entries** — verification of the organisation's regulatory status
- **For `trustedProxy` entries** — confirmation of the proxy relationship with the root issuer

## Governance Model

### Phase 1 (current)

The trust anchor is operated by Moverly/propdata.org.uk. Federation metadata is generated from this registry file. Moverly is the sole account provider for user DIDs. Existing data collectors become OID4VCI credential issuers (adapters) as leaf entities in the federation.

### Phase 2+

A property sector governance body operates the trust anchor. Multiple organisations run adapters with their own entity configurations. SRA/CLC issue `regulated-conveyancer` trust marks directly. Multiple account providers for user DIDs.

## Related Specifications

- [PDTF 2.0 Architecture Overview](https://github.com/property-data-standards-co) — the specification this registry implements
- [OpenID Federation (RFC 9396)](https://openid.net/specs/openid-federation-1_0.html) — the trust infrastructure standard
- [OpenID for Verifiable Credential Issuance (OID4VCI)](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) — credential issuance protocol
- [W3C Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/) — credential format
- [W3C Decentralised Identifiers (DIDs)](https://www.w3.org/TR/did-core/) — entity identifiers

## License

[MIT](./LICENSE) -- Copyright (c) 2026 Ed Molyneux / Moverly
