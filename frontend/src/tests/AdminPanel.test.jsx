import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

import AdminPanel from "../pages/AdminPanel";
import api from "../services/api";

// ─── MOCKS ───

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogout = vi.fn();
let mockUser = { email: "admin@test.com", role: "admin" };

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

const mockStats = {
  total_users: 10,
  total_resumes: 25,
  total_admins: 2,
  recent_users: [{ id: 1, name: "John", email: "john@test.com", created_at: "2024-01-01" }],
  recent_resumes: [{ id: 1, title: "Resume 1", template_name: "simple", created_at: "2024-01-01" }],
};

const mockUsers = [
  { id: 1, name: "John", email: "john@test.com", role: "user", resume_count: 3, created_at: "2024-01-01" },
  { id: 2, name: "Admin", email: "admin@test.com", role: "admin", resume_count: 1, created_at: "2024-01-02" },
];

const mockResumes = [
  { id: 1, title: "Resume A", user_id: 1, user_name: "John", user_email: "john@test.com", template_name: "simple", template_style: "classic", created_at: "2024-01-01" },
];

function renderPage() {
  render(
    <BrowserRouter>
      <AdminPanel />
    </BrowserRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { email: "admin@test.com", role: "admin" };

  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: mockStats });
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.resolve({ data: mockResumes });
    return Promise.resolve({ data: {} });
  });
});

// ────────── TESTS ──────────

// 1. Renders admin header
test("renders Admin Panel header", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
  });
});

// 2. Shows stats on Dashboard tab
test("shows stats cards with correct numbers", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

// 3. Tab switching works
test("can switch to Users tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Users"));
  await waitFor(() => {
    expect(screen.getByText(/All Users/i)).toBeInTheDocument();
  });
});

// 4. Users tab shows user list
test("Users tab shows user names", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => {
    expect(screen.getByText("John")).toBeInTheDocument();
  });
});

// 5. Resumes tab shows resume list
test("Resumes tab shows resume titles", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => {
    expect(screen.getByText("Resume A")).toBeInTheDocument();
  });
});

// 6. Non-admin gets redirected
test("non-admin user is redirected to dashboard", () => {
  mockUser = { email: "user@test.com", role: "user" };
  renderPage();
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

// 7. Dashboard button navigates back
test("Dashboard button navigates to /dashboard", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("← Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("← Dashboard"));
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

// 8. Logout button works
test("Logout calls logout and navigates to /login", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Logout")).toBeInTheDocument());

  await user.click(screen.getByText("Logout"));
  expect(mockLogout).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith("/login");
});

// 9. Delete user via confirm modal
test("delete user via confirm modal", async () => {
  api.delete.mockResolvedValue({ data: { message: "User deleted" } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  // Click Delete button on John's row
  const deleteButtons = screen.getAllByText("Delete");
  await user.click(deleteButtons[0]);

  // Confirm modal appears
  await waitFor(() => {
    expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument();
  });

  // Click Delete Forever
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith("/admin/users/1");
  });
});

// 10. Delete user failure shows toast
test("delete user failure shows error toast", async () => {
  api.delete.mockRejectedValue({ response: { data: { error: "Cannot delete" } } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("Delete");
  await user.click(deleteButtons[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(screen.getByText(/Cannot delete/)).toBeInTheDocument();
  });
});

test("delete user failure without backend message uses fallback toast", async () => {
  api.delete.mockRejectedValue(new Error("fail"));
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("Delete");
  await user.click(deleteButtons[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(screen.getByText(/Failed to delete user/)).toBeInTheDocument();
  });
});

// 11. Change user role
test("change role button toggles user role", async () => {
  api.put.mockResolvedValue({ data: { message: "Role changed" } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  // John is "user" role, so button should say "→ Admin"
  await user.click(screen.getByText("→ Admin"));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith("/admin/users/1/role", { role: "admin" });
  });
});

// 12. Change role failure shows toast
test("change role failure shows error toast", async () => {
  api.put.mockRejectedValue({ response: { data: { error: "Failed" } } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  await user.click(screen.getByText("→ Admin"));
  await waitFor(() => {
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });
});

test("change role failure without backend message uses fallback toast", async () => {
  api.put.mockRejectedValue(new Error("fail"));
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  await user.click(screen.getByText("→ Admin"));
  await waitFor(() => {
    expect(screen.getByText(/Failed to change role/)).toBeInTheDocument();
  });
});

// 13. Delete resume (admin)
test("delete resume via confirm modal on Resumes tab", async () => {
  api.delete.mockResolvedValue({});
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => expect(screen.getByText("Resume A")).toBeInTheDocument());

  await user.click(screen.getAllByText("Delete")[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith("/admin/resumes/1");
  });
});

// 14. Delete resume failure (admin)
test("delete resume failure shows error toast", async () => {
  api.delete.mockRejectedValue(new Error("fail"));
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => expect(screen.getByText("Resume A")).toBeInTheDocument());

  await user.click(screen.getAllByText("Delete")[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(screen.getByText(/Failed to delete resume/)).toBeInTheDocument();
  });
});

// 15. User detail view
test("clicking user row opens user detail view", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  // Click John's row to open detail view
  await user.click(screen.getByText("John"));

  await waitFor(() => {
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("Resumes by this user")).toBeInTheDocument();
    expect(screen.getByText("← Back to Users")).toBeInTheDocument();
  });
});

// 16. Back to Users button in detail view
test("back to users button closes detail view", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());
  await user.click(screen.getByText("John"));
  await waitFor(() => expect(screen.getByText("← Back to Users")).toBeInTheDocument());
  await user.click(screen.getByText("← Back to Users"));

  await waitFor(() => {
    expect(screen.getByText(/All Users/i)).toBeInTheDocument();
  });
});

// 17. User detail view change role
test("change role from user detail view", async () => {
  api.put.mockResolvedValue({ data: { message: "Role changed" } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());
  await user.click(screen.getByText("John"));
  await waitFor(() => expect(screen.getByText("Promote to Admin")).toBeInTheDocument());
  await user.click(screen.getByText("Promote to Admin"));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith("/admin/users/1/role", { role: "admin" });
  });
});

