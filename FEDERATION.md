# PDTF Federation Registry

> **Auto-generated from `registry.json`** — do not edit manually.
>
> Version: **0.2.0** | Last updated: **2026-04-18T00:00:00Z**

## Trust Anchor

| Field | Value |
|-------|-------|
| **Name** | Property Data Standards |
| **Entity Identifier** | `https://propdata.org.uk` |
| **Trust Mark Issuer** | Yes |
| **Well-Known URL** | `https://propdata.org.uk/.well-known/openid-federation` |

## Trust Mark Definitions

The trust anchor defines the following trust marks for the PDTF ecosystem:

| Trust Mark ID | Description |
|---------------|-------------|
| `https://propdata.org.uk/trust-marks/title-data-provider` | Authorised to issue TitleCredentials |
| `https://propdata.org.uk/trust-marks/search-provider` | Authorised to issue property search credentials |
| `https://propdata.org.uk/trust-marks/regulated-conveyancer` | SRA/CLC regulated conveyancing firm |
| `https://propdata.org.uk/trust-marks/energy-data-provider` | Authorised to issue EPC/energy credentials |
| `https://propdata.org.uk/trust-marks/environmental-data-provider` | Authorised to issue environmental risk credentials |
| `https://propdata.org.uk/trust-marks/account-provider` | Authorised to issue user DIDs on behalf of persons |

## Federation Entities

### Credential Issuers

| Name | Entity Identifier | Trust Level | Status | Trust Marks | Authorised Paths |
|------|-------------------|-------------|--------|-------------|------------------|
| **Moverly EPC Adapter** | `https://adapters.propdata.org.uk/epc` | Trusted Proxy | Planned | `energy-data-provider` | `Property:/energyEfficiency/*` |
| **Moverly Title Register Adapter** | `https://adapters.propdata.org.uk/title` | Trusted Proxy | Planned | `title-data-provider` | `Title:/registerExtract/*`, `Title:/planReference`, `Title:/classOfTitle` |
| **Moverly Search Adapter** | `https://adapters.propdata.org.uk/searches` | Trusted Proxy | Planned | `search-provider`, `environmental-data-provider` | `Property:/localAuthority/searches/*`, `Property:/floodRisk/*`, `Property:/environmentalRisk/*`, `Property:/miningRisk/*` |
| **Environment Agency** | `https://credentials.environment-agency.gov.uk` | Root Issuer | Planned | `energy-data-provider`, `environmental-data-provider` | `Property:/energyEfficiency/*`, `Property:/floodRisk/*` |
| **HM Land Registry** | `https://credentials.landregistry.gov.uk` | Root Issuer | Planned | `title-data-provider` | `Title:/*` |

### Entity Details

#### Moverly EPC Adapter

- **Slug:** `moverly-epc`
- **Entity Identifier:** `https://adapters.propdata.org.uk/epc`
- **DID:** `did:web:adapters.propdata.org.uk:epc`
- **Trust Level:** Trusted Proxy
- **Status:** Planned
- **Proxy For:** `environment-agency`
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/energy-data-provider` — Authorised to issue EPC/energy credentials
- **Authorised Paths:**
  - `Property:/energyEfficiency/*`
- **Valid From:** 2026-06-01T00:00:00Z

#### Moverly Title Register Adapter

- **Slug:** `moverly-title`
- **Entity Identifier:** `https://adapters.propdata.org.uk/title`
- **DID:** `did:web:adapters.propdata.org.uk:title`
- **Trust Level:** Trusted Proxy
- **Status:** Planned
- **Proxy For:** `hmlr`
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/title-data-provider` — Authorised to issue TitleCredentials
- **Authorised Paths:**
  - `Title:/registerExtract/*`
  - `Title:/planReference`
  - `Title:/classOfTitle`
- **Valid From:** 2026-06-01T00:00:00Z

#### Moverly Search Adapter

- **Slug:** `moverly-searches`
- **Entity Identifier:** `https://adapters.propdata.org.uk/searches`
- **DID:** `did:web:adapters.propdata.org.uk:searches`
- **Trust Level:** Trusted Proxy
- **Status:** Planned
- **Proxy For:** `multiple`
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/search-provider` — Authorised to issue property search credentials
  - `https://propdata.org.uk/trust-marks/environmental-data-provider` — Authorised to issue environmental risk credentials
- **Authorised Paths:**
  - `Property:/localAuthority/searches/*`
  - `Property:/floodRisk/*`
  - `Property:/environmentalRisk/*`
  - `Property:/miningRisk/*`
- **Valid From:** 2026-06-01T00:00:00Z

#### Environment Agency

- **Slug:** `environment-agency`
- **Entity Identifier:** `https://credentials.environment-agency.gov.uk`
- **DID:** `did:web:credentials.environment-agency.gov.uk`
- **Trust Level:** Root Issuer
- **Status:** Planned
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/energy-data-provider` — Authorised to issue EPC/energy credentials
  - `https://propdata.org.uk/trust-marks/environmental-data-provider` — Authorised to issue environmental risk credentials
- **Authorised Paths:**
  - `Property:/energyEfficiency/*`
  - `Property:/floodRisk/*`
- **Regulatory Registration:** https://www.gov.uk/government/organisations/environment-agency

#### HM Land Registry

- **Slug:** `hmlr`
- **Entity Identifier:** `https://credentials.landregistry.gov.uk`
- **DID:** `did:web:credentials.landregistry.gov.uk`
- **Trust Level:** Root Issuer
- **Status:** Planned
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/title-data-provider` — Authorised to issue TitleCredentials
- **Authorised Paths:**
  - `Title:/*`
- **Regulatory Registration:** https://www.gov.uk/government/organisations/land-registry

### User Account Providers

| Name | Entity Identifier | Status | Trust Marks |
|------|-------------------|--------|-------------|
| **Moverly** | `https://auth.moverly.com` | Active | `account-provider` |

#### Moverly

- **Slug:** `moverly`
- **Entity Identifier:** `https://auth.moverly.com`
- **DID:** `did:web:auth.moverly.com`
- **Status:** Active
- **Trust Marks:**
  - `https://propdata.org.uk/trust-marks/account-provider` — Authorised to issue user DIDs on behalf of persons
- **Managed Organisations:** Verifies organisation identity via Companies House lookup and director authentication
- **Valid From:** 2026-04-01T00:00:00Z

## TIR to Federation Mapping

This table shows how the original Trusted Issuer Registry concepts map to OpenID Federation equivalents:

| TIR Concept | OpenID Federation Equivalent |
|-------------|------------------------------|
| TIR entry | Subordinate entity statement |
| `authorisedPaths` | Trust mark `delegation.authorised_paths` claim |
| `trustLevel: rootIssuer` | Trust mark with `trust_level: root_issuer` |
| `trustLevel: trustedProxy` | Trust mark with `trust_level: trusted_proxy` + `proxy_for` |
| `userAccountProviders` | Trust mark `account-provider` |
| TIR validation CI | Federation metadata validation |

---

*Generated by `scripts/generate-federation-md.mjs`*
