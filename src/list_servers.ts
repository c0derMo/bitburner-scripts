import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    ns.tprint(ns.getPurchasedServers().length + " servers:");
    ns.getPurchasedServers().forEach(s => {
        ns.tprint(" " + s);
    })
}
