function find_path(ns: NS, target: string, previousPath = [] as string[]): string[] | null {
    previousPath.push(target);
    const servers = ns.scan(target).filter((e) => { return !previousPath.includes(e) });
    for (const server of servers) {
        if (server == "home") {
            previousPath.push("home");
            return previousPath;
        }
        else if (ns.getServer(server).backdoorInstalled) {
            previousPath.push(server);
            return previousPath;
        }
        const path = find_path(ns, server, previousPath);
        if (path != null) {
            return path;
        }
    }
    return null;
}

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const TARGET = ns.args[0] as string;

    const path = find_path(ns, TARGET);

    if (path != null) {
        ns.tprint(path.reverse().join(" -> "));
        if (path[0] === "home") {
            path.pop();
        }
        ns.tprint(path.map((e) => { return "connect " + e}).join(" ; "));
    } else {
        ns.tprint("No path.");
    }
}