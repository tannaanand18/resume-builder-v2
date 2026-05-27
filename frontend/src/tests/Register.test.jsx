import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

import Register from "../pages/Register";
import { registerUser } from "../services/authService";


// ---------------- MOCKS ----------------

// mock api
vi.mock("../services/authService", () => ({
  registerUser: vi.fn()
}));


function renderPage() {
  render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
}


// ---------------- TESTS ----------------

// render page
test("page renders", () => {

  renderPage();

  expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();

});


// typing test
test("user can type inputs", async () => {

  const user = userEvent.setup();

  renderPage();

  const name = screen.getByTestId("name-input");
  const email = screen.getByTestId("email-input");
  const password = screen.getByTestId("password-input");

  await user.type(name, "John Doe");
  await user.type(email, "test@test.com");
  await user.type(password, "123456");

  expect(name).toHaveValue("John Doe");
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


// successful registration
test("successful registration", async () => {

  const user = userEvent.setup();

  registerUser.mockResolvedValueOnce({});

  // mock window.alert so it doesn't throw
  const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

  renderPage();

  await user.type(screen.getByTestId("name-input"), "John Doe");
  await user.type(screen.getByTestId("email-input"), "test@test.com");
  await user.type(screen.getByTestId("password-input"), "123456");

  await user.click(screen.getByTestId("submit-button"));

  expect(registerUser).toHaveBeenCalled();
  expect(alertMock).toHaveBeenCalledWith("Registration successful!");

  alertMock.mockRestore();

});


// registration error
test("registration error shows alert", async () => {

  const user = userEvent.setup();

  registerUser.mockRejectedValueOnce(new Error("fail"));

  // mock window.alert and console.error
  const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
  const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});

  renderPage();

  await user.type(screen.getByTestId("name-input"), "John Doe");
  await user.type(screen.getByTestId("email-input"), "bad@test.com");
  await user.type(screen.getByTestId("password-input"), "bad");

  await user.click(screen.getByTestId("submit-button"));

  expect(alertMock).toHaveBeenCalledWith("Registration failed");
  expect(consoleMock).toHaveBeenCalled();

  alertMock.mockRestore();
  consoleMock.mockRestore();

});


// click sign in
test("click sign in", async () => {

  const user = userEvent.setup();

  renderPage();

  const signin = screen.getByTestId("signin-text");

  await user.click(signin);

  expect(signin).toBeInTheDocument();

});
