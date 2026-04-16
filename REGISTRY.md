# PDTF Federation Registry

> **Auto-generated from `registry.json`.** Do not edit directly.

This document lists all entities registered in the PDTF OpenID Federation Trust Anchor at `https://registry.propdata.org.uk`.

Each entity receives:
- A **Subordinate Entity Statement** (`/entities/{slug}.jwt`) — a signed JWT binding the entity's DID to its authorised PDTF paths
- A **Trust Mark** (`/trust-marks/{slug}.jwt`) — portable proof of authorisation by the Trust Anchor

---

## Issuers

| Slug | Name | DID | Trust Level | Status | Authorised Paths |
|------|------|-----|-------------|--------|-----------------|
| moverly-epc | Moverly EPC Adapter | `did:web:adapters.propdata.org.uk:epc` | trustedProxy | planned | `Property:/energyEfficiency/*` |
| moverly-title | Moverly Title Register Adapter | `did:web:adapters.propdata.org.uk:title` | trustedProxy | planned | `Title:/registerExtract/*`, `Title:/planReference`, `Title:/classOfTitle` |
| moverly-searches | Moverly Search Adapter | `did:web:adapters.propdata.org.uk:searches` | trustedProxy | planned | `Property:/localAuthority/searches/*`, `Property:/floodRisk/*`, `Property:/environmentalRisk/*`, `Property:/miningRisk/*` |
| environment-agency | Environment Agency | `did:web:credentials.environment-agency.gov.uk` | rootIssuer | planned | `Property:/energyEfficiency/*`, `Property:/floodRisk/*` |
| hmlr | HM Land Registry | `did:web:credentials.landregistry.gov.uk` | rootIssuer | planned | `Title:/*` |

## User Account Providers

| Slug | Name | DID | Status |
|------|------|-----|--------|
| moverly | Moverly | `did:web:auth.moverly.com` | active |

---

*Last updated from registry.json v0.1.0*
