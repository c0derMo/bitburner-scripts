import { NS } from "@ns";

export default function findConnectionPath(
  ns: NS,
  target: string,
  previousPath: string[] = [],
): string[] | null {
  previousPath.push(target);
  const servers = ns.scan(target).filter((e) => {
    return !previousPath.includes(e);
  });
  for (const server of servers) {
    if (server == "home") {
      previousPath.push("home");
      return previousPath;
    } else if (ns.getServer(server).backdoorInstalled) {
      previousPath.push(server);
      return previousPath;
    }
    const path = findConnectionPath(ns, server, previousPath);
    if (path != null) {
      return path;
    }
  }
  return null;
}
