export function summarizeCspReport(input: unknown) {
  const events = Array.isArray(input) ? input.slice(0, 5) : [input];
  return events.flatMap(event => {
    if (!event || typeof event !== "object") return [];
    const record = event as Record<string, unknown>;
    const body = record["csp-report"] ?? (record.type === "csp-violation" ? record.body : null);
    if (!body || typeof body !== "object") return [];
    const fields = body as Record<string, unknown>;
    const directive = fields["effective-directive"] ?? fields.effectiveDirective;
    if (typeof directive !== "string" || !/^[a-z-]{1,50}$/.test(directive)) return [];
    const blocked = fields["blocked-uri"] ?? fields.blockedURL;
    const disposition = fields.disposition === "report" ? "report" : "enforce";
    // URLs, query strings, script samples and user identity never enter logs.
    const kind = blocked === "inline" || blocked === "eval" ? blocked : typeof blocked === "string" && /^https?:/.test(blocked) ? "external" : "other";
    return [{ directive, disposition, kind }];
  });
}
