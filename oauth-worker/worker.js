/**
 * GitHub sign-in for the editorial interface at /admin.
 *
 * Decap CMS opens /auth in a pop-up. This Worker sends the editor to GitHub,
 * exchanges the returned code for a token (which needs the client secret, so it
 * cannot happen in the browser) and hands the token to the page that opened the
 * pop-up. Nothing is stored here. What an editor may change is decided by
 * GitHub, through their access to the repository.
 *
 * Secrets, set with `wrangler secret put`: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
 */

const SITE_ORIGIN = 'https://newcontextualism.org';
const SCOPE = 'public_repo';
const COOKIE = 'nc_oauth_state';

const page = (body, status = 200, headers = {}) =>
  new Response(`<!doctype html><meta charset="utf-8"><title>Sign-in</title>${body}`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

/** The handshake Decap CMS expects from the pop-up. */
function finish(result, payload) {
  const message = JSON.stringify(`authorization:github:${result}:${JSON.stringify(payload)}`).replace(/</g, '\\u003c');
  const origin = JSON.stringify(SITE_ORIGIN);
  return page(
    `<p>Finishing sign-in. You can close this window if it stays open.</p>
<script>
  (function () {
    var origin = ${origin};
    window.addEventListener('message', function (e) {
      if (e.origin !== origin) return;
      window.opener.postMessage(${message}, origin);
    }, false);
    window.opener.postMessage('authorizing:github', origin);
  })();
</script>`,
    200,
    { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
  );
}

function start(url, env) {
  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authorize.searchParams.set('scope', SCOPE);
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Cache-Control': 'no-store',
      'Set-Cookie': `${COOKIE}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function callback(url, request, env) {
  const cookies = request.headers.get('Cookie') ?? '';
  const expected = cookies.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!code || !state || state !== expected) {
    return finish('error', { message: 'The sign-in could not be verified. Please try again.' });
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'new-contextualism-cms-auth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!data.access_token) {
    return finish('error', { message: 'GitHub did not complete the sign-in. Please try again.' });
  }
  return finish('success', { token: data.access_token, provider: 'github' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/auth') return start(url, env);
    if (request.method === 'GET' && url.pathname === '/callback') return callback(url, request, env);
    return new Response('Not found', { status: 404 });
  },
};
