import { NS } from '@ns'

export function main(ns: NS) : Promise<void> {
    const factions = ns.getPlayer().factions;
    let allAugments: string[] = [];
    for (const faction of factions) {
        allAugments.push(...getAllPurchaseableAugmentsOfFaction(ns, faction));
    }

    allAugments = filterByPrereq(ns, allAugments);

    allAugments.sort((a, b) => {
        return ns.singularity.getAugmentationBasePrice(b) - ns.singularity.getAugmentationBasePrice(a);
    });

    const trueOrder: string[] = [];
    while (allAugments.length != 0) {
        const sortedPrereqs = getAugmentSortedPrereqs(ns, allAugments[0]);

        trueOrder.push(...sortedPrereqs);
        allAugments = allAugments.filter((augment) => {
            return !sortedPrereqs.includes(augment);
        });
    }

    ns.tprint("Order: ");
    for (const augment of trueOrder) {
        ns.tprint("  " + augment);
    }
}

function getAugmentSortedPrereqs(ns: NS, augment: string): string[] {
    const prereqs = ns.singularity.getAugmentationPrereq(augment);
    prereqs.sort((a, b) => {
        return ns.singularity.getAugmentationBasePrice(b) - ns.singularity.getAugmentationBasePrice(a);
    });

    const result: string[] = [];

    for (const prereq of prereqs) {
        result.push(...getAugmentSortedPrereqs(ns, prereq));
    }

    result.push(augment);

    return result;
}

function filterByPrereq(ns: NS, augments: string[]): string[] {
    return augments.filter((augment) => {
        const prereqs = ns.singularity.getAugmentationPrereq(augment);
        for (const prereq of prereqs) {
            if (!augments.includes(prereq)) {
                return false;
            }
        }
        return true;
    });
}

function getAllPurchaseableAugmentsOfFaction(ns: NS, faction: string): string[] {
    const rep = ns.singularity.getFactionRep(faction);
    const installedAugments = ns.singularity.getOwnedAugmentations(true);
    return ns.singularity.getAugmentationsFromFaction(faction)
        .filter((augment) => {
            return !installedAugments.includes(augment)
        })
        .filter((augment) => {
            return ns.singularity.getAugmentationRepReq(augment) < rep
        });
}