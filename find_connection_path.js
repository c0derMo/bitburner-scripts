function find_path(ns, target, previousPath = []) {
    previousPath.push(target);
    const servers = ns.scan(target).filter((e) => { return !previousPath.includes(e) });
    for (const server of servers) {
        if (server == "home") {
            previousPath.push("home");
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
export async function main(ns) {
    const TARGET = ns.args[0];

    const path = find_path(ns, TARGET).reverse();

    ns.tprint(path.join(" -> "));
}