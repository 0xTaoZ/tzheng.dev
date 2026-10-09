import snapshot from "../data/contributions.json";
export const mergedPRs = snapshot.merged;
export const verifiedAt = snapshot.verifiedAt;
export const mergedCount = mergedPRs.length;
export const repositoryCount = new Set(mergedPRs.map((pr) => pr.repository))
  .size;
export const openPRs = snapshot.open;
export const calendar: { date: string; count: number }[] = snapshot.calendar;
export const openCount = openPRs.length;
const stars: Record<string, { stars: number }> = snapshot.repositories;
const displayNames: Record<string, string> = {
  "aquasecurity/trivy": "Trivy",
  "prowler-cloud/prowler": "Prowler",
  "DataDog/guarddog": "GuardDog",
  "trailofbits/graphtage": "Graphtage",
};

// Upstream repositories ordered by merged pull requests, then by stars.
export const upstreamRepositories = Object.entries(
  Object.groupBy(mergedPRs, (pr) => pr.repository),
)
  .map(([name, prs = []]) => ({
    name,
    owner: name.split("/")[0],
    repo: name.split("/")[1],
    label: displayNames[name] ?? name.split("/")[1],
    url: `https://github.com/${name}`,
    merged: prs.length,
    stars: stars[name]?.stars ?? 0,
    latest: prs.map((pr) => pr.mergedAt).sort().at(-1)!,
  }))
  .sort((a, b) => b.merged - a.merged || b.stars - a.stars);
export const combinedStars = upstreamRepositories.reduce(
  (sum, repository) => sum + repository.stars,
  0,
);
export const compactNumber = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(value)
    .replace("K", "k");

// Merged pull requests per calendar month, from the first merge to the
// snapshot date, including months without a merge.
export const monthlyMerged = (() => {
  const counts = Object.groupBy(mergedPRs, (pr) => pr.mergedAt.slice(0, 7));
  const months: {
    month: string;
    label: string;
    count: number;
    partial: boolean;
  }[] = [];
  const first = mergedPRs.map((pr) => pr.mergedAt).sort()[0].slice(0, 7);
  const cursor = new Date(`${first}-01T00:00:00Z`);
  const end = verifiedAt.slice(0, 7);
  while (cursor.toISOString().slice(0, 7) <= end) {
    const month = cursor.toISOString().slice(0, 7);
    months.push({
      month,
      label: cursor.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      count: counts[month]?.length ?? 0,
      partial: month === end,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
})();
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

// Excerpts from the merged diffs, shown beside each case on the homepage.
// Lines are copied from the pull request; "…" marks omitted lines.
export const caseExcerpts: Record<string, { file: string; lang: string; code: string }> = {
  pyinfra: {
    file: "src/pyinfra/connectors/sshuserclient/client.py",
    lang: "python",
    code: `def _host_certificate_is_trusted(client, hostname: str, key: PKey) -> bool:
    …
    cert_type = message.get_int()
    if cert_type != 2:  # SSH2_CERT_TYPE_HOST
        return False

    message.get_text()  # key id
    principals = Message(message.get_string())
    valid_after = message.get_int64()
    valid_before = message.get_int64()
    …
    now = int(time())
    if now < valid_after or now > valid_before:
        return False

    if not any(principal == hostname for principal in _iter_certificate_principals(principals)):
        return False`,
  },
  "cfn-lint": {
    file: "src/cfnlint/rules/resources/CreationPolicy.py",
    lang: "python",
    code: `function, _ = is_function(instance)
if (
    function == "Fn::Select"
    and not validator.context.transforms.has_language_extensions_transform()
):
    yield ValidationError(
        f"{instance!r} is not of type 'object'",
        rule=self,
        validator="type",
    )
    return`,
  },
  Prowler: {
    file: "prowler/providers/kubernetes/services/core/core_service.py",
    lang: "python",
    code: `@staticmethod
def _build_volumes(volumes) -> List[dict]:
    pod_volumes = []
    for volume in volumes or []:
        pod_volumes.append(
            {
                "name": volume.name,
                "host_path": (
                    volume.host_path.to_dict() if volume.host_path else None
                ),
            }
        )
    return pod_volumes`,
  },
};
