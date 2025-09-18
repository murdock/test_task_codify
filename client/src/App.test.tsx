import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import App from "./App";

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  // clean isolated state per test
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();

  // fresh fetch mock
  (globalThis.fetch as unknown as jest.Mock) = jest.fn(async (url, opts) => {
    const href = String(url);

    if (href.endsWith("/api/session")) {
      return {
        ok: true,
        json: async () => ({ sid: "test-sid", credits: 10, active: true }),
      } as Response;
    }

    if (href.endsWith("/api/roll")) {
      return {
        ok: true,
        json: async () => ({
          credits: 9,
          symbols: ["C", "C", "C"],
          win: true,
          reward: 10,
        }),
      } as Response;
    }

    if (href.endsWith("/api/cashout")) {
      const body = opts?.body ? JSON.parse(String(opts.body)) : {};
      if (body.sid && body.userId) {
        return {
          ok: true,
          json: async () => ({ credited: 14, balance: 14 }),
        } as Response;
      }
      return { ok: false, json: async () => ({ error: "bad body" }) } as Response;
    }

    throw new Error(`Unknown endpoint in test mock: ${href}`);
  });
});

test("starts session automatically (10 starting credits)", async () => {
  render(<App />);

  // wait for the actual text, not just the node
  await screen.findByText(/credits:\s*10/i);
  expect(screen.getByTestId("credits")).toHaveTextContent("Credits: 10");
});

test("pulling the lever spins reels and applies roll result (credits 9, three cherries)", async () => {
  render(<App />);

  // ensure session loaded
  await screen.findByText(/credits:\s*10/i);

  const leverBtn = await screen.findByRole("button", { name: /🎰 pull lever/i });
  fireEvent.click(leverBtn);

  // confirm that /api/roll was actually called before moving timers
  await waitFor(() => {
    const calls = (globalThis.fetch as jest.Mock).mock.calls;
    expect(calls.some(([u]) => String(u).endsWith("/api/roll"))).toBe(true);
  });

  // reels reveal at 1s/2s/3s → apply all inside act()
  await act(async () => {
    jest.advanceTimersByTime(3100);
  });

  // credits updated after the 3rd reveal
  await screen.findByText(/credits:\s*9/i);
  expect(screen.getByTestId("credits")).toHaveTextContent("Credits: 9");

  // UI maps C→🍒 so we should see three cherries
  const cherries = screen.getAllByText("🍒");
  expect(cherries).toHaveLength(3);
});

test("cash out calls API and alerts the credited amount & balance", async () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

  render(<App />);

  // wait until button is enabled (session loaded and credits > 0)
  await screen.findByText(/credits:\s*10/i);
  const cashoutBtn = await screen.findByRole("button", { name: /cash out/i });
  expect(cashoutBtn).toBeEnabled();

  fireEvent.click(cashoutBtn);

  await waitFor(() => {
    expect(alertSpy).toHaveBeenCalledWith("Cashed out 14 credits. Balance: 14");
  });
});
