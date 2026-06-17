import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
