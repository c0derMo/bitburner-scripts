import { NS } from '@ns'

const reqMinChance = 0.8;
const reqMaxChance = 1.0;

export async function main(ns: NS) : Promise<void> {
    ns.disableLog("ALL");

    while (true) {
        // Checking how much rep we need for the next op:
        const nextOp = ns.bladeburner.getNextBlackOp();
        if (nextOp == null) {
            // We're done!
            return;
        }

        const currentRank = ns.bladeburner.getRank();
        if (currentRank < nextOp.rank) {
            // Do stuff to increase rank
            continue;
        }

        const chance = ns.bladeburner.getActionEstimatedSuccessChance(ns.enums.BladeburnerActionType.BlackOp, nextOp.name);
        if (chance[0] < reqMinChance || chance[1] < reqMaxChance) {
            // Do stuff to increase chance
            continue;
        }

        ns.print("Doing the next blackop");
        ns.bladeburner.startAction(ns.enums.BladeburnerActionType.BlackOp, nextOp.name);
        await ns.bladeburner.nextUpdate();
    }
}