// One source for the résumé: the /resume/ page, the PDF and /resume.md all
// render from this file. Every contribution line links to its pull request.
import { mergedPRs, upstreamRepositories, compactNumber } from "../lib/contributions";

const month = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" });
const span = (...repositories: string[]) => {
  const dates = mergedPRs.filter((pr) => repositories.includes(pr.repository)).map((pr) => pr.mergedAt).sort();
  const [first, last] = [month(dates[0]), month(dates.at(-1)!)];
  return first === last ? first : `${first} – ${last}`;
};
const repo = (name: string) => upstreamRepositories.find((item) => item.name === name)!;
const pr = (repository: string, number: number) => ({ label: `#${number}`, url: `https://github.com/${repository}/pull/${number}` });

export const header = {
  name: "Haitao Zheng",
  title: "Cyber Security & Privacy student",
  contact: [
    { label: "Bonn, Germany" },
    { label: "h@tzheng.dev", url: "mailto:h@tzheng.dev" },
    { label: "tzheng.dev", url: "https://tzheng.dev/" },
    { label: "github.com/0xTaoZ", url: "https://github.com/0xTaoZ" },
    { label: "linkedin.com/in/haitaozheng", url: "https://www.linkedin.com/in/haitaozheng/" },
  ],
};

export const education = [
  {
    school: "Hochschule Bonn-Rhein-Sieg",
    detail: "B.Sc. Cyber Security & Privacy",
    when: "Oct 2025 – present",
    note: "Coursework: Java, Linux, networking, databases, Technische Informatik, GDPR",
  },
  {
    school: "FHM University of Applied Sciences, Bielefeld",
    detail: "University preparation, Feststellungsprüfung",
    when: "Dec 2024 – Jun 2025",
    note: "German C1 certified within the programme",
  },
  {
    school: "Harvard CS50x",
    detail: "Online course, computer science foundations",
    when: "2024",
  },
];

const entry = (name: string, title: string, about: string, points: { text: string; refs: number[] }[]) => ({
  title,
  url: `https://github.com/${name}`,
  about: `${about} · ${compactNumber(repo(name).stars)} stars`,
  when: span(name),
  count: repo(name).merged,
  points: points.map((point) => ({ text: point.text, refs: point.refs.map((number) => pr(name, number)) })),
});

export const openSource = [
  entry("pyinfra-dev/pyinfra", "pyinfra", "Python infrastructure automation", [
    { text: "Added OpenSSH host-certificate trust to the SSH connector without weakening strict host-key checking.", refs: [1945] },
    { text: "Fixed sudo with rsync, NFSv4 ACL handover, pinned dnf versions, OpenBSD rcctl services and CLI parsing.", refs: [1950, 1955, 1913, 1916, 1892] },
  ]),
  entry("aws-cloudformation/cfn-lint", "cfn-lint", "AWS CloudFormation linter", [
    { text: "Rejected Fn::Select lifecycle policies that CloudFormation refuses, validated at the policy layer.", refs: [4704] },
    { text: "Corrected validation of Fn::GetAZs in Fn::Join, negative Fn::Select indexes, FindInMap defaults and SAM outputs.", refs: [4677, 4622, 4628, 4665] },
  ]),
  entry("prowler-cloud/prowler", "Prowler", "Cloud security scanner", [
    { text: "Added a Kubernetes check for Pods mounting hostPath volumes.", refs: [11837] },
    { text: "Stopped 7 ECS checks from reporting PASS when the AWS describe call failed.", refs: [12217] },
  ]),
];

export const otherOpenSource = {
  when: span("aquasecurity/trivy", "DataDog/guarddog", "ansible/ansible-lint", "trailofbits/graphtage"),
  items: [
    { title: "Trivy", text: "Jenkins plugin license detection", ref: pr("aquasecurity/trivy", 10939) },
    { title: "GuardDog", text: "PyPI Inspector links for findings", ref: pr("DataDog/guarddog", 797) },
    { title: "ansible-lint", text: "register projection naming", ref: pr("ansible/ansible-lint", 5110) },
    { title: "Graphtage", text: "INI semantic diff", ref: pr("trailofbits/graphtage", 120) },
  ],
};

export const projects = [
  {
    title: "cloudtrail-quickscan",
    url: "https://github.com/0xTaoZ/cloudtrail-quickscan",
    stack: "Python",
    text: "CLI that flags root use, MFA removal, IAM boundary removal, logging changes and public ingress in CloudTrail logs; JSON output, unit-tested rules.",
  },
  {
    title: "StudyPulse",
    url: "https://github.com/0xTaoZ/studypulse-app",
    stack: "TypeScript, React, Cloudflare Workers, D1",
    text: "Study planner with a topic memory model and recall checks; model grades are bounded and rewards are computed on the server.",
  },
  {
    title: "jsonl-lens",
    url: "https://github.com/0xTaoZ/jsonl-lens",
    stack: "Python",
    text: "Profiles JSON Lines exports for missing versus null fields, type drift, nested paths and high-cardinality IDs.",
  },
];

export const skills = [
  { label: "Languages", text: "Python, Java, C, TypeScript, SQL" },
  { label: "Security", text: "AWS CloudTrail, IAM, CloudFormation, Kubernetes, OpenSSH, IOC triage" },
  { label: "Tools", text: "Linux, Git, GitHub Actions, pytest/unittest, Cloudflare Workers, React, Astro" },
  { label: "Spoken", text: "English C2, German C1, Mandarin (native), Hokkien, Japanese A2" },
];

// Plain Markdown version for job portals and ATS parsers.
export const toMarkdown = () => {
  const lines = [
    `# ${header.name}`,
    "",
    `${header.title}  `,
    header.contact.map((item) => item.label).join(" · "),
    "",
    "## Education",
    "",
    ...education.flatMap((item) => [`**${item.school}**, ${item.detail} (${item.when})${item.note ? `  \n${item.note}` : ""}`, ""]),
    "## Open source",
    "",
    ...openSource.flatMap((item) => [
      `**${item.title}** (${item.about}), ${item.count} merged PRs, ${item.when}`,
      ...item.points.map((point) => `- ${point.text} (${point.refs.map((ref) => ref.url).join(", ")})`),
      "",
    ]),
    `**Other merged work** (${otherOpenSource.when})`,
    ...otherOpenSource.items.map((item) => `- ${item.title}: ${item.text} (${item.ref.url})`),
    "",
    "## Projects",
    "",
    ...projects.flatMap((item) => [`**${item.title}** (${item.stack}): ${item.text} ${item.url}`, ""]),
    "## Skills",
    "",
    ...skills.map((item) => `- **${item.label}:** ${item.text}`),
    "",
  ];
  return lines.join("\n");
};
