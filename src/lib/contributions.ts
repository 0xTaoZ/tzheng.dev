import snapshot from "../data/contributions.json";
export const mergedPRs = snapshot.merged;
export const verifiedAt = snapshot.verifiedAt;
export const mergedCount = mergedPRs.length;
export const repositoryCount = new Set(mergedPRs.map((pr) => pr.repository))
  .size;
export const contributionCases = [
  {
    repository: "pyinfra",
    number: 1945,
    url: "https://github.com/pyinfra-dev/pyinfra/pull/1945",
    area: "Infrastructure / SSH",
    title: "Restore certificate trust without relaxing verification.",
    problem:
      "OpenSSH certificate-authority entries were skipped while loading known_hosts. A server signed by a trusted CA then appeared to be an unknown host under strict checking.",
    change:
      "Keep CA entries separately and validate the certificate against the hostname, principal and validity window before accepting it.",
    evidence: "Merged September 2026 · connector regression tests",
    lesson:
      "Compatibility work at an authentication boundary must preserve the security contract.",
  },
  {
    repository: "cfn-lint",
    number: 4704,
    url: "https://github.com/aws-cloudformation/cfn-lint/pull/4704",
    area: "AWS / CloudFormation",
    title: "Catch a template error before it reaches deployment.",
    problem:
      "A bare Fn::Select used as a CreationPolicy or UpdatePolicy passed linting, but CloudFormation rejected it unless AWS::LanguageExtensions resolved it first.",
    change:
      "Validate the lifecycle-policy attributes at their owning layer while keeping Fn::Select behavior unchanged elsewhere.",
    evidence: "Merged September 2026 · policy and intrinsic-function tests",
    lesson:
      "A narrower check is often more correct than changing a shared resolver.",
  },
  {
    repository: "Prowler",
    number: 11837,
    url: "https://github.com/prowler-cloud/prowler/pull/11837",
    area: "Kubernetes / Security checks",
    title: "Make node-filesystem exposure visible in a Pod check.",
    problem:
      "Pods can mount node filesystem paths with hostPath volumes. A useful check needs volume evidence from the Kubernetes service model.",
    change:
      "Collect Pod volume metadata and add a check that reports a finding per Pod, with focused pass/fail fixtures.",
    evidence: "Merged July 2026 · service collection and check tests",
    lesson:
      "Separate collecting evidence from evaluating the security condition.",
  },
];
