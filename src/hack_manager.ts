import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    const servers = new Set([]);
    await recursiveScan(ns, "home", servers);
    ns.tprint([...servers]);
    await ns.sleep(5000);
}

/**
 * Attempts to nuke open all servers.
 * @param ns NetScript functions
 * @param servers Servers to attempt to hack
 */
async function nukeAll(ns: NS, servers: string[]): Promise<void> {
    for (const server of servers) {
        if (ns.hasRootAccess(server)) continue;
        if (await ns.fileExists("BruteSSH.exe")) {
            await ns.brutessh(server);
        }
        if (await ns.fileExists("FTPCrack.exe")) {
            await ns.ftpcrack(server);
        }
        if (await ns.fileExists("HTTPWorm.exe")) {
            await ns.httpworm(server);
        }
        if (await ns.fileExists("relaySMTP.exe")) {
            await ns.relaysmtp(server);
        }
        if (await ns.fileExists("SQLInject.exe")) {
            await ns.sqlinject(server);
        }
        await ns.nuke(server);
    }
}

/**
 * Scans all hosts recursively from the starting host. Mutates the input servers set.
 * @param ns NetScript functions
 * @param host Host to start scanning from
 * @param servers Already scanned servers
 */
async function recursiveScan(ns: NS, host: string, servers: Set<string>): Promise<void> {
    servers.add(host);
    const newServers = await ns.scan(host);
    for (const serverToScan of newServers) {
        if (servers.has(serverToScan)) continue;
        await recursiveScan(ns, serverToScan, servers);
    }
}