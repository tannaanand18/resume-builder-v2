import { vi, test, expect, beforeEach } from "vitest";
import { registerUser, loginUser } from "../services/authService";
import api from "../services/api";

// ─── MOCK the api module ───
vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────── TESTS ──────────

// 1. registerUser calls correct endpoint
test("registerUser sends POST to /auth/register", async () => {
  const mockData = { name: "John", email: "john@test.com", password: "pass123" };
  api.post.mockResolvedValue({ data: { message: "User registered" } });

  const result = await registerUser(mockData);

  expect(api.post).toHaveBeenCalledWith("/auth/register", mockData);
  expect(result).toEqual({ message: "User registered" });
});

// 2. loginUser calls correct endpoint
test("loginUser sends POST to /auth/login", async () => {
  const creds = { email: "john@test.com", password: "pass123" };
  api.post.mockResolvedValue({ data: { user: { id: 1, email: "john@test.com" } } });

  const result = await loginUser(creds);

  expect(api.post).toHaveBeenCalledWith("/auth/login", creds);
  expect(result).toEqual({ user: { id: 1, email: "john@test.com" } });
});

// 3. registerUser throws on error
test("registerUser throws when API fails", async () => {
  api.post.mockRejectedValue(new Error("Network error"));

  await expect(registerUser({ name: "X" })).rejects.toThrow("Network error");
});

// 4. loginUser throws on error
test("loginUser throws when API fails", async () => {
  api.post.mockRejectedValue(new Error("Invalid credentials"));

  await expect(loginUser({ email: "bad" })).rejects.toThrow("Invalid credentials");
});
