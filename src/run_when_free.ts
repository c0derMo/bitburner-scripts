import { NS } from '@ns'

export async function main(ns: NS) : Promise<void> {
    const script = ns.args[0];
    const max = ns.getServerMaxRam();
    const req = ns.getScriptRam(script);
    while (true) {
        const used = ns.getServerUsedRam();
        const free = max - used;

        if (free > req) {
            ns.tprint(`Running ${script}...`);
            ns.run(script);
            return;
        }

        await ns.sleep(100);
    }
}