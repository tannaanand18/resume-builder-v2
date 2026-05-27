import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ResetPassword from "../pages/ResetPassword";
import api from "../services/api";
import toast from "react-hot-toast";


// ---------------- MOCKS ----------------

// mock api
vi.mock("../services/api", () => ({
  default: {
    post: vi.fn()
  }
}));

// mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});


function renderPage() {
  render(
    <MemoryRouter initialEntries={["/reset-password/abc123token"]}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );
}


// ---------------- TESTS ----------------

// render page
test("page renders", () => {

  renderPage();

  expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();

});


// typing test
test("user can type password", async () => {

  const user = userEvent.setup();

  renderPage();

  const password = screen.getByTestId("password-input");

  await user.type(password, "newpass123");

  expect(password).toHaveValue("newpass123");

});


// successful reset
test("successful password reset", async () => {

  const user = userEvent.setup();

  api.post.mockResolvedValueOnce({});

  renderPage();

  await user.type(screen.getByTestId("password-input"), "newpass123");

  await user.click(screen.getByTestId("submit-button"));

  expect(api.post).toHaveBeenCalledWith("/auth/reset-password/abc123token", { password: "newpass123" });
  expect(toast.success).toHaveBeenCalledWith("Password updated successfully!");
  expect(mockNavigate).toHaveBeenCalledWith("/login");

});


// error with backend message
test("error shows backend message", async () => {

  const user = userEvent.setup();

  api.post.mockRejectedValueOnce({
    response: { data: { error: "Token expired" } }
  });

  renderPage();

  await user.type(screen.getByTestId("password-input"), "newpass123");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalledWith("Token expired");

});


// error without backend message (fallback)
test("error shows fallback message", async () => {

  const user = userEvent.setup();

  api.post.mockRejectedValueOnce({});

  renderPage();

  await user.type(screen.getByTestId("password-input"), "newpass123");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalledWith("Something went wrong");

});
