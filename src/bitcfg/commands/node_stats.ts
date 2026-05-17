import { NS } from "@ns";
import { SubCommand } from "bitcfg";

export default class NodeStatsSubcommand implements SubCommand {
  name = "node_stats";
  help = ["Shows the stats of the current bitnode."];

  execute(ns: NS): void {
    ns.tprint(
      `w0r1d_d43m0n difficulty: ${ns.getServerRequiredHackingLevel("w0r1d_d43m0n")}`,
    );
  }
}
