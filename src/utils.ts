import { NS } from '@ns'

/**
 * Runs a .js script until it's exitted.
 *
 * @export
 * @param {NS} ns NS instance
 * @param {string} script Script to run
 * @param {number} [threads=1] How many threads to use
 * @param {...string[]} args Script arguments
 */
export async function runUntilFinished(ns: NS, script: string, threads = 1, ...args: string[]): Promise<void> {
    const handle = ns.run(script, threads, ...args);
    while (ns.getRunningScript(handle) != null) {
        await ns.sleep(50);
    }
}

type ToastType = "info" | "success" | "warning" | "error" | undefined;

/**
 * Toast's & prints a message to the terminal
 *
 * @export
 * @param {NS} ns NS instance
 * @param {string} message Message to display
 * @param {string} [type="info"] Toast type
 */
export function toastAndPrint(ns: NS, message: string, type: ToastType = "info"): void {
    ns.toast(message, type);
    ns.tprint(message);
}