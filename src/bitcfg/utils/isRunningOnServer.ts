import { NS } from "@ns";

export default function isScriptRunningOnServer(
  ns: NS,
  script: string,
  server?: string,
): boolean {
  const runningScripts = ns.ps(server);
  return runningScripts.find((process) => process.filename === script) != null;
}
