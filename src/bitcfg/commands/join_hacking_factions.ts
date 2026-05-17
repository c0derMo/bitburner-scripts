import { SubCommand } from "../../bitcfg";
import { TextTransforms } from "../../text_transforms";
import findConnectionPath from "../utils/findConnectionPath";
import { NS } from "@ns";

export default class JoinHackingFactionsSubcommand implements SubCommand {
  name = "join_hacking_factions";
  help = ["Joins all available hacking factions."];

  private factionsToServers = {
    CyberSec: "CSEC",
    NiteSec: "avmnite-02h",
    "The Black Hand": "I.I.I.I",
    BitRunners: "run4theh111z",
  } as Record<string, string>;

  getLongestFactionLength(): number {
    let longestFactionLength = 0;
    for (const faction in this.factionsToServers) {
      longestFactionLength = Math.max(faction.length, longestFactionLength);
    }
    return longestFactionLength;
  }

  async execute(ns: NS): Promise<void> {
    const player = ns.getPlayer();
    const longestFactionLength = this.getLongestFactionLength();
    for (const faction in this.factionsToServers) {
      if (player.factions.includes(faction)) {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("already joined", [TextTransforms.Color.Green])}`,
        );
        continue;
      }

      const server = ns.getServer(this.factionsToServers[faction]);
      if (server == null) {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("server not found", [TextTransforms.Color.Red, TextTransforms.Transform.Underline])}`,
        );
        continue;
      }

      if ((server.hackDifficulty ?? 0) > player.skills.hacking) {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("hack level not high enough", [TextTransforms.Color.Red])} (${player.skills.hacking}/${server.hackDifficulty})`,
        );
        continue;
      }

      ns.tprint(
        `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("backdooring...", [TextTransforms.Color.Yellow])}`,
      );
      const path = findConnectionPath(ns, this.factionsToServers[faction]);
      if (path == null) {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("failed: no connection to server", [TextTransforms.Color.Red, TextTransforms.Transform.Underline])}`,
        );
        continue;
      }

      path.reverse();
      for (const hop of path) {
        ns.singularity.connect(hop);
      }

      await ns.singularity.installBackdoor();
      ns.tprint(
        `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("waiting for faction invite...", [TextTransforms.Color.Yellow])}`,
      );
      while (!ns.singularity.checkFactionInvitations().includes(faction)) {
        await ns.sleep(50);
      }
      if (ns.singularity.joinFaction(faction)) {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("joined faction", [TextTransforms.Color.Green, TextTransforms.Transform.Bold])}`,
        );
      } else {
        ns.tprint(
          `${faction.padEnd(longestFactionLength)} - ${TextTransforms.apply("something went wrong while joining :(", [TextTransforms.Color.Red])}`,
        );
      }
      ns.singularity.connect("home");
    }
  }
}
