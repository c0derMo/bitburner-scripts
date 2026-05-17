import { NS, Server } from "@ns";
import { TextTransforms } from "@/text_transforms";

// Attack scripts
const weakenScript = "/dist/weaken.js";
const growScript = "/dist/grow.js";
const hackScript = "/dist/hack.js";
const attackScripts = [weakenScript, growScript, hackScript];

// Ram reqirement for slave scripts (hack, grow, weaken)
const slaveScriptRam = 1.75;

// Delay each loop
const loopDelay = 1000;

// Percentage of money hacked each hack
let hackAmount = 0.1;

// Delay between H-G-W in ms
const actionDelay = 200;

// Delay between two attacks in ms
const attackDelay = 500;

let currentPartAction = "";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const flags = ns.flags([
    ["tail", false], // automatically open tail window
    ["t", false],
    ["set-initial-percentage", 0], // set the initial hack percentage
  ]);

  if (flags.tail || flags.t) {
    ns.ui.openTail();
  }
  if (flags["set-initial-percentage"] !== 0) {
    hackAmount = Math.min(
      0.99,
      Math.max(0.1, flags["set-initial-percentage"] as number),
    );
  } else {
    const homeRam = ns.getServerMaxRam("home");
    if (homeRam >= 65536) {
      hackAmount = 0.99;
    } else if (homeRam >= 16384) {
      hackAmount = 0.9;
    } else if (homeRam >= 8192) {
      hackAmount = 0.5;
    } else if (homeRam >= 2048) {
      hackAmount = 0.2;
    }
  }
  ns.tprint(`Starting with hackAmount ${hackAmount}`);

  while (true) {
    // We delay at the start, so we can just continue at any point in the loop
    await ns.sleep(loopDelay);

    const servers = new Set<string>([]);
    await recursiveScan(ns, "home", servers);
    nukeAll(ns, servers);
    const mappedServers = sortServers(ns, servers);

    const originallyAvailableThreads = mappedServers.totalAvailableThreads;
    let totalAvailableThreads = mappedServers.totalAvailableThreads;

    if (
      currentPartAction !== "" &&
      !isAttackOngoing(ns, currentPartAction, [...servers])
    ) {
      currentPartAction = "";
    }

    const calculatedAttacks = mappedServers.hackableServers
      .filter((target) => !isAttackOngoing(ns, target, [...servers]))
      .map((target) => calculateAttack(ns, target));

    const possibleRehacks: AttackInfo[] = [];
    let rehacksAllowed = false;

    while (totalAvailableThreads > 0) {
      calculatedAttacks.sort((a, b) => {
        // TODO: This has to have a smarter way...
        // Even firster sorting by initial delay to only re-hack if we hacked all other things
        if (a.rehackCount !== b.rehackCount) {
          return a.rehackCount - b.rehackCount;
        }

        // First sorting by the percentage of available threads for the attack
        const threadAmountA = a.hackThreads + a.growThreads + a.weakenThreads;
        const threadAmountB = b.hackThreads + b.growThreads + b.weakenThreads;
        const threadPercentageA = Math.min(
          1,
          totalAvailableThreads / threadAmountA,
        );
        const threadPercentageB = Math.min(
          1,
          totalAvailableThreads / threadAmountB,
        );

        if (threadPercentageA !== threadPercentageB) {
          return threadPercentageB - threadPercentageA;
        }

        // Secondly, stolen weight from xtree
        const weightA =
          ns.getServerMaxMoney(a.target) /
          ns.getServerMinSecurityLevel(a.target);
        const weightB =
          ns.getServerMaxMoney(b.target) /
          ns.getServerMinSecurityLevel(b.target);
        return weightB - weightA;
      });

      const nextAttack = calculatedAttacks.shift();
      if (nextAttack == null) {
        break;
      }

      if (
        nextAttack.hackThreads +
          nextAttack.growThreads +
          nextAttack.weakenThreads >
          totalAvailableThreads &&
        currentPartAction !== ""
      ) {
        continue;
      }

      let launchedHackThreads = 0;
      let launchedGrowThreads = 0;
      let launchedWeakenThreads = 0;

      const addedDelay = nextAttack.rehackCount * attackDelay;

      for (const usableServer of mappedServers.usableServers) {
        if (
          launchedHackThreads >= nextAttack.hackThreads &&
          launchedGrowThreads >= nextAttack.growThreads &&
          launchedWeakenThreads >= nextAttack.weakenThreads
        ) {
          break;
        }

        let serverAvailableThreads = Math.floor(
          getServerFreeRam(ns, usableServer) / slaveScriptRam,
        );
        if (
          launchedHackThreads < nextAttack.hackThreads &&
          serverAvailableThreads > 0
        ) {
          const possibleThreads = Math.min(
            nextAttack.hackThreads - launchedHackThreads,
            serverAvailableThreads,
          );
          ns.exec(
            hackScript,
            usableServer,
            { threads: possibleThreads },
            nextAttack.target,
            addedDelay + nextAttack.hackDelay,
          );
          launchedHackThreads += possibleThreads;
          serverAvailableThreads -= possibleThreads;
          totalAvailableThreads -= possibleThreads;
        }

        if (
          launchedGrowThreads < nextAttack.growThreads &&
          serverAvailableThreads > 0
        ) {
          const possibleThreads = Math.min(
            nextAttack.growThreads - launchedGrowThreads,
            serverAvailableThreads,
          );
          ns.exec(
            growScript,
            usableServer,
            { threads: possibleThreads },
            nextAttack.target,
            addedDelay + nextAttack.growDelay,
          );
          launchedGrowThreads += possibleThreads;
          serverAvailableThreads -= possibleThreads;
          totalAvailableThreads -= possibleThreads;
        }

        if (
          launchedWeakenThreads < nextAttack.weakenThreads &&
          serverAvailableThreads > 0
        ) {
          const possibleThreads = Math.min(
            nextAttack.weakenThreads - launchedWeakenThreads,
            serverAvailableThreads,
          );
          ns.exec(
            weakenScript,
            usableServer,
            { threads: possibleThreads },
            nextAttack.target,
            addedDelay,
          );
          launchedWeakenThreads += possibleThreads;
          serverAvailableThreads -= possibleThreads;
          totalAvailableThreads -= possibleThreads;
        }
      }

      let timeTaken = 0;
      if (launchedHackThreads > 0) {
        timeTaken = Math.max(
          timeTaken,
          addedDelay + nextAttack.hackDelay + nextAttack.hackTime,
        );
      }
      if (launchedGrowThreads > 0) {
        timeTaken = Math.max(
          timeTaken,
          addedDelay + nextAttack.growDelay + nextAttack.growTime,
        );
      }
      if (launchedWeakenThreads > 0) {
        timeTaken = Math.max(timeTaken, addedDelay + nextAttack.weakenTime);
      }

      if (nextAttack.prep) {
        if (
          launchedWeakenThreads >= nextAttack.weakenThreads &&
          launchedGrowThreads >= nextAttack.growThreads
        ) {
          ns.print(
            `${TextTransforms.apply("FULL PREP", [TextTransforms.Color.Green])} ${nextAttack.target} - ${launchedGrowThreads}G/${launchedWeakenThreads}W in ${ns.format.time(timeTaken)} @ ${hackAmount}`,
          );
        } else {
          ns.print(
            `${TextTransforms.apply("PART PREP", [TextTransforms.Color.Yellow])} ${nextAttack.target} - ${launchedGrowThreads}G/${launchedWeakenThreads}W of ${nextAttack.growThreads}G/${nextAttack.weakenThreads}W in ${ns.format.time(timeTaken)} @ ${hackAmount}`,
          );
          currentPartAction = nextAttack.target;
        }
      } else {
        if (
          launchedHackThreads >= nextAttack.hackThreads &&
          launchedGrowThreads >= nextAttack.growThreads &&
          launchedWeakenThreads >= nextAttack.weakenThreads
        ) {
          if (nextAttack.rehackCount > 0) {
            ns.print(
              `${TextTransforms.apply("FULL HACK", [TextTransforms.Color.Green, TextTransforms.Transform.Bold])} ${nextAttack.target} - ${launchedHackThreads}H/${launchedGrowThreads}G/${launchedWeakenThreads}W in ${ns.format.time(timeTaken)} @ ${hackAmount} (RH${nextAttack.rehackCount})`,
            );
          } else {
            ns.print(
              `${TextTransforms.apply("FULL HACK", [TextTransforms.Color.Green, TextTransforms.Transform.Bold])} ${nextAttack.target} - ${launchedHackThreads}H/${launchedGrowThreads}G/${launchedWeakenThreads}W in ${ns.format.time(timeTaken)} @ ${hackAmount}`,
            );
          }

          const reHack = { ...nextAttack };
          reHack.rehackCount += 1;
          if (reHack.rehackCount < reHack.maxRehacks) {
            if (rehacksAllowed || calculatedAttacks.length === 0) {
              calculatedAttacks.push(...possibleRehacks);
              calculatedAttacks.push(reHack);
              rehacksAllowed = true;
            } else {
              possibleRehacks.push(reHack);
            }
          }
        } else {
          ns.print(
            `${TextTransforms.apply("PART HACK", [TextTransforms.Color.Yellow, TextTransforms.Transform.Bold])} ${nextAttack.target} - ${launchedHackThreads}H/${launchedGrowThreads}G/${launchedWeakenThreads}W of ${nextAttack.hackThreads}H/${nextAttack.growThreads}G/${nextAttack.weakenThreads}W in ${ns.format.time(timeTaken)} @ ${hackAmount}`,
          );
          currentPartAction = nextAttack.target;

          // Reduce hack amount based on missing threads
          const percentageOfThreads =
            (launchedHackThreads +
              launchedGrowThreads +
              launchedWeakenThreads) /
            (nextAttack.hackThreads +
              nextAttack.growThreads +
              nextAttack.weakenThreads);
          if (percentageOfThreads < 0.2) {
            hackAmount -= 0.1;
          } else if (percentageOfThreads) {
            hackAmount -= 0.05;
          } else {
            hackAmount -= 0.01;
          }
          hackAmount = Math.max(0.1, hackAmount);
        }
      }
    }

    // Increase hack amount if we dont have any partial attacks running
    if (currentPartAction === "" && hackAmount < 0.99) {
      const percentageOfFreeThreads =
        totalAvailableThreads / originallyAvailableThreads;
      if (percentageOfFreeThreads > 0.8) {
        hackAmount += 0.1;
      } else if (percentageOfFreeThreads > 0.5) {
        hackAmount += 0.05;
      } else {
        hackAmount += 0.01;
      }
      hackAmount = Math.min(hackAmount, 0.99);
    }
  }
}

