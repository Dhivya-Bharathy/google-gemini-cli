/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OAuth2Client, Credentials } from 'google-auth-library';
import { Compute } from 'google-auth-library';
import { Config, AuthType, getErrorMessage } from '@google/gemini-cli-core';
import * as fs from 'fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import readline from 'node:readline';

//  OAuth Client ID used to initiate OAuth2Client class.
const OAUTH_CLIENT_ID = process.env.GEMINI_OAUTH_CLIENT_ID || '';

// OAuth Secret value used to initiate OAuth2Client class.
// Note: It's ok to save this in git because this is an installed application
// as described here: https://developers.google.com/identity/protocols/oauth2#installed
// "The process results in a client ID and, in some cases, a client secret,
// which you embed in the source code of your application. (In this context,
// the client secret is obviously not treated as a secret.)"
const OAUTH_CLIENT_SECRET = process.env.GEMINI_OAUTH_CLIENT_SECRET || '';

// OAuth Scopes for Cloud Code authorization.
const OAUTH_SCOPE = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const HTTP_REDIRECT = 301;
const SIGN_IN_SUCCESS_URL =
  'https://developers.google.com/gemini-code-assist/auth_success_gemini';
const SIGN_IN_FAILURE_URL =
  'https://developers.google.com/gemini-code-assist/auth_failure_gemini';

const GEMINI_DIR = '.gemini';
const CREDENTIAL_FILENAME = 'oauth_creds.json';

/**
 * An Authentication URL for updating the credentials of a Oauth2Client
 * as well as a promise that will resolve when the credentials have
 * been refreshed (or which throws error when refreshing credentials failed).
 */
export interface OauthWebLogin {
  authUrl: string;
  loginCompletePromise: Promise<void>;
}

export async function getOauthClient(
  authType: AuthType,
  config: Config,
): Promise<OAuth2Client> {
  const client = new OAuth2Client({
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    transporterOptions: {
      proxy: config.getProxy(),
    },
  });

  client.on('tokens', async (tokens: Credentials) => {
    await cacheCredentials(tokens);
  });

  // If there are cached creds on disk, they always take precedence
  if (await loadCachedCredentials(client)) {
    // Found valid cached credentials.
    // Check if we need to retrieve Google Account ID or Email
    if (!getCachedGoogleAccount()) {
      try {
        await fetchAndCacheUserInfo(client);
      } catch {
        // Non-fatal, continue with existing auth.
      }
    }
    console.log('Loaded cached credentials.');
    return client;
  }

  // In Google Cloud Shell, we can use Application Default Credentials (ADC)
  // provided via its metadata server to authenticate non-interactively using
  // the identity of the user logged into Cloud Shell.
  if (authType === AuthType.CLOUD_SHELL) {
    try {
      console.log("Attempting to authenticate via Cloud Shell VM's ADC.");
      const computeClient = new Compute({
        // We can leave this empty, since the metadata server will provide
        // the service account email.
      });
      await computeClient.getAccessToken();
      console.log('Authentication successful.');

      // Do not cache creds in this case; note that Compute client will handle its own refresh
      return computeClient;
    } catch (e) {
      throw new Error(
        `Could not authenticate using Cloud Shell credentials. Please select a different authentication method or ensure you are in a properly configured environment. Error: ${getErrorMessage(
          e,
        )}`,
      );
    }
  }

  if (config.getNoBrowser() || !shouldAttemptBrowserLaunch()) {
    let success = false;
    const maxRetries = 2;
    for (let i = 0; !success && i < maxRetries; i++) {
      success = await authWithUserCode(client);
      if (!success && i < maxRetries - 1) {
        console.log('Retrying authentication...');
      }
    }
    if (!success) {
      throw new Error('Failed to authenticate after multiple attempts.');
    }
    return client;
  }

  // Try web-based auth first, fall back to user code if it fails
  try {
    const webLogin = await authWithWeb(client);
    await webLogin.loginCompletePromise;
    return client;
  } catch (e) {
    console.log('Web-based authentication failed, trying user code flow...');
    const success = await authWithUserCode(client);
    if (!success) {
      throw new Error(
        `Authentication failed. Error: ${getErrorMessage(e)}`,
      );
    }
    return client;
  }
}

function shouldAttemptBrowserLaunch(): boolean {
  // Don't attempt browser launch in CI environments
  return !process.env.CI && !process.env.GITHUB_ACTIONS;
}

