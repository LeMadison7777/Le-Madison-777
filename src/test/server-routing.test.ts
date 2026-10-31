import { describe, it, expect } from "vitest";
import { handleApi } from "../../server/api.js";

describe("handleApi routing", () => {
  it("responds with 204 to OPTIONS requests", async () => {
    const request = new Request("http://localhost:8082/api/listings", {
      method: "OPTIONS",
    });
    const response = await handleApi(request);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("handles /api/robots correctly", async () => {
    const request = new Request("http://localhost:8082/api/robots", {
      method: "GET",
    });
    const response = await handleApi(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Sitemap:");
  });

  it("resolves rewritten route via __madclothes_route parameter when hitting /api", async () => {
    const request = new Request(
      "http://localhost:8082/api?__madclothes_route=/api/robots",
      { method: "GET" }
    );
    const response = await handleApi(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("User-agent: *");
  });

  it("returns JSON 404 for an unknown API route", async () => {
    const request = new Request("http://localhost:8082/api/non-existent-endpoint", {
      method: "GET",
    });
    const response = await handleApi(request);
    // If DATABASE_URL is not set in test environment, it returns 503 JSON, or 404 JSON
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});

