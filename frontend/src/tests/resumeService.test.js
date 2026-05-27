import { vi, test, expect, beforeEach } from "vitest";
import { resumeService } from "../services/resumeService";
import api from "../services/api";

// ─── MOCK the api module ───
vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ────────── TESTS ──────────

// 1. getAll
test("getAll calls GET /resume/", async () => {
  const mockResumes = [{ id: 1, title: "My Resume" }];
  api.get.mockResolvedValue({ data: mockResumes });

  const result = await resumeService.getAll();

  expect(api.get).toHaveBeenCalledWith("/resume/");
  expect(result).toEqual(mockResumes);
});

// 2. getById
test("getById calls GET /resume/:id", async () => {
  const mockResume = { id: 5, title: "Resume 5" };
  api.get.mockResolvedValue({ data: mockResume });

  const result = await resumeService.getById(5);

  expect(api.get).toHaveBeenCalledWith("/resume/5");
  expect(result).toEqual(mockResume);
});

// 3. create
test("create calls POST /resume/", async () => {
  const newResume = { title: "New Resume" };
  api.post.mockResolvedValue({ data: { id: 10, ...newResume } });

  const result = await resumeService.create(newResume);

  expect(api.post).toHaveBeenCalledWith("/resume/", newResume);
  expect(result).toEqual({ id: 10, title: "New Resume" });
});

// 4. update
test("update calls PUT /resume/:id", async () => {
  const updateData = { title: "Updated" };
  api.put.mockResolvedValue({ data: { id: 3, ...updateData } });

  const result = await resumeService.update(3, updateData);

  expect(api.put).toHaveBeenCalledWith("/resume/3", updateData);
  expect(result).toEqual({ id: 3, title: "Updated" });
});

// 5. delete
test("delete calls DELETE /resume/:id", async () => {
  api.delete.mockResolvedValue({ data: { message: "Deleted" } });

  const result = await resumeService.delete(7);

  expect(api.delete).toHaveBeenCalledWith("/resume/7");
  expect(result).toEqual({ message: "Deleted" });
});

// 6. getAll throws on error
test("getAll throws when API fails", async () => {
  api.get.mockRejectedValue(new Error("Server error"));

  await expect(resumeService.getAll()).rejects.toThrow("Server error");
});