/**
 * Checks whether a target server is currently under attack by our servers.
 * @param ns NetScript functions
 * @param targetServer Target server
 * @param hackingServers Servers launching the attack
 * @returns true, if the target server is currently under attack, false otherwise
 */
function isAttackOngoing(
  ns: NS,
  targetServer: string,
  hackingServers: string[],
) {
  for (const server of hackingServers) {
    const processes = ns.ps(server);
    for (const process of processes) {
      if (
        attackScripts.includes("/" + process.filename) &&
        process.args.includes(targetServer)
      ) {
        return true;
      }
    }
  }
  return false;
}

interface ServersMap {
  hackableServers: string[];
  usableServers: string[];
  totalAvailableThreads: number;
}

/**
 * Sorts and filters servers, to figure out which we can use, which we can attack
 * @param ns NetScript functions
 * @param servers Servers to sort
 * @returns Sorted & filtered servers
 */
function sortServers(ns: NS, servers: Set<string>): ServersMap {
  const result = {
    hackableServers: [],
    usableServers: [],
    totalAvailableThreads: 0,
  } as ServersMap;
  for (const server of servers) {
    if (
      ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel() &&
      ns.getServerMaxMoney(server) > 0 &&
      ns.hasRootAccess(server)
    ) {
      result.hackableServers.push(server);
    }

    if (ns.hasRootAccess(server) && !server.startsWith("hacknet-server")) {
      const freeRam = getServerFreeRam(ns, server);

      if (freeRam > slaveScriptRam) {
        ns.scp(attackScripts, server, "home");

        result.usableServers.push(server);
        result.totalAvailableThreads += Math.floor(freeRam / slaveScriptRam);
      }
    }
  }

  result.usableServers.sort((a: string, b: string) => {
    return getServerFreeRam(ns, a) - getServerFreeRam(ns, b);
  });

  return result;
}

