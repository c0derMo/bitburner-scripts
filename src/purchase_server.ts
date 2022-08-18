import { NS } from '@ns'
import { runUntilFinished, toastAndPrint } from '/utils';

export async function main(ns : NS) : Promise<void> {
    const RAM = ns.args[0] as number;
    let i = 0;
    while (i < ns.getPurchasedServerLimit()) {
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(RAM)) {
            const hostname = ns.purchaseServer("pserv-" + i, RAM);
            await runUntilFinished(ns, "deploy.js", 1, hostname, "joesguns");
            toastAndPrint(ns, `Purchased ${RAM}gb server "${hostname}"`);
            i++;
        }
        await ns.sleep(5000);
    }
}