import { BladeburnerActionEnumType, NS } from '@ns'

// TODO:
// - Measures when chaos too high

const blackOpsreqMinChance = 0.9;
const chaosThreshhold = 50;
const lowStaminaThresholdPct = 0.5;
const highStaminaThresholdPct = 0.9;
const lowHPThresholdPct = 0.2;
const highHPThresholdPct = 0.99;
const reqMinChance = 0.9;

let isStaminaRecovering = false;
let isHPRecovering = false;

export async function main(ns: NS) : Promise<void> {
    ns.disableLog("ALL");

    while (true) {
        await ns.bladeburner.nextUpdate();

        spendSkillPoints(ns);

        // Checking our health
        const healthStats = ns.getPlayer();
        if (isHPRecovering && healthStats.hp.current >= healthStats.hp.max * highHPThresholdPct) {
            isHPRecovering = false;
        }
        if (isHPRecovering || healthStats.hp.current < healthStats.hp.max * lowHPThresholdPct) {
            isHPRecovering = true;
            startActionIfNotCurrent(ns, ns.enums.BladeburnerActionType.General, "Hyperbolic Regeneration Chamber");
            continue;
        }

        // Checking our stamina
        const staminaStats = ns.bladeburner.getStamina();
        if (isStaminaRecovering && staminaStats[0] >= staminaStats[1] * highStaminaThresholdPct) {
            isStaminaRecovering = false;
        }
        if (isStaminaRecovering || staminaStats[0] < staminaStats[1] * lowStaminaThresholdPct) {
            isStaminaRecovering = true;
            staminaRecovery(ns);
            continue;
        }

        travelToOptimalCity(ns);

        // Checking how much rep we need for the next op:
        const nextOp = ns.bladeburner.getNextBlackOp();
        if (nextOp == null) {
            // We're done!
            return;
        }

        const currentRank = ns.bladeburner.getRank();
        const chance = ns.bladeburner.getActionEstimatedSuccessChance(ns.enums.BladeburnerActionType.BlackOp, nextOp.name);
        if (currentRank > nextOp.rank && chance[0] > blackOpsreqMinChance) {
            // Do stuff to increase rank
            ns.tprint("Doing the next blackop");
            startActionIfNotCurrent(ns, ns.enums.BladeburnerActionType.BlackOp, nextOp.name);
            continue;
        }

        const bestAction = getActionWithHighestChanceAndMostGain(ns);
        if (bestAction == null) {
            ns.tprint("Bladerunner doesn't have a good action! Something broke in the script :/");
        } else {
            startActionIfNotCurrent(ns, bestAction.type, bestAction.name);
        }
    }
}

function startActionIfNotCurrent(ns: NS, type: BladeburnerActionEnumType, action: string) {
    const currentAction = ns.bladeburner.getCurrentAction();
    if (currentAction == null || currentAction.type !== type || currentAction.name !== action) {
        ns.print(`Starting ${action}`);
        ns.bladeburner.startAction(type, action);
    }
}

interface ActionInfo {
    type: BladeburnerActionEnumType,
    name: string,
    minChance: number,
    maxChance: number,
    rankGain: number,
    rankLoss: number,
    timeTaken: number,
    amountRemaining: number,
}

function computeActionInfo(ns: NS, type: BladeburnerActionEnumType, action: string): ActionInfo {
    const chances = ns.bladeburner.getActionEstimatedSuccessChance(type, action);
    const remaining = ns.bladeburner.getActionCountRemaining(type, action);
    const rankGain = ns.bladeburner.getActionRankGain(type, action);
    const rankLoss = ns.bladeburner.getActionRankLoss(type, action);
    const time = ns.bladeburner.getActionTime(type, action);
    return {
        type: type,
        name: action,
        minChance: chances[0],
        maxChance: chances[1],
        rankGain: rankGain,
        rankLoss: rankLoss,
        timeTaken: time,
        amountRemaining: remaining,
    }
}

