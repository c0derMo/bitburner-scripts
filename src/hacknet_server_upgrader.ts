import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  // TODO: Add check if we have the required bitnode
  ns.disableLog("ALL");

  const maxNodes = ns.hacknet.maxNumNodes();
  while (true) {
    const multiplier = ns.getHacknetMultipliers().production;
    let action = "";
    let actionNode = -1;
    let actionCost = Infinity;
    let actionWeight = 0;
    let cheapestCache = -1;
    let cheapestCacheCost = Infinity;

    // Figuring out what to do
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      const nodeStats = ns.hacknet.getNodeStats(i);
      const currentProduction = ns.formulas.hacknetServers.hashGainRate(
        nodeStats.level,
        nodeStats.ramUsed ?? 0,
        nodeStats.ram,
        nodeStats.cores,
        multiplier,
      );

      // Upgrade level
      const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(i);
      const levelUpgradeHashes =
        ns.formulas.hacknetServers.hashGainRate(
          nodeStats.level + 1,
          nodeStats.ramUsed ?? 0,
          nodeStats.ram,
          nodeStats.cores,
          multiplier,
        ) - currentProduction;
      const levelUpgradeWeight = levelUpgradeHashes / levelUpgradeCost;
      if (levelUpgradeWeight > actionWeight) {
        action = "upgradeLevel";
        actionNode = i;
        actionCost = levelUpgradeCost;
        actionWeight = levelUpgradeWeight;
      }

      // Upgrade ram
      const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(i);
      const ramUpgradeHashes =
        ns.formulas.hacknetServers.hashGainRate(
          nodeStats.level,
          nodeStats.ramUsed ?? 0,
          nodeStats.ram * 2,
          nodeStats.cores,
          multiplier,
        ) - currentProduction;
      const ramUpgradeWeight = ramUpgradeHashes / ramUpgradeCost;
      if (ramUpgradeWeight > actionWeight) {
        action = "upgradeRam";
        actionNode = i;
        actionCost = ramUpgradeCost;
        actionWeight = ramUpgradeWeight;
      }

      // Upgrade cores
      const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(i);
      const coreUpgradeHashes =
        ns.formulas.hacknetServers.hashGainRate(
          nodeStats.level,
          nodeStats.ramUsed ?? 0,
          nodeStats.ram,
          nodeStats.cores + 1,
          multiplier,
        ) - currentProduction;
      const coreUpgradeWeight = coreUpgradeHashes / coreUpgradeCost;
      if (coreUpgradeWeight > actionWeight) {
        action = "upgradeCore";
        actionNode = i;
        actionCost = coreUpgradeCost;
        actionWeight = coreUpgradeWeight;
      }

      // Optional: upgrade cache
      const cacheCost = ns.hacknet.getCacheUpgradeCost(i);
      if (cacheCost < cheapestCacheCost) {
        cheapestCache = i;
        cheapestCacheCost = cacheCost;
      }
    }

    // Optional: buy new node
    if (ns.hacknet.numNodes() < maxNodes) {
      const buyStats = calculateNewServerStats(ns, actionCost);
      const buyWeight = buyStats.hashes / buyStats.cost;
      if (buyWeight > actionWeight) {
        action = "purchase";
        actionNode = -1;
        actionCost = ns.hacknet.getPurchaseNodeCost();
        actionWeight = buyWeight;
      }
    }

    // Optional: check if buying cache is a lot cheaper
    if (cheapestCacheCost < actionCost * 0.3) {
      action = "upgradeCache";
      actionNode = cheapestCache;
      actionCost = cheapestCacheCost;
      actionWeight = Infinity;
    }

    // If we have no nodes, buy one!
    if (ns.hacknet.numNodes() <= 0) {
      action = "purchase";
      actionNode = -1;
      actionCost = ns.hacknet.getPurchaseNodeCost();
      actionWeight = Infinity;
    }

    // We got our action, now time to wait for the money
    ns.print(`Waiting for $${ns.format.number(actionCost)} (${action})`);
    while (ns.getPlayer().money < actionCost) {
      await ns.sleep(5000);
    }

    switch (action) {
      case "purchase":
        ns.hacknet.purchaseNode();
        ns.print(`INFO: Purchased node for ${ns.format.number(actionCost)}`);
        break;
      case "upgradeLevel":
        ns.hacknet.upgradeLevel(actionNode);
        ns.print(
          `INFO: Upgraded level of node ${actionNode} for ${ns.format.number(actionCost)}`,
        );
        break;
      case "upgradeRam":
        ns.hacknet.upgradeRam(actionNode);
        ns.print(
          `INFO: Upgraded RAM of node ${actionNode} for ${ns.format.number(actionCost)}`,
        );
        break;
      case "upgradeCore":
        ns.hacknet.upgradeCore(actionNode);
        ns.print(
          `INFO: Upgraded core of node ${actionNode} for ${ns.format.number(actionCost)}`,
        );
        break;
      case "upgradeCache":
        ns.hacknet.upgradeCache(actionNode);
        ns.print(
          `INFO: Upgraded cache of node ${actionNode} for ${ns.format.number(actionCost)}`,
        );
        break;
      default:
        ns.print(`ERROR: Unknown action ${action}`);
        break;
    }

    await ns.sleep(500);
  }
}

