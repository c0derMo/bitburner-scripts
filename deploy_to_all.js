import { runUntilFinished, toastAndPrint } from "./utils";

/** @param {NS} ns */
export async function main(ns) {
    const SERVERS = [];
    const TARGET = ns.args[0];

    await runUntilFinished(ns, "get_root.js");

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

    // 3-port-server
    if (ns.fileExists("relaySMTP.exe")) {
        SERVERS.push("catalyst", "rothman-uni", "summit-uni", "netlink", "I.I.I.I");
    }

    // own-bought-servers
    SERVERS.push(...ns.getPurchasedServers());

    ns.print(SERVERS);

    for (const server of SERVERS) {
        await runUntilFinished(ns, "deploy.js", 1, server, TARGET);
    }

    toastAndPrint(ns, "Deployed script to " + SERVERS.length + " servers.");
}