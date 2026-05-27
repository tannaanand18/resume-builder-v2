import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, beforeEach, describe } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ResumeBuilder from "../pages/ResumeBuilder";

// â”€â”€â”€ MOCKS â”€â”€â”€

vi.mock("html2pdf.js", () => ({ default: vi.fn() }));
vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      width: 800,
      height: 1130,
      toDataURL: () => "data:image/jpeg;base64,fake",
    })
  ),
}));
vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// â”€â”€â”€ RICH MOCK DATA â”€â”€â”€
// Items include both with-optional-fields and without-optional-fields variants
// to cover both truthy and falsy branches in item components

const FULL_RESUME = {
  id: 1, title: "Test Resume", full_name: "John Doe", professional_title: "Developer",
  email: "john@test.com", phone: "123-456", location: "NYC", linkedin: "linkedin.com/john",
  website: "johndoe.com", nationality: "American", date_of_birth: "01/01/1990",
  summary: "A skilled developer.", template_name: "simple", template_style: "classic",
};

const FULL_EXPERIENCES = [
  { id: 1, role: "Dev", company: "Google", start_date: "2020", end_date: "2023", description: "Built things", location: "NYC" },
  { id: 2, role: "Intern", company: "Meta", start_date: "2019", end_date: "", description: "" },
];

const FULL_EDUCATIONS = [
  { id: 1, degree: "BS CS", institution: "MIT", start_year: "2016", end_year: "2020", score: "3.9", location: "Cambridge" },
  { id: 2, degree: "MS CS", institution: "Stanford", start_year: "2020", end_year: "", score: "" },
];

const FULL_SKILLS = [
  { id: 1, name: "React", level: "Expert" },
  { id: 3, name: "TypeScript", level: "Advanced" },
  { id: 4, name: "CSS", level: "Intermediate" },
  { id: 2, name: "Node", level: "" },
];

const FULL_PROJECTS = [
  { id: 1, title: "Project X", description: "Cool project", tech_stack: "React", link: "https://example.com" },
  { id: 2, title: "Project Y", description: "", tech_stack: "", link: "" },
];

const FULL_CERTS = [
  { id: 1, name: "AWS", issuer: "Amazon", issue_date: "2023", expiry_date: "2026" },
  { id: 2, name: "Azure", issuer: "", issue_date: "", expiry_date: "" },
];

// â”€â”€â”€ FETCH MOCK HELPERS â”€â”€â”€

function createFetchMock(templateStyle, withData = true, { nullName = false } = {}) {
  return vi.fn((url, opts) => {
    // Resume endpoint
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && (!opts || opts.method !== "PUT")) {
      const resumeData = { ...FULL_RESUME, template_style: templateStyle };
      if (nullName) resumeData.full_name = "";
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ resume: resumeData }),
      });
    }
    // PUT save resume
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && opts?.method === "PUT") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    // Sub-data endpoints
    if (typeof url === "string" && url.includes("/api/experience/") && (!opts || !opts.method || opts.method === "GET")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(withData ? FULL_EXPERIENCES : []) });
    }
    if (typeof url === "string" && url.includes("/api/education/") && (!opts || !opts.method || opts.method === "GET")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(withData ? FULL_EDUCATIONS : []) });
    }
    if (typeof url === "string" && url.includes("/api/skills/") && (!opts || !opts.method || opts.method === "GET")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(withData ? FULL_SKILLS : []) });
    }
    if (typeof url === "string" && url.includes("/api/projects/") && (!opts || !opts.method || opts.method === "GET")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(withData ? FULL_PROJECTS : []) });
    }
    if (typeof url === "string" && url.includes("/api/certifications/") && (!opts || !opts.method || opts.method === "GET")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(withData ? FULL_CERTS : []) });
    }
    // POST add item
    if (opts?.method === "POST") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 99 }) });
    }
    // DELETE
    if (opts?.method === "DELETE") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    // PUT update item
    if (opts?.method === "PUT") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    // Default
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = createFetchMock("classic");
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/resume/1/edit"]}>
      <Routes>
        <Route path="/resume/:id/edit" element={<ResumeBuilder />} />
      </Routes>
    </MemoryRouter>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ BASIC TESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("renders resume title with fetched data", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Resume Title")).toHaveValue("Test Resume");
  });
});

