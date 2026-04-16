# PDTF Federation Registry

**Trust Anchor for the Property Data Trust Framework (PDTF) OpenID Federation.**

This repository is the authoritative source for PDTF trust decisions. It maps issuers (data adapters, root authorities, and user account providers) to the PDTF entity paths they are authorised to issue credentials for.

## How It Works

```
registry.json  →  CI generates signed JWTs  →  deployed to registry.propdata.org.uk
(human-edited)     (Entity Statements,           (GitHub Pages)
                    Trust Marks)
```

1. **`registry.json`** — Human-edited registry of all trusted issuers, their DIDs, authorised paths, and trust levels.
2. **CI pipeline** — On push to `main`, GitHub Actions runs `scripts/generate-federation.mjs` which signs federation artifacts using the Trust Anchor's Ed25519 key.
3. **GitHub Pages** — The signed artifacts are deployed to `https://registry.propdata.org.uk`.

## Published Artifacts

| Path | Description |
|------|-------------|
| `/.well-known/openid-federation` | Trust Anchor Entity Configuration (self-signed JWT) |
| `/entities/{slug}.jwt` | Subordinate Entity Statement for each issuer |
| `/trust-marks/{slug}.jwt` | Property Data Provider Trust Mark for each issuer |

All JWTs are signed with **EdDSA (Ed25519)** using compact serialisation.

## Adding or Updating an Issuer

1. Edit `registry.json` — add or modify an issuer entry
2. Open a PR — CI validates the schema, checks for duplicates
3. Merge — CI generates and deploys new signed artifacts

## Trust Architecture

- **Trust Anchor**: `https://registry.propdata.org.uk` (this registry)
- **Signing key**: Ed25519, kid `trust-anchor-1`
- **Entity Statements**: Bind issuer DIDs to their authorised PDTF paths
- **Trust Marks**: Portable proof that an issuer is authorised by the Trust Anchor

See [REGISTRY.md](REGISTRY.md) for the current registry contents.

## Local Development

```bash
npm install
TRUST_ANCHOR_PRIVATE_JWK='{"kty":"OKP","crv":"Ed25519","d":"...","x":"..."}' \
  node scripts/generate-federation.mjs
```

Artifacts are written to `dist/`.

## Related

- [PDTF Specification](https://propdata.org.uk)
- [OpenID Federation](https://openid.net/specs/openid-federation-1_0.html)
