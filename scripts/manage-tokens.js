#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const axios = require('axios');
const { createToken, revokeToken, listTokens } = require('../services/token-service/tokenManager');

function resolveEndpoint(explicit) {
  if (explicit) return explicit;
  if (process.env.OURLIBRARY_TOKEN_ENDPOINT) {
    return process.env.OURLIBRARY_TOKEN_ENDPOINT;
  }
  throw new Error('Set OURLIBRARY_TOKEN_ENDPOINT or pass --endpoint');
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('manage-tokens')
    .command('create', 'Create a new distribution token', (y) => (
      y.option('tier', {
        type: 'string',
        demandOption: true,
        describe: 'Tier label to associate with the token (e.g. free, premium)'
      })
       .option('max-downloads', {
         type: 'number',
         describe: 'Optional download quota for this token'
       })
       .option('expires-in-hours', {
         type: 'number',
         describe: 'Optional expiration window in hours'
       })
    ), async (args) => {
      try {
        const token = await createToken({
          tier: args.tier,
          maxDownloads: args.maxDownloads,
          expiresInHours: args.expiresInHours,
        });
        console.log('Token created:', token);
      } catch (error) {
        console.error('Failed to create token:', error.message);
        process.exitCode = 1;
      }
    })
    .command('revoke <tokenId>', 'Revoke an existing token', (y) => (
      y.positional('tokenId', {
        type: 'string',
        describe: 'Token ID to revoke'
      })
    ), async (args) => {
      try {
        await revokeToken(args.tokenId);
        console.log('Token revoked:', args.tokenId);
      } catch (error) {
        console.error('Failed to revoke token:', error.message);
        process.exitCode = 1;
      }
    })
    .command('list', 'List tokens', (y) => (
      y.option('status', {
        type: 'string',
        describe: 'Filter by status (active, revoked, etc.)'
      })
    ), async (args) => {
      try {
        const tokens = await listTokens({ status: args.status });
        if (!tokens.length) {
          console.log('No tokens found.');
          return;
        }
        tokens.forEach((token) => {
          console.log(`${token.id} :: ${token.status} :: tier=${token.tier} :: usage=${token.usageCount}/${token.maxDownloads ?? '∞'}`);
        });
      } catch (error) {
        console.error('Failed to list tokens:', error.message);
        process.exitCode = 1;
      }
    })
    .command('issue-url <token> <fileId> <version>', 'Request download URL via token service', (y) => (
      y.option('endpoint', {
        type: 'string',
        describe: 'Override token service endpoint'
      })
    ), async (args) => {
      try {
        const endpoint = resolveEndpoint(args.endpoint);
        const response = await axios.post(endpoint, {
          token: args.token,
          fileId: args.fileId,
          version: args.version,
        }, { timeout: 15000 });

        const data = response.data || {};
        console.log('Download URL:', data.downloadUrl);
        if (data.quotaLimit != null) {
          console.log(`Quota: ${data.quotaRemaining ?? 'unknown'} remaining of ${data.quotaLimit}`);
        }
        if (data.archive) {
          console.log('Archive metadata:', data.archive);
        }
      } catch (error) {
        if (error.response && error.response.data) {
          const { message, code } = error.response.data;
          console.error('Token service error:', message || error.response.statusText, code ? `(code: ${code})` : '');
        } else {
          console.error('Failed to issue download URL:', error.message);
        }
        process.exitCode = 1;
      }
    })
    .demandCommand()
    .help()
    .strict()
    .argv;

  return argv;
}

main();
