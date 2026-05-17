import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  // Stolen from somewhere else: we start with servers which have half of our home ram
  let currentServerRam = ns.getServerMaxRam("home") / 2;

  let allServersMaxed = false;
  while (!allServersMaxed) {
    const servers = ns.cloud.getServerNames();

    if (servers.length < ns.cloud.getServerLimit()) {
      // If we have open server slots - we buy a new one
      const costOfServer = ns.cloud.getServerCost(currentServerRam);
      if (ns.getServerMoneyAvailable("home") > costOfServer * 1.1) {
        // Figuring out server name
        const lastServer = servers.pop();
        let newNumber;
        if (lastServer == undefined) {
          newNumber = 0;
        } else {
          newNumber = parseInt(lastServer.split("-")[1]) + 1;
        }

        const newServer = ns.cloud.purchaseServer(
          "pserv-" + newNumber,
          currentServerRam,
        );
        ns.print(
          `Purchased ${ns.format.ram(currentServerRam)} server "${newServer}"`,
        );
      }
    } else {
      // Our server slots are filled - time to upgrade!
      servers.sort((a, b) => {
        return ns.getServerMaxRam(a) - ns.getServerMaxRam(b);
      });

      const serverToUpgrade = servers[0];

      if (ns.getServerMaxRam(serverToUpgrade) >= currentServerRam) {
        // Our server with the minimum amount of ram already is at our current limit - lets increase the limit to the next step
        currentServerRam = currentServerRam * 2;
        if (currentServerRam > ns.cloud.getRamLimit()) {
          // All our servers are already maxed: We done!
          allServersMaxed = true;
          break;
        }
        ns.tprint(
          `Upgrading all our servers to ${ns.format.ram(currentServerRam)}`,
        );
      }

      const costToUpgrade = ns.cloud.getServerUpgradeCost(
        serverToUpgrade,
        currentServerRam,
      );
      if (ns.getServerMoneyAvailable("home") > costToUpgrade * 1.1) {
        ns.cloud.upgradeServer(serverToUpgrade, currentServerRam);
        ns.print(
          `Upgraded server ${serverToUpgrade} to ${ns.format.ram(currentServerRam)}`,
        );
      }
    }

    await ns.sleep(5000);
  }
}
