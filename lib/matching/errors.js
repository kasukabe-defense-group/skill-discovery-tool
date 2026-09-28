// Typed errors so the API route and frontend can show copy specific to
// what actually went wrong, instead of one generic "something broke" message.
export class MatchProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MatchProviderError";
    this.code = code;
  }
}

// code is one of:
//   "rate_limited"    - provider's quota/rate limit was hit
//   "auth_error"       - bad/missing API key
//   "invalid_response" - provider replied but not with valid/parseable JSON
//   "network_error"     - request itself failed (timeout, DNS, fetch throw)
//   "unknown"          - anything else
