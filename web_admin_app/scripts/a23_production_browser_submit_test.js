/* global console, fetch, process */

const apiBaseUrl = "https://zhongyuan-fude-web-admin-api.onrender.com";
const productionOrigin = "https://zhongyuan-fude-web-admin-test.vercel.app";
const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const title = `A23F5 production browser test ${timestamp}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function preflight() {
  const response = await fetch(`${apiBaseUrl}/api/records`, {
    method: "OPTIONS",
    headers: {
      Origin: productionOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  return {
    status: response.status,
    allowOrigin: response.headers.get("access-control-allow-origin"),
    allowMethods: response.headers.get("access-control-allow-methods"),
    allowHeaders: response.headers.get("access-control-allow-headers"),
  };
}

async function postRecord() {
  const response = await fetch(`${apiBaseUrl}/api/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: productionOrigin,
    },
    body: JSON.stringify({
      module_key: "devotees",
      title,
      summary: "A23F5 production browser submit diagnostic",
      status: "active",
      responsible: "A23F5 diagnostic",
      category: "一般善信",
      fields_json: {
        authorization: "待確認",
        note: "A23F5 production browser submit diagnostic",
      },
      tags_json: ["A23F5"],
      actor_role: "admin",
      actor_name: "A23F5 diagnostic",
    }),
  });

  const text = await response.text();
  return {
    status: response.status,
    ok: response.ok,
    body: text ? JSON.parse(text) : null,
  };
}

async function main() {
  const options = await preflight();
  const originAllowed = options.allowOrigin === productionOrigin;
  const postAllowed = options.allowMethods?.includes("POST") ?? false;
  const contentTypeAllowed = options.allowHeaders === "*" || options.allowHeaders?.toLowerCase().includes("content-type");

  assert(options.status >= 200 && options.status < 300, `OPTIONS preflight failed with ${options.status}`);
  assert(originAllowed, "OPTIONS did not allow production origin");
  assert(postAllowed, "OPTIONS did not allow POST");
  assert(contentTypeAllowed, "OPTIONS did not allow content-type header");

  const post = await postRecord();
  assert(post.ok, `POST failed with ${post.status}`);
  assert(post.body?.id, "POST response should include id");
  assert(post.body.module_key === "devotees", "POST module_key should be devotees");
  assert(post.body.status === "active", "POST status should be active");

  console.log(JSON.stringify({
    ok: true,
    preflight: options,
    postStatus: post.status,
    createdId: post.body.id,
    title: post.body.title,
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
