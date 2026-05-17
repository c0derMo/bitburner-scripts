import { SubCommand } from "../../bitcfg";
import isScriptRunningOnServer from "../utils/isRunningOnServer";
import { TextTransforms } from "../../text_transforms";
import { NS } from "@ns";

export default class StatusSubcommand implements SubCommand {
  name = "status";
  help = ["Displays the status of all bitcfg modules."];

  private monitoredScripts = {
    "BitCfg Daemon": "bitcfg/bitcfg-daemon.js",
    "Server Hacker": "distributed-hack.js",
    "Hash Spender": "spend_hashes_to_money.js",
    "Hacknet Daemon": "hacknet_server_upgrader.js",
    "Sleeve Daemon": "sleeve_daemon.js",
  } as Record<string, string>;

  execute(ns: NS): void {
    for (const script in this.monitoredScripts) {
      if (isScriptRunningOnServer(ns, this.monitoredScripts[script], "home")) {
        ns.tprint(
          `  [${TextTransforms.apply("RUNNING", [TextTransforms.Color.Green])}] ${script}`,
        );
      } else {
        ns.tprint(
          `  [${TextTransforms.apply("STOPPED", [TextTransforms.Color.Red])}] ${script}`,
        );
      }
    }
  }
}
