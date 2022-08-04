import { NS } from "./NS";

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(ns.getPurchasedServers().length + " servers:");
    ns.getPurchasedServers().forEach(s => {
        ns.tprint(" " + s);
    })
}