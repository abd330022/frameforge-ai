const SITE_ORIGIN = 'https://frameforge-ai-beta.vercel.app';
const CLIENT_ID = `${SITE_ORIGIN}/.well-known/oauth-cimd`;
const REDIRECT_URI = `${SITE_ORIGIN}/`;
const TOKEN_KEY = 'frameforge-hf-access-token';
const USER_KEY = 'frameforge-hf-username';
const STATE_KEY = 'frameforge-hf-oauth-state';
const VERIFIER_KEY = 'frameforge-hf-oauth-verifier';

let currentAccount = null;
let callbackPromise = null;
let profileCheckInProgress = false;

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomString(size = 48) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return base64Url(bytes);
}

async function createCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function clearCallbackFromAddressBar() {
  const url = new URL(window.location.href);
  ['code', 'state', 'error', 'error_description'].forEach(key => url.searchParams.delete(key));
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

async function fetchProfile(accessToken) {
  const response = await fetch('https://huggingface.co/oauth/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const error = new Error('Unable to read Hugging Face profile');
    error.status = response.status;
    throw error;
  }
  const profile = await response.json();
  return profile.preferred_username || profile.name || 'Hugging Face';
}

async function finishOAuthCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const providerError = url.searchParams.get('error');
  if (!code && !providerError) return null;

  const returnedState = url.searchParams.get('state');
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  clearCallbackFromAddressBar();
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!returnedState || returnedState !== expectedState) {
    throw new Error('OAuth state check failed');
  }
  if (providerError) {
    const error = new Error('Authorization was not completed');
    error.code = providerError;
    throw error;
  }
  if (!verifier) throw new Error('OAuth code verifier is missing');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });
  const response = await fetch('https://huggingface.co/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) throw new Error('Token exchange failed');

  const tokenData = await response.json();
  if (!tokenData.access_token) throw new Error('No access token returned');

  sessionStorage.setItem(TOKEN_KEY, tokenData.access_token);
  const username = await fetchProfile(tokenData.access_token);
  sessionStorage.setItem(USER_KEY, username);
  currentAccount = username;
  return username;
}

function localizedText(lang, ar, en) {
  return lang === 'ar' ? ar : en;
}

export function mountHuggingFaceConnect(lang = 'ar') {
  const connectButton = document.querySelector('#hfConnectBtn');
  const disconnectButton = document.querySelector('#hfDisconnectBtn');
  const status = document.querySelector('#hfConnectStatus');
  const account = document.querySelector('#hfConnectedAccount');
  if (!connectButton || !disconnectButton || !status || !account) return;
  const callbackParams = new URLSearchParams(window.location.search);
  const isOAuthReturn = callbackParams.has('code') || callbackParams.has('error');

  const showConnected = username => {
    currentAccount = username;
    account.textContent = `Hugging Face · @${username}`;
    account.hidden = false;
    connectButton.hidden = true;
    disconnectButton.hidden = false;
    status.textContent = localizedText(lang, 'تم ربط الحساب في هذا التبويب.', 'Account connected in this browser tab.');
  };

  const showDisconnected = message => {
    account.hidden = true;
    connectButton.hidden = false;
    disconnectButton.hidden = true;
    status.textContent = message || localizedText(lang, 'لم يتم ربط حساب بعد.', 'No account connected yet.');
  };

  connectButton.addEventListener('click', async () => {
    connectButton.disabled = true;
    status.textContent = localizedText(lang, 'جارٍ تجهيز الربط الآمن…', 'Preparing a secure connection…');
    try {
      const state = randomString(32);
      const verifier = randomString(48);
      const challenge = await createCodeChallenge(verifier);
      sessionStorage.setItem(STATE_KEY, state);
      sessionStorage.setItem(VERIFIER_KEY, verifier);

      const authorizeUrl = new URL('https://huggingface.co/oauth/authorize');
      authorizeUrl.search = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile',
        state,
        code_challenge_method: 'S256',
        code_challenge: challenge
      }).toString();
      window.location.assign(authorizeUrl);
    } catch {
      connectButton.disabled = false;
      showDisconnected(localizedText(lang, 'تعذّر بدء الربط. حاول مرة أخرى.', 'Could not start sign in. Please try again.'));
    }
  });

  disconnectButton.addEventListener('click', () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    currentAccount = null;
    showDisconnected(localizedText(lang, 'تم فصل الحساب من هذا التبويب.', 'Account disconnected from this browser tab.'));
  });

  if (currentAccount) showConnected(currentAccount);
  else {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    const savedName = sessionStorage.getItem(USER_KEY);
    if (savedToken && savedName) showConnected(savedName);
    else showDisconnected();
  }

  if (!callbackPromise) {
    callbackPromise = finishOAuthCallback()
      .then(username => {
        if (username) showConnected(username);
        return username;
      })
      .catch(error => {
        const message = error.code === 'access_denied'
          ? localizedText(lang, 'تم إلغاء الربط. لم يتغير حسابك.', 'Sign in was cancelled. Your account was not changed.')
          : localizedText(lang, 'تعذّر إكمال الربط. حاول مرة أخرى.', 'Could not complete sign in. Please try again.');
        showDisconnected(message);
        return null;
      });
  }

  const accessToken = sessionStorage.getItem(TOKEN_KEY);
  if (accessToken && !isOAuthReturn && !profileCheckInProgress) {
    profileCheckInProgress = true;
    fetchProfile(accessToken).then(username => {
      sessionStorage.setItem(USER_KEY, username);
      showConnected(username);
    }).catch(error => {
      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        currentAccount = null;
        showDisconnected(localizedText(lang, 'انتهت الجلسة. أعد ربط الحساب.', 'Session expired. Please reconnect your account.'));
      } else {
        status.textContent = localizedText(lang, 'تعذّر التحقق من الحساب حالياً. جرّب تحديث الصفحة.', 'Could not verify the account right now. Try refreshing the page.');
      }
    }).finally(() => {
      profileCheckInProgress = false;
    });
  }
}
