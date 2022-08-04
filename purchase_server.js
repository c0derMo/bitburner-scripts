import { NS } from "./NS";

/** @param {NS} ns */
export async function main(ns) {
    const RAM = ns.args[0];
    let i = 0;
    while (i < ns.getPurchasedServerLimit()) {
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(RAM)) {
            let hostname = ns.purchaseServer("pserv-" + i, RAM);
            await ns.scp("early-script.js", hostname);
            ns.exec("early-script.js", hostname, 3, "hong-fang-tea");
            i++;
        }
        await ns.sleep(5000);
    }
}