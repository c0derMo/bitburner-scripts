/** @param {NS} ns */
export async function main(ns) {
    const DEPTH = ns.args[0];
    const HACKING_TOOLS = ns.args[1];

    // Grabbing all servers
    let i = 1;
    const servers = [];
    servers.push(["home"]);
    while (i <= DEPTH) {
        const layer = [];
        servers[i - 1].forEach(server => {
            layer.push(...ns.scan(server));
        });
        servers.push(layer);
        i++;
    }
    
    const allServers = new Set(servers.reduce((prev, cur) => { return prev.concat(cur) }));
    allServers.delete("home");
    ns.tprint(`Found ${allServers.size} servers in ${DEPTH} layers.`);


    let currentBestServer = "";
    let currentMaxMoney = 0;
    let currentTimeToHack = Number.MAX_SAFE_INTEGER;
    // Figuring out the server with the most money, that is hackable by us
    for(const server of allServers) {
        if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel() || ns.getServerNumPortsRequired(server) > HACKING_TOOLS) {
            continue;
        }
        if (ns.getServerMaxMoney(server) > currentMaxMoney) {
            currentBestServer = server;
            currentMaxMoney = ns.getServerMaxMoney(server);
            currentTimeToHack = ns.getHackTime(server); //TODO: this needs to factor in the security level!
        } else if (ns.getServerMaxMoney(server) == currentMaxMoney && ns.getHackTime(server) < currentTimeToHack) {
            currentBestServer = server;
            currentMaxMoney = ns.getServerMaxMoney(server);
            currentTimeToHack = ns.getHackTime(server); //TODO: this needs to factor in the security level!
        }
    }

    ns.tprint(`Best server: ${currentBestServer}`);
    ns.tprint(`Max money: ${currentMaxMoney}`);
    ns.tprint(`Time to hack: ${currentTimeToHack}`);
}