async function authWithUserCode(client: OAuth2Client): Promise<boolean> {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_SCOPE,
    prompt: 'consent',
  });

  console.log('\n🔐 Authentication Required');
  console.log('Please visit the following URL to authenticate:');
  console.log(authUrl);
  console.log('\nAfter authentication, you will be redirected to a page that may not load.');
  console.log('This is expected. You can close that page once you see the success message.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nPress Enter after you have completed authentication: ', () => {
      rl.close();
      resolve(true);
    });
  });
}

async function authWithWeb(client: OAuth2Client): Promise<OauthWebLogin> {
  const port = await getAvailablePort();
  const redirectUrl = `http://localhost:${port}`;

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_SCOPE,
    redirect_uri: redirectUrl,
    prompt: 'consent',
  });

  let loginCompletePromise: Promise<void>;
  let resolveLogin: () => void;
  let rejectLogin: (error: Error) => void;

  loginCompletePromise = new Promise((resolve, reject) => {
    resolveLogin = resolve;
    rejectLogin = reject;
  });

  // Start a simple HTTP server to handle the OAuth callback
  const http = await import('node:http');
  const url = await import('node:url');

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url!, true);
    const code = parsedUrl.query.code as string;
    const error = parsedUrl.query.error as string;

    if (error) {
      res.writeHead(400);
      res.end('Authentication failed');
      rejectLogin(new Error(`OAuth error: ${error}`));
      server.close();
      return;
    }

    if (code) {
      try {
        const { tokens } = await client.getToken(code);
        await client.setCredentials(tokens);
        await cacheCredentials(tokens);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body>
              <h1>Authentication Successful!</h1>
              <p>You can close this window now.</p>
              <script>window.close();</script>
            </body>
          </html>
        `);

        resolveLogin();
        server.close();
      } catch (error) {
        res.writeHead(400);
        res.end('Failed to exchange code for tokens');
        rejectLogin(new Error(`Token exchange failed: ${getErrorMessage(error)}`));
        server.close();
      }
    } else {
      res.writeHead(400);
      res.end('No authorization code received');
      rejectLogin(new Error('No authorization code received'));
      server.close();
    }
  });

  server.listen(port, () => {
    console.log(`\n🔐 Opening browser for authentication...`);
    console.log(`If the browser doesn't open automatically, please visit:`);
    console.log(authUrl);
  });

  return {
    authUrl,
    loginCompletePromise,
  };
}

export function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const net = require('node:net');
    const server = net.createServer();
    
    server.listen(0, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    
    server.on('error', reject);
  });
}

async function loadCachedCredentials(client: OAuth2Client): Promise<boolean> {
  try {
    const credPath = getCachedCredentialPath();
    const credData = await fs.readFile(credPath, 'utf8');
    const credentials = JSON.parse(credData);
    client.setCredentials(credentials);
    return true;
  } catch {
    return false;
  }
}

async function cacheCredentials(credentials: Credentials) {
  try {
    const credPath = getCachedCredentialPath();
    const credDir = path.dirname(credPath);
    await fs.mkdir(credDir, { recursive: true });
    await fs.writeFile(credPath, JSON.stringify(credentials, null, 2));
  } catch (error) {
    console.warn('Failed to cache credentials:', getErrorMessage(error));
  }
}

function getCachedCredentialPath(): string {
  return path.join(os.homedir(), GEMINI_DIR, CREDENTIAL_FILENAME);
}

export async function clearCachedCredentialFile() {
  try {
    const credPath = getCachedCredentialPath();
    await fs.unlink(credPath);
  } catch {
    // File doesn't exist, which is fine
  }
}

async function fetchAndCacheUserInfo(client: OAuth2Client): Promise<void> {
  try {
    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });
    
    // Cache user info if needed
    const userInfoPath = path.join(os.homedir(), GEMINI_DIR, 'user_info.json');
    await fs.mkdir(path.dirname(userInfoPath), { recursive: true });
    await fs.writeFile(userInfoPath, JSON.stringify(userInfo.data, null, 2));
  } catch (error) {
    console.warn('Failed to fetch user info:', getErrorMessage(error));
  }
}

function getCachedGoogleAccount(): string | null {
  try {
    const userInfoPath = path.join(os.homedir(), GEMINI_DIR, 'user_info.json');
    const userInfo = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
    return userInfo.email || null;
  } catch {
    return null;
  }
} 