/**
 * Attempts to nuke open all servers.
 * @param ns NetScript functions
 * @param servers Servers to attempt to hack
 */
function nukeAll(ns: NS, servers: Set<string>): void {
  for (const server of servers) {
    if (ns.hasRootAccess(server)) continue;
    let openPorts = 0;

    if (ns.fileExists("BruteSSH.exe")) {
      ns.brutessh(server);
      openPorts++;
    }
    if (ns.fileExists("FTPCrack.exe")) {
      ns.ftpcrack(server);
      openPorts++;
    }
    if (ns.fileExists("HTTPWorm.exe")) {
      ns.httpworm(server);
      openPorts++;
    }
    if (ns.fileExists("relaySMTP.exe")) {
      ns.relaysmtp(server);
      openPorts++;
    }
    if (ns.fileExists("SQLInject.exe")) {
      ns.sqlinject(server);
      openPorts++;
    }
    if (openPorts >= ns.getServerNumPortsRequired(server)) {
      ns.nuke(server);
    }
  }
}

/**
 * Scans all hosts recursively from the starting host. Mutates the input servers set.
 * @param ns NetScript functions
 * @param host Host to start scanning from
 * @param servers Already scanned servers
 */
async function recursiveScan(
  ns: NS,
  host: string,
  servers: Set<string>,
): Promise<void> {
  servers.add(host);
  const newServers = ns.scan(host);
  for (const serverToScan of newServers) {
    if (servers.has(serverToScan)) continue;
    await recursiveScan(ns, serverToScan, servers);
  }
}

