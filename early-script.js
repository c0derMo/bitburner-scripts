/** @param {NS} ns */
export async function main(ns) {
    const TARGET = ns.args[0];

    let moneyThresh = ns.getServerMaxMoney(TARGET) * 0.75;
    let securityThresh = ns.getServerMinSecurityLevel(TARGET);

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