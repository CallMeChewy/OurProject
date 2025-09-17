#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { createToken, revokeToken, listTokens } = require('../services/token-service/tokenManager');

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
    .demandCommand()
    .help()
    .strict()
    .argv;

  return argv;
}

main();
