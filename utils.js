export async function runUntilFinished(ns, script, threads = 1, ...args) {
    const handle = ns.run(script, threads, ...args);
    while (ns.getRunningScript(handle) != null) {
        await ns.sleep(500);
    }
}

export async function toastAndPrint(ns, message, type = "info") {
    ns.toast(message, type);
    ns.tprint(message);
}