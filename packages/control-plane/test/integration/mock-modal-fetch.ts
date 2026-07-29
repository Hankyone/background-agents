/**
 * Fail-fast mock for outbound Modal HTTP.
 *
 * Integration tests do not have a real Modal workspace. Without a mock, every
 * session init fires a background warmSandbox that calls *.modal.run and
 * usually gets `404 modal-http: invalid function call`. That is fine when the
 * network is fast; under CI load the request can stall past
 * waitForSandboxStatus's timeout and leave the sandbox row stuck on
 * "spawning" (see websocket-client dashboard URL test flake).
 *
 * Install once from setupFiles so warmSandbox settles to "failed" in
 * milliseconds. Tests that need a successful Modal spawn (e.g.
 * do-internal-routes) can vi.stubGlobal("fetch", ...) over this; their
 * afterEach should call installFailFastModalFetch() again so later files
 * keep the fail-fast behavior.
 */

const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function installFailFastModalFetch(): void {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (url.includes(".modal.run")) {
      return new Response("modal-http: invalid function call", { status: 404 });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}

installFailFastModalFetch();
