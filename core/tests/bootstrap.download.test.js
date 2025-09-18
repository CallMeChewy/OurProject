const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const crypto = require('node:crypto');

const axiosModulePath = require.resolve('axios');
const originalAxios = require(axiosModulePath);
const tokenClientPath = require.resolve('../modules/tokenClient');
const originalTokenClient = require(tokenClientPath);
const databaseUtils = require('../modules/database');

const originalTempDownloadPath = databaseUtils.tempDownloadPath;

test('downloadDatabase streams signed URL into local file', async (t) => {
  const tempAppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));

  let tokenStubCalled = false;
  let axiosCalled = false;
  const downloadBuffer = Buffer.from('fake-sqlite-db');
  const expectedHash = crypto.createHash('sha256').update(downloadBuffer).digest('hex');

  const axiosStub = async (options) => {
    axiosCalled = true;
    assert.strictEqual(options.method, 'get');
    assert.strictEqual(options.url, 'https://signed.example/download');
    const stream = new PassThrough();
    stream.end(downloadBuffer);
    return {
      status: 200,
      data: stream,
      headers: { 'content-length': String(downloadBuffer.length) },
    };
  };

  const tokenStub = {
    requestSignedUrl: async ({ token, fileId, version }) => {
      tokenStubCalled = true;
      assert.strictEqual(token, 'TOK123');
      assert.strictEqual(fileId, 'file-xyz');
      assert.strictEqual(version, '4.5.6');
      return {
        url: 'https://signed.example/download',
        archive: { file_id: fileId, version, sha256: expectedHash },
      };
    },
  };

  // Prepare environment
  try {
    require.cache[axiosModulePath].exports = axiosStub;
    require.cache[tokenClientPath].exports = tokenStub;
    delete require.cache[require.resolve('../bootstrap')];
    const Bootstrap = require('../bootstrap');
    databaseUtils.tempDownloadPath = () => path.join(tempAppDir, 'download-temp.db');

    const bootstrap = new Bootstrap();
    bootstrap.appDir = tempAppDir;
    bootstrap.config = {
      database_path: './database/OurLibrary.db',
      downloads_dir: './downloads',
      cache_dir: './cache',
      distribution_token: 'TOK123'
    };

    fs.mkdirSync(path.join(tempAppDir, 'database'), { recursive: true });
    fs.mkdirSync(path.join(tempAppDir, 'downloads'), { recursive: true });
    fs.mkdirSync(path.join(tempAppDir, 'cache'), { recursive: true });

    const info = await bootstrap.resolveDownloadInfo({ file_id: 'file-xyz', version: '4.5.6' });
    assert.strictEqual(info.url, 'https://signed.example/download');

    await bootstrap.downloadDatabase(info);

    const dbContent = fs.readFileSync(bootstrap.getDatabasePath());
    assert.ok(dbContent.length > 0);
    assert.ok(tokenStubCalled, 'token client should be called');
    assert.ok(axiosCalled, 'axios should fetch signed URL');
  } finally {
    databaseUtils.tempDownloadPath = originalTempDownloadPath;
    require.cache[axiosModulePath].exports = originalAxios;
    require.cache[tokenClientPath].exports = originalTokenClient;
    delete require.cache[require.resolve('../bootstrap')];
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
});


test('downloadDatabase rejects when SHA-256 does not match', async (t) => {
  const tempAppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));

  const downloadBuffer = Buffer.from('fake-sqlite-db');
  const wrongHash = 'deadbeef';

  const axiosStub = async () => {
    const stream = new PassThrough();
    stream.end(downloadBuffer);
    return {
      status: 200,
      data: stream,
      headers: { 'content-length': String(downloadBuffer.length) },
    };
  };

  try {
    require.cache[axiosModulePath].exports = axiosStub;
    require.cache[tokenClientPath].exports = {
      requestSignedUrl: async () => ({
        url: 'https://signed.example/download',
        archive: { file_id: 'file-xyz', version: '4.5.6', sha256: wrongHash },
      }),
    };
    delete require.cache[require.resolve('../bootstrap')];
    const Bootstrap = require('../bootstrap');
    databaseUtils.tempDownloadPath = () => path.join(tempAppDir, 'download-temp.db');

    const bootstrap = new Bootstrap();
    bootstrap.appDir = tempAppDir;
    bootstrap.config = {
      database_path: './database/OurLibrary.db',
      downloads_dir: './downloads',
      cache_dir: './cache',
      distribution_token: 'TOK123'
    };

    fs.mkdirSync(path.join(tempAppDir, 'database'), { recursive: true });
    fs.mkdirSync(path.join(tempAppDir, 'downloads'), { recursive: true });
    fs.mkdirSync(path.join(tempAppDir, 'cache'), { recursive: true });

    const info = await bootstrap.resolveDownloadInfo({ file_id: 'file-xyz', version: '4.5.6' });
    await assert.rejects(() => bootstrap.downloadDatabase(info), /integrity check/);
  } finally {
    databaseUtils.tempDownloadPath = originalTempDownloadPath;
    require.cache[axiosModulePath].exports = originalAxios;
    require.cache[tokenClientPath].exports = originalTokenClient;
    delete require.cache[require.resolve('../bootstrap')];
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
});
