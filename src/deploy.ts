/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const SCRIPT_TO_RUN = "early-script.js";
    const TARGET = ns.args[0] as string;

    await ns.scp(SCRIPT_TO_RUN, TARGET);

    // Check if script is already running
    const processes = ns.ps(TARGET).filter((e) => {
        const possibleThreads = Math.floor((ns.getServerMaxRam(TARGET) - ns.getServerUsedRam(TARGET) + (e.threads * ns.getScriptRam(SCRIPT_TO_RUN))) / ns.getScriptRam(SCRIPT_TO_RUN));

        return e.filename === SCRIPT_TO_RUN &&
            (e.args[0] !== ns.args[1] ||
            e.threads !== possibleThreads);
    });
    ns.print(processes);
    if (processes.length >= 1) {
        ns.print("Killing previous process");
        processes.forEach((p) => {
            ns.kill(p.filename, TARGET, ...p.args);
        })
    }

    const threads = Math.floor((ns.getServerMaxRam(TARGET) - ns.getServerUsedRam(TARGET)) / ns.getScriptRam(SCRIPT_TO_RUN));

    if (threads > 0) {
        ns.exec(SCRIPT_TO_RUN, TARGET, threads, ns.args[1]);
    }
}