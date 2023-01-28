import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const TARGET = ns.args[0] as string;

    const moneyThresh = ns.getServerMaxMoney(TARGET);
    const securityThresh = ns.getServerMinSecurityLevel(TARGET);

    while (true) {
        if (ns.getServerSecurityLevel(TARGET) > securityThresh) {
            await ns.weaken(TARGET);
        } else if (ns.getServerMoneyAvailable(TARGET) < moneyThresh) {
            await ns.grow(TARGET);
        } else {
            await ns.hack(TARGET);
        }
    }
}