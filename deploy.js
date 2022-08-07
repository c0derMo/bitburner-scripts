/** @param {NS} ns */
export async function main(ns) {
    const SCRIPT_TO_RUN = "early-script.js";
    const TARGET = ns.args[0];

    await ns.scp(SCRIPT_TO_RUN, TARGET);

    // Check if script is already running
    const processes = ns.ps(TARGET).filter((e) => {
        return e.filename === SCRIPT_TO_RUN &&
            e.args[0] !== ns.args[1]
    });
    ns.print(processes);
    if (processes.length >= 1) {
        ns.print("Killing previous process");
        processes.forEach((p) => {
            ns.kill(p.pid, TARGET);
        })
    }

    const threads = Math.floor((ns.getServerMaxRam(TARGET) - ns.getServerUsedRam(TARGET)) / ns.getScriptRam(SCRIPT_TO_RUN));

    if (threads > 0) {
        ns.exec(SCRIPT_TO_RUN, TARGET, threads, ns.args[1]);
    }
}