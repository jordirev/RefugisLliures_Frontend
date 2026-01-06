export function logApi(method: string, url: string, extra?: any) {
  const now = new Date();
  const time = now.toISOString();
  let extraStr = '';
  try {
    if (extra !== undefined) {
      extraStr = typeof extra === 'string' ? extra : JSON.stringify(extra);
    }
  } catch (e) {
    // ignore serialization errors
  }
  console.log(`[API] ${time} ${method.toUpperCase()} ${url}${extraStr ? ' ' + extraStr : ''}`);
}

export async function fetchWithLog(input: RequestInfo, init?: RequestInit) {
  const method = (init && init.method) ? init.method : 'GET';
  const urlStr = typeof input === 'string' ? input : (input as Request).url;

  // Log només el mètode i la URL, sense el body per seguretat (pot contenir tokens o dades sensibles)
  logApi(method, urlStr, undefined);

  // Use the original fetch implementation captured at module load time to avoid
  // recursive calls if global.fetch is replaced with this function.
  const originalFetch: any = (global as any)?.__originalFetch || (global as any)?.fetch;

  const start = Date.now();

  const doFetch = async (fetchImpl: any) => {
    try {
      const res: Response = await fetchImpl(input as any, init as any);
      const duration = Date.now() - start;

      // Try to read a short snippet of the response body only if not ok
      let bodySnippet: string | undefined;
      try {
        // clone response if possible (some RN fetch impl may not support clone)
        const cloned = (res && (res as any).clone) ? (res as any).clone() : res;
        const text = await cloned.text();
        if (text) {
          bodySnippet = text.length > 300 ? text.substring(0, 300) + '...' : text;
        }
      } catch (e) {
        // ignore body reading errors
      }

      // Log status + optional body snippet when not ok
      const statusMsg = `${res.status} ${res.statusText || ''}`.trim();
      if (!res.ok) {
        logApi(method, urlStr, `status=${statusMsg} timeMs=${duration}${bodySnippet ? ' error="' + bodySnippet.replaceAll(/\n/g, ' ') + '"' : ''}`);
      } else {
        logApi(method, urlStr, `status=${statusMsg} timeMs=${duration}`);
      }

      return res;
    } catch (err: any) {
      const duration = Date.now() - start;
      const em = err && err.message ? err.message : String(err);
      logApi(method, urlStr, `ERROR timeMs=${duration} message="${em}"`);
      throw err;
    }
  };

  if (originalFetch && originalFetch !== fetchWithLog) {
    return doFetch(originalFetch);
  }

  // Fallback: attempt to call the global fetch (may cause recursion if caller
  // overwrote global.fetch without setting __originalFetch). In practice, index.js
  // sets global.fetch to this wrapper after requiring this module, so callers
  // should set global.__originalFetch = global.fetch BEFORE overwriting.
  return doFetch(fetch);
}
