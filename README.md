# PDTF Trusted Issuer Registry (TIR)

The Trusted Issuer Registry is a machine-readable directory of authorised credential issuers within the [Property Data Trust Framework](https://github.com/property-data-standards-co).

It records **who** is trusted to issue Verifiable Credentials for **which** PDTF entity paths — enabling verifiers to check whether a credential's issuer is recognised and authorised for the data it claims to represent.

## How It Works

The registry defines two categories of trusted entity:

### Credential Issuers

Each issuer entry specifies:

| Field | Purpose |
|-------|---------|
| `slug` | Unique identifier (must match the object key) |
| `did` | Decentralised Identifier (`did:web:...`) |
| `trustLevel` | `rootIssuer` (primary source), `trustedProxy` (authorised intermediary), or `selfAttested` |
| `status` | `active`, `planned`, `suspended`, or `revoked` |
| `proxyFor` | For `trustedProxy` entries — the root issuer slug this proxy acts on behalf of |
| `authorisedPaths` | PDTF entity:path patterns this issuer may credential (e.g. `Title:/registerExtract/*`) |
| `validFrom` / `validUntil` | Temporal validity window |
| `regulatoryRegistration` | URL to the issuer's regulatory authority page |

### User Account Providers

Providers that manage user and organisation identity (e.g. verifying solicitor firms via Companies House).

## Trust Levels

**Root Issuers** are primary data sources — HM Land Registry for title data, the Environment Agency for flood risk. Their credentials carry the highest trust.

**Trusted Proxies** are authorised intermediaries that access root sources and re-issue data as Verifiable Credentials. They reference the root issuer they act on behalf of via `proxyFor`. The trust architecture is designed so proxies can eventually be replaced by direct root issuer integration.

**Self-Attested** entries are unverified — useful for testing or for data where no authoritative source exists.

## Viewing the Registry

See **[REGISTRY.md](./REGISTRY.md)** for a human-readable view, auto-generated from `registry.json`.

## Adding or Updating an Entry

1. Fork this repository
2. Edit `registry.json` — add your entry under `issuers` or `userAccountProviders`
3. Ensure your `slug` matches the object key
4. Validate locally:
   ```bash
   npx ajv-cli validate -s schema/registry.schema.json -d registry.json --spec=draft2020 -c ajv-formats
   ```
5. Open a Pull Request with:
   - Your organisation name and DID
   - The PDTF paths you intend to credential
   - Evidence of authorisation (for `trustedProxy` entries, confirmation from the root issuer)
   - Regulatory registration URL (for `rootIssuer` entries)

## Review Process

All registry changes require:

- **Schema validation** — CI automatically validates against `schema/registry.schema.json`
- **Uniqueness checks** — no duplicate DIDs or slugs
- **Maintainer review** — at least one PDTF maintainer must approve
- **For `rootIssuer` entries** — verification of the organisation's regulatory status
- **For `trustedProxy` entries** — confirmation of the proxy relationship with the root issuer

## CI/CD

On every push and PR:
- `registry.json` is validated against the JSON Schema
- Duplicate DID and slug checks run
- Slug-key consistency is verified

On push to `main`:
- `REGISTRY.md` is auto-generated and committed

## Related Specifications

- [PDTF 2.0 Sub-spec 07: Trusted Issuer Registry](https://github.com/property-data-standards-co) — the specification this registry implements
- [W3C Decentralised Identifiers (DIDs)](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model-2.0/)

## License

[MIT](./LICENSE) — Copyright (c) 2026 Ed Molyneux / Moverly