test("fetchAll supports direct resume payload and null section payloads", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && (!opts || opts.method !== "PUT")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          title: "Test Resume",
          full_name: "John Doe",
          professional_title: "Developer",
          email: "john@test.com",
          phone: "123-456",
          template_name: "unknown_template",
          template_style: "",
        }),
      });
    }
    if (typeof url === "string" && url.includes("/api/experience/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    if (typeof url === "string" && url.includes("/api/education/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    if (typeof url === "string" && url.includes("/api/skills/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    if (typeof url === "string" && url.includes("/api/projects/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    if (typeof url === "string" && url.includes("/api/certifications/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });

  renderPage();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Resume Title")).toHaveValue("Test Resume");
  });
});

test("shows all section tabs", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getAllByText("Education")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Skills")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Projects")[0]).toBeInTheDocument();
    expect(screen.getByText("Certifications")).toBeInTheDocument();
  });
});

test("Dashboard button navigates to /dashboard", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
  await user.click(screen.getByText("Dashboard"));
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
});

test("Download PDF button is rendered", async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText("Download PDF")).toBeInTheDocument());
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE RENDERING: ALL 20 STYLES WITH FULL DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const UNIQUE_STYLES = [
  "corporate", "classic", "modern", "harvard", "atlantic",
  "simplyblue", "annafield", "meghana", "obsidian", "mercury",
  "finance", "quiet_blue", "hunter_green", "silver", "slate_dawn",
  "creative", "black_pattern", "green_accent", "rosewood", "blue_accent",
];

