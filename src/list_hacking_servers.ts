import { NS } from "@ns";

const weakenScript = "/dist/weaken.js";
const growScript = "/dist/grow.js";
const hackScript = "/dist/hack.js";
const attackScripts = [weakenScript, growScript, hackScript];

export async function main(ns: NS): Promise<void> {
  ns.ui.openTail();
  ns.disableLog("ALL");

  const servers = new Set<string>([]);
  await recursiveScan(ns, "home", servers);
  while (true) {
    ns.print(`Found servers: ${servers.size}`);
    const hackingServers = [];
    const nonHackingServers = [];
    const ignoredServers = [];

    for (const server of servers) {
      if (
        server === "home" ||
        server.startsWith("hacknet-server-") ||
        server.startsWith("pserv-") ||
        ns.getServerMaxMoney(server) <= 0
      ) {
        ignoredServers.push(server);
      } else if (isAttackOngoing(ns, server, [...servers])) {
        hackingServers.push(server);
      } else {
        nonHackingServers.push(server);
      }
    }

    ns.print(`Ignored servers: ${ignoredServers.length}`);
    ns.print(`Hacking servers: ${hackingServers.length}`);
    ns.print(`Not hacking servers: ${nonHackingServers.length}`);
    ns.print(nonHackingServers.join(", "));

    await ns.sleep(1000);
    ns.clearLog();
  }
}

async function recursiveScan(
  ns: NS,
  host: string,
  servers: Set<string>,
): Promise<void> {
  servers.add(host);
  const newServers = ns.scan(host);
  for (const serverToScan of newServers) {
    if (servers.has(serverToScan)) continue;
    await recursiveScan(ns, serverToScan, servers);
  }
}

function isAttackOngoing(
  ns: NS,
  targetServer: string,
  hackingServers: string[],
) {
  for (const server of hackingServers) {
    const processes = ns.ps(server);
    for (const process of processes) {
      if (
        attackScripts.includes("/" + process.filename) &&
        process.args.includes(targetServer)
      ) {
        return true;
      }
    }
  }
  return false;
}
