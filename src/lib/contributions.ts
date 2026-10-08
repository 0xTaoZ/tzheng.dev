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
    title: "Support OpenSSH host certificates.",
    problem:
      "OpenSSH certificate-authority entries were skipped while loading known_hosts. A server signed by a trusted CA then appeared to be an unknown host under strict checking.",
    change:
      "Keep CA entries separately, then check the host pattern, certificate principal and validity period. Strict checking stays enabled.",
    evidence: "Merged September 2026 · connector regression tests",
    lesson:
      "Supporting the certificate format still requires checking whether that certificate is trusted.",
  },
  {
    repository: "cfn-lint",
    number: 4704,
    url: "https://github.com/aws-cloudformation/cfn-lint/pull/4704",
    area: "Amazon Web Services (AWS)",
    context: "cfn-lint / AWS CloudFormation",
    title: "Validate CloudFormation lifecycle policies.",
    problem:
      "A bare Fn::Select used as a CreationPolicy or UpdatePolicy passed linting, but CloudFormation rejected it unless AWS::LanguageExtensions resolved it first.",
    change:
      "Check CreationPolicy and UpdatePolicy at the policy layer. Keep the shared Fn::Select resolver unchanged.",
    evidence: "Merged September 2026 · policy and intrinsic-function tests",
    lesson:
      "The rule belongs to the policy attribute; other uses of the function need to keep working.",
  },
  {
    repository: "Prowler",
    number: 11837,
    url: "https://github.com/prowler-cloud/prowler/pull/11837",
    area: "Kubernetes / Security checks",
    title: "Report Pods using hostPath volumes.",
    problem:
      "Pods can mount node filesystem paths with hostPath volumes. A useful check needs volume evidence from the Kubernetes service model.",
    change:
      "Collect Pod volume data and report one finding per Pod. Tests cover the collected data and the check.",
    evidence: "Merged July 2026 · service collection and check tests",
    lesson:
      "The check can only evaluate volumes that the collector has kept in the Pod model.",
  },
];
