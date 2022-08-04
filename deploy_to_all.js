import { NS } from "./NS";

/** @param {NS} ns */
export async function main(ns) {
    const SERVERS = [];
    const TARGET = ns.args[0];

    // 0-port-server
    SERVERS.push("n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "nectar-net", "hong-fang-tea", "harakiri-sushi");

    // 1-port-server
    if (ns.fileExists("BruteSSH.exe")) {
        SERVERS.push("neo-net", "zer0", "max-hardware", "iron-gym", "CSEC");
    }

    // 2-port-server
    if (ns.fileExists("FTPCrack.exe")) {
        SERVERS.push("silver-helix", "phantasy", "omega-net", "the-hub", "avmnite-02h");
    }

    // own-bought-servers
    SERVERS.push(...ns.getPurchasedServers());

    ns.print(SERVERS);

    for(const server of SERVERS) {
        ns.run("deploy.js", 1, server, TARGET);
        await ns.sleep(1000);
    }

    ns.alert("Deployed script to " + SERVERS.length + " servers.");
}