import { recursiveScan } from "./advanced_scan";

/** @param {NS} ns */
export async function main(ns) {

    let possiblePorts = 0;
    ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"].forEach((e) => {
        if (ns.fileExists(e)) {
            possiblePorts++;
        }
    });

    const SERVERS = recursiveScan(ns, "home", possiblePorts, true, true);

    for (const server of SERVERS) {
        if (ns.fileExists("SQLInject.exe")) {
            ns.sqlinject(server);
        }
        if (ns.fileExists("HTTPWorm.exe")) {
            ns.httpworm(server);
        }
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