import { NS, ScriptArg } from "@ns";
import { SubCommand } from "../../bitcfg";

export default class ListFactionsSubcommand implements SubCommand {
  name = "list_factions";
  help = ["Lists all factions with the amount of remaining augments."];

  private factions = {
    "early game": ["Tian Di Hui", "Netburners", "Shadows of Anarchy"],
    city: [
      "Sector-12",
      "Chongqing",
      "New Tokyo",
      "Ishima",
      "Aevum",
      "Volhaven",
    ],
    hacking: ["CyberSec", "NiteSec", "The Black Hand", "BitRunners"],
    megacorp: [
      "ECorp",
      "MegaCorp",
      "KuaiGong International",
      "Four Sigma",
      "NWO",
      "Blade Industries",
      "OmniTek Incorporated",
      "Bachman & Associates",
      "Clarke Incorporated",
      "Fulcrum Secret Technologies",
    ],
    criminal: [
      "Slum Snakes",
      "Tetrads",
      "Silhouette",
      "Speakers for the Dead",
      "The Dark Army",
      "The Syndicate",
    ],
    "late game": ["The Covenant", "Illuminati", "Daedalus"],
    "end game": ["Bladeburners", "Church of the Machine God"],
  } as Record<string, string[]>;

  getLongestFactionLength(): number {
    let longestFactionLength = 0;
    for (const category in this.factions) {
      for (const faction of this.factions[category]) {
        longestFactionLength = Math.max(longestFactionLength, faction.length);
      }
    }
    return longestFactionLength;
  }

  execute(ns: NS, args: ScriptArg[]): void {
    const includeAll = args.includes("-a");

    const playerAugments = ns.singularity.getOwnedAugmentations(true);
    const playerFactions = ns.getPlayer().factions;

    for (const category in this.factions) {
      ns.tprint(`== ${category.toUpperCase()} FACTIONS ==`);
      for (const faction of this.factions[category]) {
        if (!includeAll && !playerFactions.includes(faction)) {
          continue;
        }
        const augments = ns.singularity.getAugmentationsFromFaction(faction);
        const remainingAugments = augments.filter(
          (augment) => !playerAugments.includes(augment),
        );

        if (remainingAugments.length >= 1) {
          ns.tprint(
            `${faction.padEnd(this.getLongestFactionLength())} - ${remainingAugments.length} remaining`,
          );
        } else {
          ns.tprint(
            `${faction.padEnd(this.getLongestFactionLength())} - empty`,
          );
        }
      }
      ns.tprint("");
    }
  }
}