function calculateNewServerStats(
  ns: NS,
  maxMoney: number,
): { hashes: number; cost: number } {
  const multipliers = ns.getHacknetMultipliers();
  let currentCost = ns.hacknet.getPurchaseNodeCost();
  let level = 1;
  let ram = 1;
  let cores = 1;
  while (currentCost < maxMoney) {
    const currentProduction = ns.formulas.hacknetServers.hashGainRate(
      level,
      0,
      ram,
      cores,
      multipliers.production,
    );

    const levelUpgradeCost = ns.formulas.hacknetServers.levelUpgradeCost(
      level,
      1,
      multipliers.levelCost,
    );
    const levelUpgradeHashesIncrease =
      ns.formulas.hacknetServers.hashGainRate(
        level + 1,
        0,
        ram,
        cores,
        multipliers.production,
      ) - currentProduction;
    const levelWeight = levelUpgradeHashesIncrease / levelUpgradeCost;

    const ramUpgradeCost = ns.formulas.hacknetServers.ramUpgradeCost(
      ram,
      1,
      multipliers.ramCost,
    );
    const ramUpgradeHashesIncrease =
      ns.formulas.hacknetServers.hashGainRate(
        level,
        0,
        ram * 2,
        cores,
        multipliers.production,
      ) - currentProduction;
    const ramWeight = ramUpgradeHashesIncrease / ramUpgradeCost;

    const coreUpgradeCost = ns.formulas.hacknetServers.coreUpgradeCost(
      cores,
      1,
      multipliers.coreCost,
    );
    const coreUpgradeHashesIncrease =
      ns.formulas.hacknetServers.hashGainRate(
        level,
        0,
        ram,
        cores + 1,
        multipliers.production,
      ) - currentProduction;
    const coreWeight = coreUpgradeHashesIncrease / coreUpgradeCost;

    const canAffordLevel = currentCost + levelUpgradeCost <= maxMoney;
    const canAffordRam = currentCost + ramUpgradeCost <= maxMoney;
    const canAffordCore = currentCost + coreUpgradeCost <= maxMoney;

    if (!canAffordCore && !canAffordRam && !canAffordLevel) {
      break;
    } else if (
      canAffordLevel &&
      (levelWeight >= ramWeight || !canAffordRam) &&
      (levelWeight >= coreWeight || !canAffordCore)
    ) {
      level += 1;
      currentCost += levelUpgradeCost;
    } else if (
      canAffordRam &&
      (ramWeight >= levelWeight || !canAffordLevel) &&
      (ramWeight >= coreWeight || !canAffordCore)
    ) {
      ram *= 2;
      currentCost += ramUpgradeCost;
    } else if (
      canAffordCore &&
      (coreWeight >= levelWeight || !canAffordLevel) &&
      (coreWeight >= ramWeight || !canAffordRam)
    ) {
      cores += 1;
      currentCost += coreUpgradeCost;
    } else {
      ns.print(
        "ERROR: new server stats has something affordable but no decision taken",
      );
    }
  }

  return {
    hashes: ns.formulas.hacknetServers.hashGainRate(
      level,
      0,
      ram,
      cores,
      multipliers.production,
    ),
    cost: currentCost,
  };
}