function getActionWithHighestWeight(ns: NS, weightFunc: (info: ActionInfo) => (number | null)): ActionInfo | null {
    let allActions: ActionInfo[] = [];
    for (const action of ns.bladeburner.getGeneralActionNames()) {
        allActions.push(computeActionInfo(ns, ns.enums.BladeburnerActionType.General, action));
    }
    for (const action of ns.bladeburner.getContractNames()) {
        allActions.push(computeActionInfo(ns, ns.enums.BladeburnerActionType.Contract, action));
    }
    for (const action of ns.bladeburner.getOperationNames()) {
        allActions.push(computeActionInfo(ns, ns.enums.BladeburnerActionType.Operation, action));
    }

    // Filter out everything that's unavailable
    allActions = allActions.filter((action) => {
        return action.amountRemaining > 0;
    });

    // Apply filtering based on weight function
    allActions = allActions.filter((action) => {
        return weightFunc(action) != null
    });

    if (allActions.length <= 0) {
        return null;
    }

    // Sort based on weights
    allActions = allActions.sort((a, b) => {
        return weightFunc(b) - weightFunc(a);
    });

    return allActions[0];
}

function getActionWithHighestChanceAndMostGain(ns: NS): ActionInfo | null {
    return getActionWithHighestWeight(ns, (action) => {
        if (action.minChance < reqMinChance) {
            return null;
        }

        const medChance = (action.maxChance + action.minChance) / 2;
        const chancedRankGain = medChance * action.rankGain - (1 - medChance) * action.rankLoss;
        const timedChancedRankGain = chancedRankGain / action.timeTaken;

        return timedChancedRankGain;
    });
}

function staminaRecovery(ns: NS) {
    const chaos = ns.bladeburner.getCityChaos(ns.bladeburner.getCity());
    if (chaos > chaosThreshhold) {
        startActionIfNotCurrent(ns, ns.enums.BladeburnerActionType.General, "Diplomacy");
    } else {
        startActionIfNotCurrent(ns, ns.enums.BladeburnerActionType.General, "Field Analysis");
    }
}

function travelToOptimalCity(ns: NS) {
    const cities = [ns.enums.CityName.Sector12, ns.enums.CityName.Aevum, ns.enums.CityName.Volhaven, ns.enums.CityName.Chongqing, ns.enums.CityName.NewTokyo, ns.enums.CityName.Ishima];
    const citiesWithPop = cities.map((city) => {
        return {
            city: city,
            population: ns.bladeburner.getCityEstimatedPopulation(city),
        }
    });
    citiesWithPop.sort((a, b) => b.population - a.population);
    const targetCity = citiesWithPop[0].city;
    const currentCity = ns.bladeburner.getCity();
    if (targetCity !== currentCity) {
        ns.bladeburner.switchCity(targetCity);
    }
}

const skillCostModifiers = { // Stolen from https://github.com/alainbryden/bitburner-scripts/blob/main/bladeburner.js
    "Overclock": 0.8, // Speed up contracts/operations. More important now that sleeves remove the operation count bottleneck
    "Reaper": 1.2, // Combat boost. Early effect is paltry (because stats are so low), will get plenty of points late game
    "Evasive Systems": 1.2, // Dex/Agi boost. Mildly deprioritized for same reasoning as above.
    "Cloak": 1.5, // Cheap, and stealth ends up with plenty of boost, so we don't need to invest in Cloak as much.
    "Hyperdrive": 2, // Improves stats gained, but not Rank gained. Less useful if training outside of BB
    "Tracer": 2, // Only boosts Contract success chance, which are relatively easy to begin with.
    "Cyber's Edge": 5, // Boosts stamina, but contract counts are much more limiting than stamina, so isn't really needed
    "Hands of Midas": 10 // Improves money gain. It is assumed that Bladeburner will *not* be a main source of income
};

function spendSkillPoints(ns: NS) {
    const skills = ns.bladeburner.getSkillNames();
    const points = ns.bladeburner.getSkillPoints();

    let skillToUpgrade = "";
    let skillCost = Number.MAX_SAFE_INTEGER;
    let trueCost = Number.MAX_SAFE_INTEGER;
    for (const skill of skills) {
        const localTrueCost = ns.bladeburner.getSkillUpgradeCost(skill);
        const upgradeCost = localTrueCost * (skillCostModifiers[skill] || 1);
        if (upgradeCost < skillCost) {
            skillToUpgrade = skill;
            skillCost = upgradeCost;
            trueCost = localTrueCost;
        }
    }

    if (trueCost > points) {
        return;
    }
    
    ns.bladeburner.upgradeSkill(skillToUpgrade);
}