/**
 * Region gate settings.
 *
 * Phase 1 uses self-attestation only: the visitor confirms they are not in a
 * restricted region before they can trade. This is NOT real geo-blocking.
 * Before a public launch, wire `VITE_GEO_ENDPOINT` to an endpoint that
 * returns `{ "country": "US" }` for the visitor (most hosts can do this at
 * the edge) and the gate will block the listed countries outright.
 */
export const BLOCKED_COUNTRIES = ["US", "CA", "GB", "AU"];

export const GEO_ENDPOINT: string | undefined = import.meta.env.VITE_GEO_ENDPOINT;

export const RESTRICTED_TEXT = "the United States, Canada, the United Kingdom, Australia, or a sanctioned region";
