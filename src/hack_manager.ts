import { NS } from "@ns";

// Attack scripts
const weakenScript = "/dist/weaken.js";
const growScript = "/dist/grow.js";
const hackScript = "/dist/hack.js";
const attackScripts = [weakenScript, growScript, hackScript];

// Ram reqirement for slave scripts (hack, grow, weaken)
const slaveScriptRam = 1.75;

// Delay each loop
const loopDelay = 5000;

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL");
    const servers = new Set([]);
    await recursiveScan(ns, "home", servers);
    
    while (true) {
        // We delay at the start, so we can just continue at any point in the loop
        await ns.sleep(loopDelay);

        await nukeAll(ns, servers);
        const mappedServers = sortServers(ns, servers);

        if (mappedServers.totalFreeRam < slaveScriptRam) {
            continue;
        }
        for (const target of mappedServers.hackableServers) {
            if (isAttackOngoing(target)) {
                continue;
            }

            // TODO: Figure out threads, launch attack
        }
    }
}

/**
 * Checks whether a target server is currently under attack by our servers.
 * @param ns NetScript functions
 * @param targetServer Target server
 * @param hackingServers Servers launching the attack
 * @returns true, if the target server is currently under attack, false otherwise
 */
function isAttackOngoing(ns: NS, targetServer: string, hackingServers: string[]) {
    for (const server of hackingServers) {
        const processes = ns.ps(server);
        for (const process of processes) {
            if (attackScripts.includes(process.filename) && process.args.includes(targetServer)) {
                return true;
            }
        }
    }
    return false;
}

interface ServersMap {
    hackableServers: string[];
    usableServers: string[];
    totalFreeRam: number;
}

/**
 * Sorts and filters servers, to figure out which we can use, which we can attack
 * @param ns NetScript functions
 * @param servers Servers to sort
 * @returns Sorted & filtered servers
 */
function sortServers(ns: NS, servers: Set<string>): ServersMap {
    const result = { hackableServers: [], usableServers: [], totalFreeRam: 0 } as ServersMap;
    for (const server of servers) {
        if (ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()
            && ns.getServerMaxMoney(server) > 0) {
            result.hackableServers.push(server);
        }

        if (ns.hasRootAccess(server) && server !== "home") {
            result.usableServers.push(server);
            const totalRam = ns.getServerMaxRam(server);
            const usedRam = ns.getServerUsedRam(server);
            const freeRam = totalRam - usedRam;
            result.totalFreeRam += freeRam;
        }
    }

    // Stolen weight from xtree
    result.hackableServers.sort((a: string, b: string) => {
        const serverA = ns.getServer(a);
        const serverB = ns.getServer(b);
        const weightA = serverA.moneyMax / serverA.minDifficulty;
        const weightB = serverB.moneyMax / serverB.minDifficulty;
        return weightB - weightA;
    });

    return result;
}

/**
 * Attempts to nuke open all servers.
 * @param ns NetScript functions
 * @param servers Servers to attempt to hack
 */
async function nukeAll(ns: NS, servers: Set<string>): Promise<void> {
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
        const serverInfo = ns.getServer(server);
        if (serverInfo.openPortCount >= serverInfo.numOpenPortsRequired) {
            await ns.nuke(server);
        }
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