// 18. Search filtering users
test("search filters users by name", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  const searchInput = screen.getByPlaceholderText(/search by name or email/i);
  await user.type(searchInput, "John");

  expect(screen.getByText("John")).toBeInTheDocument();
});

// 19. Search filtering resumes
test("search filters resumes by title", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => expect(screen.getByText("Resume A")).toBeInTheDocument());

  const searchInput = screen.getByPlaceholderText(/search by title/i);
  await user.type(searchInput, "Resume A");

  expect(screen.getByText("Resume A")).toBeInTheDocument();
});

// 20. Cancel confirm delete modal
test("cancel button closes confirm delete modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  await user.click(screen.getAllByText("Delete")[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Cancel"));

  await waitFor(() => {
    expect(screen.queryByText("Delete Forever")).not.toBeInTheDocument();
  });
});

// 21. Fetch error handling (stats 403 redirects)
test("stats 403 redirects to dashboard", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.reject({ response: { status: 403 } });
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.resolve({ data: mockResumes });
    return Promise.resolve({ data: {} });
  });
  renderPage();
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});

// 21b. Stats generic error (non-403) shows toast
test("stats generic error shows toast", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.reject(new Error("server down"));
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.resolve({ data: mockResumes });
    return Promise.resolve({ data: {} });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load stats/)).toBeInTheDocument();
  });
});

// 22. Fetch users error
test("fetch users error shows toast", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: mockStats });
    if (url === "/admin/users") return Promise.reject(new Error("fail"));
    if (url === "/admin/resumes") return Promise.resolve({ data: mockResumes });
    return Promise.resolve({ data: {} });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load users/)).toBeInTheDocument();
  });
});

// 23. Fetch resumes error
test("fetch resumes error shows toast", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: mockStats });
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.reject(new Error("fail"));
    return Promise.resolve({ data: {} });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load resumes/)).toBeInTheDocument();
  });
});

// 24. Loading state
test("loading state shows spinner", () => {
  // Make all fetches pending (never resolve)
  api.get.mockImplementation(() => new Promise(() => {}));
  renderPage();
  expect(screen.getByText("Loading admin panel...")).toBeInTheDocument();
});