describe("template rendering with full data", () => {
  test.each(UNIQUE_STYLES)("renders %s template", async (style) => {
    global.fetch = createFetchMock(style, true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE RENDERING: ALL 20 STYLES WITH EMPTY DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("template rendering with empty data", () => {
  test.each(UNIQUE_STYLES)("renders %s template with empty sections", async (style) => {
    global.fetch = createFetchMock(style, false);
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Resume Title")).toHaveValue("Test Resume");
    });
  });
});


// ────────── TEMPLATE RENDERING: NULL NAME FALLBACK ──────────

describe("template rendering with null name", () => {
  test.each(UNIQUE_STYLES)("renders %s template with empty full_name", async (style) => {
    global.fetch = createFetchMock(style, true, { nullName: true });
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Resume Title")).toHaveValue("Test Resume");
    });
  });
});
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE ALIAS STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("template alias styles", () => {
  test.each(["minimal", "sidebar", "banking", "simplyblue_modern", "atlantic_blue"])
    ("renders %s alias template", async (style) => {
    global.fetch = createFetchMock(style, true);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE FALLBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("unknown template style falls back to TemplateCorporate", async () => {
  global.fetch = createFetchMock("unknown_style_xyz", true);
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EMPTY STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("empty resume shows EmptyState message", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && (!opts || opts.method !== "PUT")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          resume: { id: 1, title: "", full_name: "", professional_title: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "", template_name: "simple", template_style: "corporate" },
        }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Start filling in your details/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FETCH ALL TEMPLATE FALLBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("no template_style uses fallback from template_name", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && (!opts || opts.method !== "PUT")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          resume: { ...FULL_RESUME, template_style: null, template_name: "modern" },
        }),
      });
    }
    if (typeof url === "string" && url.includes("/api/experience/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(FULL_EXPERIENCES) });
    if (typeof url === "string" && url.includes("/api/education/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(FULL_EDUCATIONS) });
    if (typeof url === "string" && url.includes("/api/skills/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(FULL_SKILLS) });
    if (typeof url === "string" && url.includes("/api/projects/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(FULL_PROJECTS) });
    if (typeof url === "string" && url.includes("/api/certifications/")) return Promise.resolve({ ok: true, json: () => Promise.resolve(FULL_CERTS) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FETCH ALL ERROR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("fetchAll error shows toast", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Failed to load resume data/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SAVE RESUME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("Save button calls API to save resume", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());
  await user.click(screen.getByText("Save"));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

test("Save failure shows error toast", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "PUT") {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());
  await user.click(screen.getByText("Save"));
  await waitFor(() => {
    expect(screen.getByText(/Failed to save/)).toBeInTheDocument();
  });
});

test("Save network error shows error toast", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "PUT") {
      return Promise.reject(new Error("Network error"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());
  await user.click(screen.getByText("Save"));
  await waitFor(() => {
    expect(screen.getByText(/Failed to save/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TAB SWITCHING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("can switch to Experience tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => {
    expect(screen.getByText("Work Experience")).toBeInTheDocument();
  });
});

test("can switch to Education tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Education")[0]);
  await waitFor(() => {
    expect(screen.getByPlaceholderText("e.g. B.Tech")).toBeInTheDocument();
  });
});

test("can switch to Skills tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => {
    expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument();
  });
});

test("can switch to Projects tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => {
    expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument();
  });
});

test("can switch to Certifications tab", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Certifications"));
  await waitFor(() => {
    expect(screen.getByPlaceholderText("AWS Solutions Architect")).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PERSONAL TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("personal tab shows additional details toggle", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());
  await user.click(screen.getByText("+ LinkedIn"));
  expect(screen.getByPlaceholderText("linkedin.com/in/yourname")).toBeInTheDocument();
});

test("personal tab save button saves resume", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());
  await user.click(screen.getByText(/Save Personal Info/));
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/resume/1", expect.objectContaining({ method: "PUT" }));
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD EXPERIENCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add experience item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. Google"), "TestCorp");
  await user.type(screen.getByPlaceholderText("e.g. Software Engineer"), "Tester");
  await user.type(screen.getByPlaceholderText("Jan 2022"), "2022");
  await user.type(screen.getByPlaceholderText("Present"), "2024");
  await user.click(screen.getByText("+ Add Experience"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/experience/",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD EXPERIENCE FAILURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add experience failure shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "POST" && url.includes("/api/experience/")) {
      return Promise.reject(new Error("fail"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. Google"), "X");
  await user.click(screen.getByText("+ Add Experience"));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to add");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD EXPERIENCE BACKEND ERROR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add experience backend error shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "POST" && url.includes("/api/experience/")) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Validation failed" }) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.type(screen.getByPlaceholderText("e.g. Google"), "X");
  await user.click(screen.getByText("+ Add Experience"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Validation failed");
  });
});

test("add experience backend error fallback shows default alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "POST" && url.includes("/api/experience/")) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.type(screen.getByPlaceholderText("e.g. Google"), "X");
  await user.click(screen.getByText("+ Add Experience"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to add");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE EXPERIENCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete experience item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("🗑️");
  await user.click(deleteButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/experience/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE EXPERIENCE FAILURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete experience failure shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "DELETE") return Promise.reject(new Error("fail"));
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  const deleteButtons = screen.getAllByText("🗑️");
  await user.click(deleteButtons[0]);
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to delete");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT EXPERIENCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit experience via modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  const editButtons = screen.getAllByText("✏️ Edit");
  await user.click(editButtons[0]);

  await waitFor(() => {
    expect(screen.getByText("Edit Experience")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Save Changes"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/experience/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT MODAL CANCEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit modal cancel closes modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());
  await user.click(screen.getByText("Cancel"));
  await waitFor(() => {
    expect(screen.queryByText("Edit Experience")).not.toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT MODAL CLOSE BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit modal close button closes modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());

  // Click the ✕ close button
  const closeButtons = screen.getAllByText("✕");
  await user.click(closeButtons[closeButtons.length - 1]);

  await waitFor(() => {
    expect(screen.queryByText("Edit Experience")).not.toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ UPDATE ITEM FAILURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("update item failure shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "PUT" && url.includes("/api/experience/1")) {
      return Promise.reject(new Error("fail"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to update");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ UPDATE ITEM BACKEND ERROR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("update item backend error shows alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "PUT" && url.includes("/api/experience/")) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Bad data" }) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Bad data");
  });
});

test("update item backend error fallback shows default alert", async () => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "PUT" && url.includes("/api/experience/")) {
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Failed to update");
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD EDUCATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add education item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Education")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. B.Tech")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. B.Tech"), "B.Tech");
  await user.type(screen.getByPlaceholderText("e.g. IIT Bombay"), "IIT");
  await user.click(screen.getByText("+ Add Education"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/education/",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE EDUCATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete education item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Education")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. B.Tech")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("🗑️");
  await user.click(deleteButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/education/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT EDUCATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit education via modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Education")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. B.Tech")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Education")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/education/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD SKILLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add skill item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. React"), "TypeScript");
  await user.click(screen.getByText("+ Add"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/skills/",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE SKILL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete skill item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  // Skills have ✕ delete button
  const delButtons = screen.getAllByText("✕");
  await user.click(delButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/skills/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT SKILL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit skill via modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️")[0]);
  await waitFor(() => expect(screen.getByText("Edit Skills")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/skills/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD PROJECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add project item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. AI Resume Builder"), "My Project");
  await user.click(screen.getByText("+ Add Project"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/projects/",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE PROJECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete project item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("🗑️");
  await user.click(deleteButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/projects/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT PROJECT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit project via modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Projects")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/projects/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ADD CERTIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("add certification item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Certifications"));
  await waitFor(() => expect(screen.getByPlaceholderText("AWS Solutions Architect")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("AWS Solutions Architect"), "GCP Prof");
  await user.type(screen.getByPlaceholderText("Amazon"), "Google");
  await user.click(screen.getByText("+ Add Certification"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/certifications/",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DELETE CERTIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("delete certification item", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Certifications"));
  await waitFor(() => expect(screen.getByPlaceholderText("AWS Solutions Architect")).toBeInTheDocument());

  const deleteButtons = screen.getAllByText("🗑️");
  await user.click(deleteButtons[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/certifications/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT CERTIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit certification via modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Certifications"));
  await waitFor(() => expect(screen.getByPlaceholderText("AWS Solutions Architect")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Certification")).toBeInTheDocument());
  await user.click(screen.getByText("Save Changes"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/certifications/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ AI SUMMARY GENERATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("AI summary generation succeeds", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-summary/")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ai_generated_summary: "AI generated summary." }) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Summary generated/)).toBeInTheDocument();
  });
});

test("AI summary generation fails", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-summary/")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

test("AI summary generation network error", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-summary/")) {
      return Promise.reject(new Error("Network"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

test("AI summary validation - no name shows toast", async () => {
  // Render with empty name & title
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.match(/\/api\/resume\/\d+$/) && (!opts || opts.method !== "PUT")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          resume: { ...FULL_RESUME, full_name: "", professional_title: "" },
        }),
      });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Please fill in Full Name/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ AI EXPERIENCE DESCRIPTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("AI experience description succeeds", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-experience")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ description: "AI exp desc" }) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  // Fill required fields
  await user.type(screen.getByPlaceholderText("e.g. Google"), "TestCorp");
  await user.type(screen.getByPlaceholderText("e.g. Software Engineer"), "Dev");

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Description generated/)).toBeInTheDocument();
  });
});

test("AI experience description validation - no role shows toast", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Please fill in Company and Role/)).toBeInTheDocument();
  });
});

test("AI experience description failure", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-experience")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. Google"), "X");
  await user.type(screen.getByPlaceholderText("e.g. Software Engineer"), "Y");
  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

test("AI experience description network error", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-experience")) {
      return Promise.reject(new Error("fail"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. Google"), "X");
  await user.type(screen.getByPlaceholderText("e.g. Software Engineer"), "Y");
  await user.click(screen.getAllByText("✨ Generate with AI")[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ AI PROJECT DESCRIPTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("AI project description succeeds", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-project")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ description: "AI proj desc" }) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. AI Resume Builder"), "My Proj");

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Description generated/)).toBeInTheDocument();
  });
});

test("AI project description validation - no title shows toast", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  const aiButtons = screen.getAllByText("✨ Generate with AI");
  await user.click(aiButtons[0]);

  await waitFor(() => {
    expect(screen.getByText(/Please fill in Project Title/)).toBeInTheDocument();
  });
});

test("AI project description failure", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-project")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. AI Resume Builder"), "X");
  await user.click(screen.getAllByText("✨ Generate with AI")[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

test("AI project description network error", async () => {
  global.fetch = vi.fn((url, opts) => {
    if (typeof url === "string" && url.includes("/api/ai/generate-project")) {
      return Promise.reject(new Error("fail"));
    }
    return createFetchMock("classic")(url, opts);
  });
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText("e.g. AI Resume Builder"), "X");
  await user.click(screen.getAllByText("✨ Generate with AI")[0]);

  await waitFor(() => {
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PDF DOWNLOAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("Download PDF button generates PDF", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Download PDF")).toBeInTheDocument());
  await user.click(screen.getByText("Download PDF"));
  await waitFor(() => {
    expect(screen.getByText(/PDF downloaded|Preparing PDF/)).toBeInTheDocument();
  });
});

test("PDF download failure shows error toast", async () => {
  const html2canvas = (await import("html2canvas")).default;
  html2canvas.mockRejectedValueOnce(new Error("Canvas error"));
  vi.spyOn(console, "error").mockImplementation(() => {});

  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Download PDF")).toBeInTheDocument());
  await user.click(screen.getByText("Download PDF"));
  await waitFor(() => {
    expect(screen.getByText(/PDF generation failed/)).toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE DROPDOWN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("template dropdown opens and selects a template", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());

  // Click the template selector button (has "Classic" text since default is classic)
  const templateBtn = screen.getByText(/Classic|Template/);
  await user.click(templateBtn);

  // Dropdown should show template groups
  await waitFor(() => {
    expect(screen.getAllByText("Modern")[0]).toBeInTheDocument();
  });

  // Select "Harvard" template
  await user.click(screen.getByText("Harvard"));
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TEMPLATE DROPDOWN BACKDROP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("template dropdown closes on backdrop click", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());

  const templateBtn = screen.getByText(/Classic|Template/);
  await user.click(templateBtn);

  await waitFor(() => {
    expect(screen.getAllByText("Modern")[0]).toBeInTheDocument();
  });

  // Click outside to close â€” the overlay div
  fireEvent.click(document.querySelector('[style*="position: fixed"]'));
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FETCHES ALL DATA ON MOUNT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("fetches all resume data on mount", async () => {
  renderPage();
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/resume/1", expect.objectContaining({ credentials: "include" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/experience/1", expect.objectContaining({ credentials: "include" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/education/1", expect.objectContaining({ credentials: "include" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/skills/1", expect.objectContaining({ credentials: "include" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/projects/1", expect.objectContaining({ credentials: "include" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/certifications/1", expect.objectContaining({ credentials: "include" }));
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FORM INPUT CHANGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("personal form inputs update state", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. Anna Field")).toBeInTheDocument());

  const nameInput = screen.getByPlaceholderText("e.g. Anna Field");
  await user.clear(nameInput);
  await user.type(nameInput, "Jane");
  expect(nameInput).toHaveValue("Jane");

  const locationInput = screen.getByPlaceholderText("City, Country");
  await user.clear(locationInput);
  await user.type(locationInput, "London");
  expect(locationInput).toHaveValue("London");
});

test("resume title input updates state", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByPlaceholderText("Resume Title")).toBeInTheDocument());

  const titleInput = screen.getByPlaceholderText("Resume Title");
  await user.clear(titleInput);
  await user.type(titleInput, "New Title");
  expect(titleInput).toHaveValue("New Title");
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT MODAL OVERLAY CLICK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit modal overlay click closes modal", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());

  // Click the overlay background
  const overlay = screen.getByText("Edit Experience").closest('[style*="position: fixed"]');
  fireEvent.click(overlay);

  await waitFor(() => {
    expect(screen.queryByText("Edit Experience")).not.toBeInTheDocument();
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EXPERIENCE FORM DESCRIPTION TEXTAREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("experience description textarea updates", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  const descArea = screen.getByPlaceholderText(/Describe responsibilities/);
  await user.type(descArea, "Did stuff");
  expect(descArea).toHaveValue("Did stuff");
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PROJECT FORM DESCRIPTION TEXTAREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("project description textarea updates", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  const descArea = screen.getByPlaceholderText(/Describe the project/);
  await user.type(descArea, "Built something");
  expect(descArea).toHaveValue("Built something");
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SUMMARY TEXTAREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("summary textarea updates", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());

  const summaryArea = screen.getByPlaceholderText(/Write a brief professional summary/);
  await user.clear(summaryArea);
  await user.type(summaryArea, "New summary");
  expect(summaryArea).toHaveValue("New summary");
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ EDIT MODAL FIELD CHANGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test("edit experience modal fields can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());

  // Change company field (the modal should have current values)
  const companyInputs = screen.getAllByDisplayValue("Google");
  await user.clear(companyInputs[0]);
  await user.type(companyInputs[0], "Apple");
  expect(companyInputs[0]).toHaveValue("Apple");

  // Change description textarea to cover edit modal description onChange
  const descTextarea = screen.getByDisplayValue("Built things");
  fireEvent.change(descTextarea, { target: { value: "New description" } });
  expect(descTextarea).toHaveValue("New description");
});

// ────────── EDIT EDUCATION MODAL FIELDS ──────────

test("edit education modal fields can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Education")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. B.Tech")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Education")).toBeInTheDocument());

  const degreeInputs = screen.getAllByDisplayValue("BS CS");
  await user.clear(degreeInputs[0]);
  await user.type(degreeInputs[0], "MS EE");
  expect(degreeInputs[0]).toHaveValue("MS EE");
});

// ────────── EDIT SKILL MODAL FIELDS ──────────

test("edit skill modal fields can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️")[0]);
  await waitFor(() => expect(screen.getByText("Edit Skills")).toBeInTheDocument());

  const nameInputs = screen.getAllByDisplayValue("React");
  await user.clear(nameInputs[0]);
  await user.type(nameInputs[0], "Vue");
  expect(nameInputs[0]).toHaveValue("Vue");

  // Change skill level in modal
  const selects = screen.getAllByDisplayValue("Expert");
  fireEvent.change(selects[0], { target: { value: "Beginner" } });
});

test("edit skill modal uses Intermediate fallback when level is empty", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️")[3]);
  await waitFor(() => expect(screen.getByText("Edit Skills")).toBeInTheDocument());

  const fallbackSelects = screen.getAllByDisplayValue("Intermediate");
  expect(fallbackSelects.length).toBeGreaterThan(0);
});

// ────────── EDIT PROJECT MODAL FIELDS ──────────

test("edit project modal fields can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Projects")).toBeInTheDocument());

  const titleInputs = screen.getAllByDisplayValue("Project X");
  await user.clear(titleInputs[0]);
  await user.type(titleInputs[0], "Project Z");
  expect(titleInputs[0]).toHaveValue("Project Z");

  // Change description textarea to cover edit modal description onChange
  const descTextarea = screen.getByDisplayValue("Cool project");
  fireEvent.change(descTextarea, { target: { value: "Updated desc" } });
  expect(descTextarea).toHaveValue("Updated desc");
});

test("edit experience and project modal fallback textareas handle empty values", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());

  await user.click(screen.getByText("Experience"));
  await waitFor(() => expect(screen.getByText("Work Experience")).toBeInTheDocument());
  await user.click(screen.getAllByText("✏️ Edit")[1]);
  await waitFor(() => expect(screen.getByText("Edit Experience")).toBeInTheDocument());
  const expTextareas = screen.getAllByRole("textbox");
  expect(expTextareas[expTextareas.length - 1]).toHaveValue("");
  await user.click(screen.getByText("Cancel"));

  await user.click(screen.getAllByText("Projects")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. AI Resume Builder")).toBeInTheDocument());
  await user.click(screen.getAllByText("✏️ Edit")[1]);
  await waitFor(() => expect(screen.getByText("Edit Projects")).toBeInTheDocument());
  const projTextareas = screen.getAllByRole("textbox");
  expect(projTextareas[projTextareas.length - 1]).toHaveValue("");
});

// ────────── EDIT CERTIFICATION MODAL FIELDS ──────────

test("edit certification modal fields can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getByText("Certifications"));
  await waitFor(() => expect(screen.getByPlaceholderText("AWS Solutions Architect")).toBeInTheDocument());

  await user.click(screen.getAllByText("✏️ Edit")[0]);
  await waitFor(() => expect(screen.getByText("Edit Certification")).toBeInTheDocument());

  const nameInputs = screen.getAllByDisplayValue("AWS");
  await user.clear(nameInputs[0]);
  await user.type(nameInputs[0], "GCP");
  expect(nameInputs[0]).toHaveValue("GCP");
});

// ────────── PERSONAL TAB EXTRA FIELDS CHANGE ──────────

test("personal extra field inputs can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal Details")).toBeInTheDocument());
  await user.click(screen.getByText("+ LinkedIn"));
  const linkedinInput = screen.getByPlaceholderText("linkedin.com/in/yourname");
  await user.clear(linkedinInput);
  await user.type(linkedinInput, "linkedin.com/in/test");
  expect(linkedinInput).toHaveValue("linkedin.com/in/test");
});

// ────────── SKILL FORM LEVEL SELECT ──────────

test("skill form level select can be changed", async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText("Personal")).toBeInTheDocument());
  await user.click(screen.getAllByText("Skills")[0]);
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. React")).toBeInTheDocument());

  // The skill form has a level select — change it
  const selects = screen.getAllByRole("combobox");
  fireEvent.change(selects[selects.length - 1], { target: { value: "Advanced" } });
});
