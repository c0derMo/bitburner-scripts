/**
 * Resursively scans from the starting server, and returns all servers that match the arguments.
 *
 * @export
 * @param {NS} ns NS object
 * @param {string} startServer Server to start the scan on
 * @param {number} [maximumPortRequirement=-1] Maximum open port requirement to hack
 * @param {boolean} [includeServersWithoutRam=true] Include servers that don't have RAM.
 * @param {boolean} [includePlayerOwnedServers=true] Always include player owned servers, ignoring restrictions
 */
export function recursiveScan(ns: NS, startServer: string, maximumPortRequirement = -1, includeServersWithoutRam = true, includePlayerOwnedServers = true): string[] {
    const servers = _recursiveScan(ns, startServer);
    return servers.filter((e) => {
        return ((maximumPortRequirement < 0 || ns.getServerNumPortsRequired(e) <= maximumPortRequirement) &&
            (includeServersWithoutRam || ns.getServerMaxRam(e) > 0)) ||
            (includePlayerOwnedServers && ns.getServer(e).purchasedByPlayer);
    });
}

function _recursiveScan(ns: NS, server: string, previousServer=""): string[] {
    const result = [server];
    const servers = ns.scan(server).filter((e) => { return e !== previousServer });
    for (const newServer of servers) {
        result.push(..._recursiveScan(ns, newServer, server));
    }
    return result;
}

function printScannedServers(ns: NS, currentServer: string, prefix="", previousServer=""): void {
    const servers = ns.scan(currentServer).filter((e) => { return e !== previousServer });
    for(const server of servers) {
        ns.tprint(`${prefix}--${server}`);
        printScannedServers(ns, server, prefix + "--", currentServer);
    }
}

export async function main(ns : NS) : Promise<void> {
    printScannedServers(ns, "home");
}