#!/usr/bin/env node

const assert = require("node:assert/strict");

const {
  buildArkSignedRequest,
  createArkAssetCacheStore,
  createArkTrustedAssetService,
} = require("../electron/main/uploaders/ark-trusted-assets.cjs");
const { buildTosPresignedPutUrl } = require("../electron/main/uploaders/cloud-storage.cjs");

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async text() { return JSON.stringify(body); },
});

async function run() {
  const signed = buildArkSignedRequest({
    action: "CreateAsset",
    payload: {
      GroupId: "group-1",
      URL: "https://bucket.tos-cn-shanghai.volces.com/a.jpg",
      AssetType: "Image",
      Name: "demo",
      ProjectName: "default",
    },
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "secret-example",
    region: "cn-beijing",
    now: new Date("2026-07-15T01:02:03.000Z"),
  });
  assert.equal(signed.url, "https://open.volcengineapi.com/?Action=CreateAsset&Version=2024-01-01");
  assert.equal(signed.headers["X-Date"], "20260715T010203Z");
  assert.equal(signed.signature, "f113a9ee4541412463adb726fc9ff66dd1cbaeb6792a3d8af0b3f3c2b25d1ed0");
  assert.match(signed.headers.Authorization, /Credential=AKIDEXAMPLE\/20260715\/cn-beijing\/ark\/request/);

  const publicReadPutUrl = buildTosPresignedPutUrl({
    accessKeyId: "tos-ak",
    secretAccessKey: "tos-sk",
    region: "cn-shanghai",
    endpointHost: "bucket.tos-cn-shanghai.volces.com",
    encodedKey: "ark/test.jpg",
    acl: "public-read",
  });
  assert.match(publicReadPutUrl, /X-Tos-SignedHeaders=host%3Bx-tos-acl/);

  const calls = [];
  let uploadCount = 0;
  const cacheStore = createArkAssetCacheStore("", 10);
  const service = createArkTrustedAssetService({
    cacheStore,
    readMediaPayload: async () => ({ buffer: Buffer.from("trusted-image-bytes"), mime: "image/png", filename: "person.png" }),
    preprocessImage: (buffer, mime, filename) => ({ buffer, mime, filename }),
    uploadToTosImpl: async (payload) => {
      uploadCount += 1;
      assert.equal(payload.publicRead, true);
      assert.equal(payload.tos.publicRead, true);
      return { ok: true, url: "https://bucket.tos-cn-shanghai.volces.com/ark/person.png" };
    },
    sleepImpl: async () => {},
    now: () => new Date("2026-07-15T01:02:03.000Z"),
    fetchImpl: async (url, options) => {
      const action = new URL(url).searchParams.get("Action");
      const body = JSON.parse(options.body);
      calls.push({ action, body });
      if (action === "CreateAssetGroup") return response({ Result: { Id: "group-created" } });
      if (action === "CreateAsset") return response({ Result: { Id: "asset-created", Status: "Pending" } });
      if (action === "GetAsset") return response({ Result: { Id: "asset-created", Status: "Active" } });
      return response({ ResponseMetadata: { Error: { Code: "UnknownAction", Message: action } } }, 400);
    },
  });
  const payload = {
    name: "人物参考图",
    tos: {
      accessKeyId: "tos-ak",
      secretAccessKey: "tos-sk",
      bucket: "bucket",
      region: "cn-shanghai",
      endpoint: "tos-cn-shanghai.volces.com",
    },
    ark: {
      region: "cn-beijing",
      projectName: "default",
      assetGroupName: "万卷测试",
    },
  };
  const [first, concurrent] = await Promise.all([service.register(payload), service.register(payload)]);
  assert.equal(first.assetId, "asset-created");
  assert.equal(concurrent.assetId, "asset-created");
  assert.equal(uploadCount, 1, "concurrent identical images must share one TOS upload");
  assert.equal(calls.filter((call) => call.action === "CreateAssetGroup").length, 1);
  assert.equal(calls.filter((call) => call.action === "CreateAsset").length, 1);
  assert.equal(calls.find((call) => call.action === "CreateAsset").body.URL, "https://bucket.tos-cn-shanghai.volces.com/ark/person.png");

  const cached = await service.register(payload);
  assert.equal(cached.cached, true);
  assert.equal(uploadCount, 1, "cached images must not upload again");
  assert.equal(calls.filter((call) => call.action === "CreateAsset").length, 1);

  const failedService = createArkTrustedAssetService({
    cacheStore: createArkAssetCacheStore("", 10),
    readMediaPayload: async () => ({ buffer: Buffer.from("failed-image"), mime: "image/png", filename: "failed.png" }),
    preprocessImage: (buffer, mime, filename) => ({ buffer, mime, filename }),
    uploadToTosImpl: async () => ({ ok: true, url: "https://bucket.example/failed.png" }),
    sleepImpl: async () => {},
    fetchImpl: async (url) => {
      const action = new URL(url).searchParams.get("Action");
      if (action === "CreateAsset") return response({ Result: { Id: "asset-failed", Status: "Pending" } });
      if (action === "GetAsset") return response({ Result: { Id: "asset-failed", Status: "Failed", FailureReason: "content rejected" } });
      return response({ Result: { Id: "group-existing" } });
    },
  });
  await assert.rejects(
    failedService.register({ ...payload, ark: { ...payload.ark, assetGroupId: "group-existing" } }),
    /content rejected/,
  );

  console.log("ark trusted assets: signing, public-read upload, review, cache, concurrency and failure guards passed");
}

run().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
