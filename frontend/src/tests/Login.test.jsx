import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

import Login from "../pages/Login";
import { loginUser } from "../services/authService";
import toast from "react-hot-toast";


// ---------------- MOCKS ----------------

// mock api
vi.mock("../services/authService", () => ({
  loginUser: vi.fn()
}));

// mock auth context
const mockLogin = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin
  })
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
      <Login />
    </BrowserRouter>
  );
}


// ---------------- TESTS ----------------

// render page
test("page renders", () => {

  renderPage();

  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();

});


// typing test
test("user can type inputs", async () => {

  const user = userEvent.setup();

  renderPage();

  const email = screen.getByTestId("email-input");
  const password = screen.getByTestId("password-input");

  await user.type(email, "test@test.com");
  await user.type(password, "123456");

  expect(email).toHaveValue("test@test.com");
  expect(password).toHaveValue("123456");

});


// toggle password
test("toggle password visibility", async () => {

  const user = userEvent.setup();

  renderPage();

  const password = screen.getByTestId("password-input");
  const toggle = screen.getByTestId("toggle-password");

  expect(password).toHaveAttribute("type", "password");

  await user.click(toggle);

  expect(password).toHaveAttribute("type", "text");

});


// successful login
test("successful login", async () => {

  const user = userEvent.setup();

  loginUser.mockResolvedValueOnce({
    token: "fake"
  });

  renderPage();

  await user.type(screen.getByTestId("email-input"), "test@test.com");
  await user.type(screen.getByTestId("password-input"), "123456");

  await user.click(screen.getByTestId("submit-button"));

  expect(loginUser).toHaveBeenCalled();
  expect(mockLogin).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalled();

});


// login error with backend message
test("login error shows toast", async () => {

  const user = userEvent.setup();

  loginUser.mockRejectedValueOnce({
    response: { data: { error: "Invalid credentials" } }
  });

  renderPage();

  await user.type(screen.getByTestId("email-input"), "bad@test.com");
  await user.type(screen.getByTestId("password-input"), "bad");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalled();

});


// login error without backend message (fallback branch)
test("login fallback error", async () => {

  const user = userEvent.setup();

  loginUser.mockRejectedValueOnce({});

  renderPage();

  await user.type(screen.getByTestId("email-input"), "bad@test.com");
  await user.type(screen.getByTestId("password-input"), "bad");

  await user.click(screen.getByTestId("submit-button"));

  expect(toast.error).toHaveBeenCalled();

});


// hover signup
test("hover signup text", async () => {

  const user = userEvent.setup();

  renderPage();

  const signup = screen.getByTestId("signup-text");

  await user.hover(signup);
  await user.unhover(signup);

  expect(signup).toBeInTheDocument();

});


// click signup
test("click signup", async () => {

  const user = userEvent.setup();

  renderPage();

  const signup = screen.getByTestId("signup-text");

  await user.click(signup);

  expect(signup).toBeInTheDocument();

});