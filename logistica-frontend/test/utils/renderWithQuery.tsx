import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  renderHook,
  type RenderOptions,
  type RenderHookOptions,
} from "@testing-library/react";
import React from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function QueryWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function renderWithQuery(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: QueryWrapper, ...options });
}

export function renderHookWithQuery<T>(
  callback: () => T,
  options?: Omit<RenderHookOptions<unknown>, "wrapper">
) {
  return renderHook(callback, { wrapper: QueryWrapper, ...options });
}
