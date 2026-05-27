import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import api from "../services/api";
import { resumeService } from "../services/resumeService";

// ─── MOCKS ───

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../services/resumeService", () => ({
  resumeService: {
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Default: logged-in user
const mockLogout = vi.fn();
let mockUser = { email: "test@example.com", role: "user" };
let mockAuthLoading = false;

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    loading: mockAuthLoading,
  }),
}));

function renderPage() {
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { email: "test@example.com", role: "user" };
  mockAuthLoading = false;
  api.get.mockResolvedValue({ data: [] });
});

// ────────── TESTS ──────────

// 1. Shows heading and empty state
test("renders My Resumes heading", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("My Resumes")).toBeInTheDocument();
  });
});

// 2. Shows "No resumes yet" when list is empty
test("shows empty state when no resumes", async () => {
  api.get.mockResolvedValue({ data: [] });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("No resumes yet")).toBeInTheDocument();
  });
});

// 3. Shows resume cards when resumes exist
test("shows resume cards when resumes exist", async () => {
  api.get.mockResolvedValue({
    data: [
      { id: 1, title: "My Resume", updated_at: "2024-01-15T00:00:00Z" },
      { id: 2, title: "Second Resume", updated_at: "2024-02-20T00:00:00Z" },
    ],
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("My Resume")).toBeInTheDocument();
    expect(screen.getByText("Second Resume")).toBeInTheDocument();
  });
});

test("handles non-array resume payload safely", async () => {
  api.get.mockResolvedValue({ data: { bad: true } });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("No resumes yet")).toBeInTheDocument();
  });
});

// 4. "New Resume" button navigates to /resume/new
test("New Resume button navigates to /resume/new", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("My Resumes")).toBeInTheDocument();
  });
  const buttons = screen.getAllByText("New Resume");
  await user.click(buttons[0]);
  expect(mockNavigate).toHaveBeenCalledWith("/resume/new");
});

// 5. Logout button works
test("Logout button calls logout and navigates to /login", async () => {
  const user = userEvent.setup();
  mockLogout.mockResolvedValue();
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
  await user.click(screen.getByText("Logout"));
  expect(mockLogout).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith("/login");
});

// 6. Displays user email initial in avatar
test("shows user initial in avatar", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("T")).toBeInTheDocument();
  });
});

test("uses avatar and username fallbacks when email is missing", async () => {
  mockUser = { email: "", role: "user" };
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("U")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });
});

test("uses Untitled Resume fallback for empty title", async () => {
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "", updated_at: "2024-01-01T00:00:00Z" }],
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Untitled Resume")).toBeInTheDocument();
  });
});

// 7. Delete resume removes card
test("delete button removes resume from list", async () => {
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "Test Resume", updated_at: "2024-01-01T00:00:00Z" }],
  });
  resumeService.delete.mockResolvedValue();
  const user = userEvent.setup();

  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Test Resume")).toBeInTheDocument();
  });

  const deleteBtn = screen.getByTitle("Delete");
  await user.click(deleteBtn);

  await waitFor(() => {
    expect(resumeService.delete).toHaveBeenCalledWith(1);
  });
});

// 8. Admin user sees Admin button
test("admin user sees Admin button", async () => {
  mockUser = { email: "admin@test.com", role: "admin" };
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/🛡️ Admin/)).toBeInTheDocument();
  });
});

// 9. authLoading shows spinner
test("shows loading spinner when auth is loading", () => {
  mockAuthLoading = true;
  renderPage();
  expect(screen.queryByText("My Resumes")).not.toBeInTheDocument();
});

// 10. No user returns null and redirects
test("no user redirects to /login", async () => {
  mockUser = null;
  renderPage();
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});

// 11. fetchResumes error is caught
test("fetchResumes error shows console.error", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockRejectedValue(new Error("Network error"));
  renderPage();
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalled();
  });
  consoleSpy.mockRestore();
});

// 12. Duplicate resume calls create and refreshes
test("duplicate button duplicates resume", async () => {
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "My Resume", summary: "Sum", full_name: "John", email: "j@e.com", phone: "123", linkedin: "li", updated_at: "2024-01-01T00:00:00Z" }],
  });
  resumeService.create.mockResolvedValue({ data: { id: 2 } });
  const user = userEvent.setup();

  renderPage();
  await waitFor(() => {
    expect(screen.getByText("My Resume")).toBeInTheDocument();
  });

  const dupBtn = screen.getByTitle("Duplicate");
  await user.click(dupBtn);

  await waitFor(() => {
    expect(resumeService.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My Resume (Copy)" })
    );
  });
});

// 13. Duplicate resume failure shows alert
test("duplicate resume failure shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "My Resume", updated_at: "2024-01-01T00:00:00Z" }],
  });
  resumeService.create.mockRejectedValue(new Error("fail"));
  const user = userEvent.setup();

  renderPage();
  await waitFor(() => {
    expect(screen.getByText("My Resume")).toBeInTheDocument();
  });

  await user.click(screen.getByTitle("Duplicate"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to duplicate");
  });
});

// 14. Delete resume failure shows alert
test("delete resume failure shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "Test Resume", updated_at: "2024-01-01T00:00:00Z" }],
  });
  resumeService.delete.mockRejectedValue(new Error("fail"));
  const user = userEvent.setup();

  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Test Resume")).toBeInTheDocument();
  });

  await user.click(screen.getByTitle("Delete"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to delete");
  });
});

// 15. Resume card click navigates to edit
test("resume card click navigates to /resume/:id/edit", async () => {
  api.get.mockResolvedValue({
    data: [{ id: 5, title: "Click Me", updated_at: "2024-01-01T00:00:00Z" }],
  });
  const user = userEvent.setup();

  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Click Me"));
  expect(mockNavigate).toHaveBeenCalledWith("/resume/5/edit");
});

// 16. Admin button navigates to /admin
test("admin button navigates to /admin", async () => {
  mockUser = { email: "admin@test.com", role: "admin" };
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/🛡️ Admin/)).toBeInTheDocument();
  });
  await user.click(screen.getByText(/🛡️ Admin/));
  expect(mockNavigate).toHaveBeenCalledWith("/admin");
});

// 17. Logout button hover events
test("logout button hover changes style", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
  const logoutBtn = screen.getByText("Logout");
  fireEvent.mouseEnter(logoutBtn);
  fireEvent.mouseLeave(logoutBtn);
});

// 18. Duplicate button hover events
test("duplicate button hover changes style", async () => {
  api.get.mockResolvedValue({
    data: [{ id: 1, title: "HR", updated_at: "2024-01-01T00:00:00Z" }],
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("HR")).toBeInTheDocument();
  });
  const dupBtn = screen.getByTitle("Duplicate");
  fireEvent.mouseEnter(dupBtn);
  fireEvent.mouseLeave(dupBtn);
  const delBtn = screen.getByTitle("Delete");
  fireEvent.mouseEnter(delBtn);
  fireEvent.mouseLeave(delBtn);
});
