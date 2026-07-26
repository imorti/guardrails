import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://guardrails-lab.example/", {
      headers: {
        accept: "text/html",
        host: "guardrails-lab.example",
        "x-forwarded-host": "guardrails-lab.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Guardrails Lab application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Guardrails Lab — Interactive AI Safety Demo<\/title>/i,
  );
  assert.match(html, /See every safety decision/);
  assert.match(html, /Run the pipeline/);
  assert.match(html, /Roles and documents are simulated/);
  assert.match(html, /Run guardrails/);
  assert.match(html, /src="\/boar-life-black\.png"/);
  assert.match(html, /Black and white wild boar guardian illustration/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("publishes absolute social metadata", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(
    html,
    /property="og:image" content="https:\/\/guardrails-lab\.example\/og\.png"/,
  );
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});
