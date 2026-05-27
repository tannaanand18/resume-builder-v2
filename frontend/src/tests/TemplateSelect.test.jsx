import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

import TemplateSelect from "../pages/TemplateSelect";

// ─── MOCKS ───

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock global fetch for createWithTemplate
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

function renderPage() {
  render(
    <BrowserRouter>
      <TemplateSelect />
    </BrowserRouter>
  );
}

// ────────── TESTS ──────────

// 1. Renders page heading
test("renders Choose Your Template heading", () => {
  renderPage();
  expect(screen.getByText(/choose your perfect template/i)).toBeInTheDocument();
});

// 2. Shows filter buttons
test("shows all filter buttons", () => {
  renderPage();
  expect(screen.getByText(/all templates/i)).toBeInTheDocument();
  expect(screen.getAllByText("Simple").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Modern").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Creative").length).toBeGreaterThan(0);
});

// 3. Shows template cards
test("shows template names", () => {
  renderPage();
  expect(screen.getByText("Classic")).toBeInTheDocument();
  expect(screen.getByText("Harvard")).toBeInTheDocument();
});

// 4. Filter by Simple shows only Simple templates
test("Simple filter shows only Simple templates", async () => {
  const user = userEvent.setup();
  renderPage();

  // Click the first "Simple" text (the filter button)
  await user.click(screen.getAllByText("Simple")[0]);
  // Simple templates should be visible
  expect(screen.getByText("Classic")).toBeInTheDocument();
  // "Modern" as a template card name should not be visible (Modern is both a filter and template name, use queryBy)
  // Instead, check that a Creative template is not shown
  expect(screen.queryByText("Black Pattern")).not.toBeInTheDocument();
});

// 5. Search filters templates
test("search filters templates by name", async () => {
  const user = userEvent.setup();
  renderPage();

  const searchInput = screen.getByPlaceholderText(/search templates/i);
  await user.type(searchInput, "Harvard");

  expect(screen.getByText("Harvard")).toBeInTheDocument();
  expect(screen.queryByText("Banking")).not.toBeInTheDocument();
});

// 6. Clicking a template calls fetch to create resume
test("clicking Use Template calls API and navigates", async () => {
  const user = userEvent.setup();
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ resume_id: 42 }),
  });

  renderPage();

  // Find and click the first "Use Template" button
  const useButtons = screen.getAllByText(/use template/i);
  await user.click(useButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/resume/42/edit");
  });
});

// 7. Failed create shows alert
test("failed template creation shows alert", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: "Server error" }),
  });

  renderPage();

  const useButtons = screen.getAllByText(/use template/i);
  await user.click(useButtons[0]);

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to create resume.");
  });
});

test("failed template creation without backend error still shows alert", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({}),
  });

  renderPage();
  const useButtons = screen.getAllByText(/use template/i);
  await user.click(useButtons[0]);

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to create resume.");
  });
});

// 8. Back to Dashboard button navigates
test("Back to Dashboard button navigates to /dashboard", async () => {
  const user = userEvent.setup();
  renderPage();
  await user.click(screen.getByText("Back to Dashboard"));
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

// 9. Search clear button clears search input
test("search clear button clears search input", async () => {
  const user = userEvent.setup();
  renderPage();
  const searchInput = screen.getByPlaceholderText(/search templates/i);
  await user.type(searchInput, "Harvard");
  expect(searchInput).toHaveValue("Harvard");
  await user.click(screen.getByText("✕"));
  expect(searchInput).toHaveValue("");
});

test("search with no match shows empty state", async () => {
  const user = userEvent.setup();
  renderPage();
  const searchInput = screen.getByPlaceholderText(/search templates/i);
  await user.type(searchInput, "zzzz-no-match");

  await waitFor(() => {
    expect(screen.getByText("No templates found")).toBeInTheDocument();
  });
});
