// ── ResumePreviewPublic.jsx ──
// Simple template renderer for public/shared resume views.
// Uses the same templates as ResumeBuilder.jsx.

import ResumeBuilderDefault, {
  TEMPLATE_MAP,
  TemplateCorporate,
} from "../pages/ResumeBuilder";

export default function ResumePreviewPublic({
  resume,
  experiences,
  educations,
  skills,
  projects,
  certs,
  templateStyle,
}) {
  const activeKey = templateStyle || resume?.template_name || "corporate";
  const TemplateComponent = TEMPLATE_MAP[activeKey] || TemplateCorporate;

  return (
    <TemplateComponent
      resume={resume}
      experiences={experiences}
      educations={educations}
      skills={skills}
      projects={projects}
      certs={certs}
    />
  );
}