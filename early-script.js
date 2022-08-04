import { NS } from "./NS";

/** @param {NS} ns */
export async function main(ns) {
    const TARGET = ns.args[0];

    let moneyThresh = ns.getServerMaxMoney(TARGET) * 0.75;
    let securityThresh = ns.getServerMinSecurityLevel(TARGET) * 0.75;

    if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(TARGET);
    }
    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(TARGET);
    }
    ns.nuke(TARGET);

    while(true) {
        if (ns.getServerSecurityLevel(TARGET) > securityThresh) {
            await ns.weaken(TARGET);
        } else if (ns.getServerMoneyAvailable(TARGET) < moneyThresh) {
            await ns.grow(TARGET);
        } else {
            await ns.hack(TARGET);
        }
    }
}