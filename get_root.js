/** @param {NS} ns */
export async function main(ns) {
    const SERVERS = [];

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


    for (const server of SERVERS) {
        if (ns.fileExists("relaySMTP.exe")) {
            ns.relaysmtp(server);
        }
        if (ns.fileExists("FTPCrack.exe")) {
            ns.ftpcrack(server);
        }
        if (ns.fileExists("BruteSSH.exe")) {
            ns.brutessh(server);
        }
        ns.nuke(server);
    }

    ns.toast("Got root on " + SERVERS.length + " servers.", "success");

}