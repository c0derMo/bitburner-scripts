import { recursiveScan } from "advanced_scan";
import { runUntilFinished, toastAndPrint } from "utils";

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const TARGET = ns.args[0] as string;

    await runUntilFinished(ns, "get_root.js");

    let possiblePorts = 0;
    ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"].forEach((e) => {
        if (ns.fileExists(e)) {
            possiblePorts++;
        }
    });

    const SERVERS = recursiveScan(ns, "home", possiblePorts, false, true).filter((e) => { return e !== "home" });

    ns.print(SERVERS);

    for (const server of SERVERS) {
        await runUntilFinished(ns, "deploy.js", 1, server, TARGET);
    }

    toastAndPrint(ns, "Deployed script to " + SERVERS.length + " servers.");
}