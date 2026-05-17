import { AutocompleteData, NS, ScriptArg } from "@ns";
import StatusSubcommand from "@/bitcfg/commands/status";
import isScriptRunningOnServer from "@/bitcfg/utils/isRunningOnServer";
import JoinHackingFactionsSubcommand from "@/bitcfg/commands/join_hacking_factions";
import BuyProgramsSubcommand from "@/bitcfg/commands/buy_programs";
import ListFactionsSubcommand from "@/bitcfg/commands/list_factions";
import NodeStatsSubcommand from "@/bitcfg/commands/node_stats";

const flagConfig = [
  ["h", false], // help
  ["a", false],
] as [string, string | boolean | number | string[]][];

export interface Flags {
  _: string[];
  [key: string]: ScriptArg | string[];
}

export interface SubCommand {
  name: string;
  help: string[];
  execute(ns: NS, args: ScriptArg[]): void | Promise<void>;
}

const subcommands = [
  new StatusSubcommand(),
  new JoinHackingFactionsSubcommand(),
  new BuyProgramsSubcommand(),
  new ListFactionsSubcommand(),
  new NodeStatsSubcommand(),
] as SubCommand[];

const version = "0.1";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const currentServer = ns.getHostname();
  if (currentServer !== "home") {
    ns.tprint("bitcfg should be ran on home!");
    return;
  }

  if (!isScriptRunningOnServer(ns, "bitcfg-daemon.ts", "home")) {
    ns.tprint("INFO: bitcfg daemon not running, starting daemon...");
    ns.run("bitcfg/bitcfg-daemon.js");
  }

  ns.tprint(`bitcfg v${version}`);

  const flags = ns.flags(flagConfig) as Flags;

  if (flags._.length === 0) {
    if (flags.h) {
      help(ns);
    } else {
      ns.tprint("Please specify a subcommand. Run with '-h' to display help.");
    }
    return;
  }

  for (const command of subcommands) {
    if (command.name === flags._[0]) {
      await command.execute(ns, ns.args);
      return;
    }
  }
  ns.tprint(`ERROR: command ${flags._[0]} not found`);
}

function help(ns: NS) {
  ns.tprint("Subcommands:");

  let longestCommandLength = 0;
  for (const command of subcommands) {
    longestCommandLength = Math.max(longestCommandLength, command.name.length);
  }

  for (const command of subcommands) {
    if (command.help.length <= 0) {
      ns.tprint(
        `  ${command.name.padEnd(longestCommandLength)} - No help given`,
      );
    } else if (command.help.length <= 1) {
      ns.tprint(
        `  ${command.name.padEnd(longestCommandLength)} - ${command.help[0]}`,
      );
    } else {
      ns.tprint(
        `  ${command.name.padEnd(longestCommandLength)} - ${command.help[0]}`,
      );
      for (let i = 1; i < command.help.length; i++) {
        ns.tprint(`  ${"".padEnd(longestCommandLength)}   ${command.help[i]}`);
      }
    }
  }
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  if (args.length === 1) {
    const options = subcommands.filter((cmd) => cmd.name.startsWith(args[0]));
    return options.map((o) => o.name);
  }
  return [];
}