// 25. formatDate with null returns dash
test("formatDate with null date shows dash", async () => {
  const statsWithNull = {
    ...mockStats,
    recent_users: [{ id: 1, name: "NoDate", email: "nd@test.com", created_at: null }],
  };
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: statsWithNull });
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.resolve({ data: mockResumes });
    return Promise.resolve({ data: {} });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// 26. Empty search results shows "No users found"
test("search with no matches shows empty state", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  const searchInput = screen.getByPlaceholderText(/search by name or email/i);
  await user.type(searchInput, "zzzznonexistent");

  expect(screen.getByText("No users found")).toBeInTheDocument();
});

// 27. Delete resume from user detail view
test("delete resume from user detail view", async () => {
  api.delete.mockResolvedValue({});
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  // Click John to open detail
  await user.click(screen.getByText("John"));
  await waitFor(() => expect(screen.getByText("Resumes by this user")).toBeInTheDocument());

  // John has resume_id=1, which is Resume A
  const deleteButtons = screen.getAllByText("Delete");
  await user.click(deleteButtons[0]);

  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());
  await user.click(screen.getByText("Delete Forever"));

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith("/admin/resumes/1");
  });
});

// 28. Tab switch clears search and selectedUser
test("switching tabs clears search and selected user", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  // Select a user
  await user.click(screen.getByText("John"));
  await waitFor(() => expect(screen.getByText("← Back to Users")).toBeInTheDocument());

  // Switch to Dashboard tab
  await user.click(screen.getByText("Dashboard"));
  await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());

  // Switch back to Users - no detail view should be shown
  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText(/All Users/i)).toBeInTheDocument());
});

// 29. Resumes tab empty search shows "No resumes found"
test("resumes tab search with no matches shows empty state", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => expect(screen.getByText("Resume A")).toBeInTheDocument());

  const searchInput = screen.getByPlaceholderText(/search by title/i);
  await user.type(searchInput, "nonexistent");

  expect(screen.getByText("No resumes found")).toBeInTheDocument();
});

// 30. Overlay click closes confirm modal
test("clicking overlay closes confirm delete modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

  await user.click(screen.getAllByText("Delete")[0]);
  await waitFor(() => expect(screen.getByText("Delete Forever")).toBeInTheDocument());

  // Click overlay (the backdrop)
  await user.click(screen.getByText(/Confirm Delete/).closest("div").parentElement);

  await waitFor(() => {
    expect(screen.queryByText("Delete Forever")).not.toBeInTheDocument();
  });
});

test("change role from admin detail view can demote", async () => {
  api.put.mockResolvedValue({ data: { message: "Role changed" } });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => expect(screen.getByText("Admin")).toBeInTheDocument());
  await user.click(screen.getByText("Admin"));
  await waitFor(() => expect(screen.getByText("Demote to User")).toBeInTheDocument());
  await user.click(screen.getByText("Demote to User"));

  await waitFor(() => {
    expect(api.put).toHaveBeenCalledWith("/admin/users/2/role", { role: "user" });
  });
});

test("resumes tab shows em dash when template style is missing", async () => {
  const resumesWithoutStyle = [
    { id: 1, title: "Resume A", user_id: 1, user_name: "John", user_email: "john@test.com", template_name: "simple", template_style: "", created_at: "2024-01-01" },
  ];
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: mockStats });
    if (url === "/admin/users") return Promise.resolve({ data: mockUsers });
    if (url === "/admin/resumes") return Promise.resolve({ data: resumesWithoutStyle });
    return Promise.resolve({ data: {} });
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => {
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

test("users and resumes endpoints handle non-array data", async () => {
  api.get.mockImplementation((url) => {
    if (url === "/admin/stats") return Promise.resolve({ data: mockStats });
    if (url === "/admin/users") return Promise.resolve({ data: { invalid: true } });
    if (url === "/admin/resumes") return Promise.resolve({ data: { invalid: true } });
    return Promise.resolve({ data: {} });
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());

  await user.click(screen.getByText("Users"));
  await waitFor(() => {
    expect(screen.getByText(/All Users \(0\)/)).toBeInTheDocument();
  });

  await user.click(screen.getByText("Resumes"));
  await waitFor(() => {
    expect(screen.getByText(/All Resumes \(0\)/)).toBeInTheDocument();
  });
});