function getServerFreeRam(ns: NS, server: string): number {
  const maxRam = ns.getServerMaxRam(server);
  const usedRam = ns.getServerUsedRam(server);
  if (server === "home") {
    return Math.max(0, maxRam - usedRam - 10);
  }
  return maxRam - usedRam;
}

interface AttackInfo {
  hackThreads: number;
  hackTime: number;
  hackDelay: number;
  growThreads: number;
  growDelay: number;
  growTime: number;
  weakenThreads: number;
  weakenTime: number;
  prep: boolean;
  target: string;
  rehackCount: number;
  maxRehacks: number;
}

function calculateAttack(ns: NS, target: string): AttackInfo {
  const moneyAvailable = ns.getServerMoneyAvailable(target);
  const moneyMax = ns.getServerMaxMoney(target);
  const currentSecurity = ns.getServerSecurityLevel(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);

  if (
    moneyAvailable / moneyMax > 0.95 &&
    currentSecurity / minSecurity < 1.05
  ) {
    return calculateHack(ns, target);
  } else {
    return calculatePrep(ns, target);
  }
}

function calculateHack(ns: NS, target: string): AttackInfo {
  const amountToSteal = ns.getServerMoneyAvailable(target) * hackAmount;
  const hackThreads = Math.floor(ns.hackAnalyzeThreads(target, amountToSteal));
  const hackTime = ns.getHackTime(target);
  const addedHackSecurity = ns.hackAnalyzeSecurity(hackThreads);

  const hackedServerInfo = ns.getServer(target) as Server;
  hackedServerInfo.moneyAvailable = Math.max(
    0,
    (hackedServerInfo.moneyAvailable ?? 0) - amountToSteal,
  );
  hackedServerInfo.hackDifficulty = Math.max(
    hackedServerInfo.minDifficulty ?? 0,
    (hackedServerInfo.hackDifficulty ?? 0) + addedHackSecurity,
  );
  const growThreads = Math.ceil(
    ns.formulas.hacking.growThreads(
      hackedServerInfo,
      ns.getPlayer(),
      ns.getServerMaxMoney(target),
      0,
    ),
  );
  const addedGrowSecurity = ns.growthAnalyzeSecurity(growThreads);
  const growTime = ns.getGrowTime(target);

  const weakenPerThread = ns.weakenAnalyze(1);
  const weakenThreads = Math.ceil(
    (addedHackSecurity + addedGrowSecurity) / weakenPerThread,
  );
  const weakenTime = ns.getWeakenTime(target);

  const growDelay = Math.max(0, weakenTime - growTime - actionDelay);
  const hackDelay = Math.max(0, weakenTime - hackTime - 2 * actionDelay);

  // Not quite sure how this works out, taken from somewhere else...
  const maxRehackCount = Math.floor((weakenTime - attackDelay) / attackDelay);

  return {
    hackThreads: hackThreads,
    hackTime: hackTime + hackDelay,
    hackDelay: hackDelay,
    growThreads: growThreads,
    growDelay: growDelay,
    growTime: growTime + growDelay,
    weakenThreads: weakenThreads,
    weakenTime: weakenTime,
    prep: false,
    target: target,
    rehackCount: 0,
    maxRehacks: maxRehackCount,
  };
}

function calculatePrep(ns: NS, target: string): AttackInfo {
  const growThreads = Math.floor(
    ns.formulas.hacking.growThreads(
      ns.getServer(target),
      ns.getPlayer(),
      ns.getServerMaxMoney(target),
    ),
  );
  const growAddedSecurity = ns.growthAnalyzeSecurity(growThreads);
  const growTime = ns.getGrowTime(target);

  const weakenPerThread = ns.weakenAnalyze(1);
  const weakenThreads = Math.ceil(
    (ns.getServerSecurityLevel(target) -
      ns.getServerMinSecurityLevel(target) +
      growAddedSecurity) /
      weakenPerThread,
  );
  const weakenTime = ns.getWeakenTime(target);

  const growDelay = Math.max(0, weakenTime - growTime - actionDelay);

  return {
    hackThreads: 0,
    hackTime: 0,
    hackDelay: 0,
    growThreads: growThreads,
    growDelay: growDelay,
    growTime: growTime + growDelay,
    weakenThreads: weakenThreads,
    weakenTime: weakenTime,
    prep: true,
    target: target,
    rehackCount: 0,
    maxRehacks: 0,
  };
}
