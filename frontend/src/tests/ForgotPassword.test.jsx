import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

import ForgotPassword from "../pages/ForgotPassword";
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


function renderPage() {
  render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );
}


// ---------------- TESTS ----------------

// render page
test("page renders", () => {

  renderPage();

  expect(screen.getByText(/forgot password/i)).toBeInTheDocument();

});


// typing test
test("user can type email", async () => {

  const user = userEvent.setup();

  renderPage();

  const email = screen.getByTestId("email-input");

  await user.type(email, "test@test.com");

  expect(email).toHaveValue("test@test.com");

});


// successful reset link sent
test("successful reset link", async () => {

  const user = userEvent.setup();

  api.post.mockResolvedValueOnce({
    data: { message: "Reset link sent" }
  });

  renderPage();

  await user.type(screen.getByTestId("email-input"), "test@test.com");

  await user.click(screen.getByTestId("submit-button"));

  expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "test@test.com" });
  expect(toast.success).toHaveBeenCalledWith("Reset link sent to your email");

});


// error with backend message
test("error shows backend message", async () => {

  const user = userEvent.setup();

  api.post.mockRejectedValueOnce({
    response: { data: { error: "Email not found" } }
  });

  renderPage();

  await user.type(screen.getByTestId("email-input"), "bad@test.com");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalledWith("Email not found");

});


// error without backend message (fallback)
test("error shows fallback message", async () => {

  const user = userEvent.setup();

  api.post.mockRejectedValueOnce({});

  renderPage();

  await user.type(screen.getByTestId("email-input"), "bad@test.com");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalledWith("Server error");

});


// click login link
test("click login link", async () => {

  const user = userEvent.setup();

  renderPage();

  const loginLink = screen.getByTestId("login-link");

  await user.click(loginLink);

  expect(loginLink).toBeInTheDocument();

});
