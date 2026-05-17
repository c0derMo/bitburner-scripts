import { NS } from "@ns";
import { SubCommand } from "bitcfg";

export default class BuyProgramsSubcommand implements SubCommand {
  name = "buy_programs";
  help = ["Buys all available exploits from the darkweb."];

  private programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];

  async execute(ns: NS): Promise<void> {
    while (!ns.singularity.purchaseTor()) {
      await ns.sleep(100);
    }
    ns.tprint("Purchased tor router");

    for (const program of this.programs) {
      if (ns.fileExists(program, "home")) {
        continue;
      }
      while (
        ns.getPlayer().money < ns.singularity.getDarkwebProgramCost(program)
      ) {
        await ns.sleep(1000);
      }
      if (ns.singularity.purchaseProgram(program)) {
        ns.tprint(`Purchased ${program}`);
      } else {
        ns.tprint(`Error purchasing ${program}`);
      }
    }
  }
}
