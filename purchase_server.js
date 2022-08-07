import { runUntilFinished, toastAndPrint } from "./utils";

/** @param {NS} ns */
export async function main(ns) {
    const RAM = ns.args[0];
    let i = 0;
    while (i < ns.getPurchasedServerLimit()) {
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(RAM)) {
            let hostname = ns.purchaseServer("pserv-" + i, RAM);
            await runUntilFinished(ns, "deploy.js", 1, hostname, "joesguns");
            toastAndPrint(`Purchased ${RAM}gb server "${hostname}"`);
            i++;
        }
        await ns.sleep(5000);
    }
}