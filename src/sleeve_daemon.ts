import { CompanyName, FactionWorkType, NS, CrimeType } from "@ns";

type FocusOptions = "REP" | "COMBAT" | "HACK" | "STR" | "DEF" | "DEX" | "AGI";

const focus: FocusOptions = "REP";
const enableFactions = true;
const enableCompanies = true;
const targetCompanyRep = 300000;

export async function main(ns: NS): Promise<void> {
  const runningServer = ns.getHostname();
  if (runningServer !== "home") {
    ns.tprint("sleeve daemon should run on home!");
    return;
  }
  const runningScripts = ns.ps(runningServer);
  if (
    runningScripts.filter((process) => {
      return process.filename === "sleeve_daemon.js";
    }).length > 1
  ) {
    ns.tprint("sleeve daemon should only be ran once!");
    return;
  }

  while (true) {
    mainLoop(ns);
    await ns.sleep(60 * 1000);
  }
}

function mainLoop(ns: NS) {
  let sleeveWork = inspectCurrentWork(ns);

  // Shock & Sync
  sleeveWork = checkForShockSync(ns, sleeveWork);

  // Factions
  if (enableFactions) {
    const factionsToWork = getFactionsToWork(ns);
    for (const faction of factionsToWork) {
      if (sleeveWork.factions[faction] != null) {
        sleeveWork = removeSleeve(sleeveWork, sleeveWork.factions[faction]);
      } else {
        const sleeve = sleeveWork.unoccupiedSleeves.pop();
        if (sleeve == null) continue;
        setToFactionWorkPrioritize(ns, sleeve, faction);
        ns.print(`Sleeve ${sleeve} set to work for faction ${faction}.`);
        sleeveWork = removeSleeve(sleeveWork, sleeveWork.factions[faction]);
      }
    }
  }
  sleeveWork = moveFactionsToUnoccupied(sleeveWork);

  // Companies
  if (enableCompanies) {
    const companiesToWork = getCompaniesToWork(ns);
    for (const company of companiesToWork) {
      if (sleeveWork.jobs[company] != null) {
        sleeveWork = removeSleeve(sleeveWork, sleeveWork.jobs[company]);
      } else {
        const sleeve = sleeveWork.unoccupiedSleeves.pop();
        if (sleeve == null) continue;
        ns.sleeve.setToCompanyWork(sleeve, company as CompanyName);
        ns.print(`Sleeve ${sleeve} set to work for company ${company}.`);
      }
    }
  }
  sleeveWork = moveJobsToUnoccupied(sleeveWork);

  // Unoccupied sleeves, crime / training
  switch (focus) {
    case "REP":
      setToDoCrime(ns, sleeveWork.unoccupiedSleeves);
      break;
    case "COMBAT":
      setToDoCrimeForExp(ns, sleeveWork.unoccupiedSleeves);
      break;
    default:
      setToTrain(ns, sleeveWork.unoccupiedSleeves);
      break;
  }
}

interface SleeveWork {
  factions: Record<string, number>;
  jobs: Record<string, number>;
  unoccupiedSleeves: number[];
}

function inspectCurrentWork(ns: NS): SleeveWork {
  const result: SleeveWork = {
    factions: {},
    jobs: {},
    unoccupiedSleeves: [],
  };

  for (let sleeveNum = 0; sleeveNum < ns.sleeve.getNumSleeves(); sleeveNum++) {
    const work = ns.sleeve.getTask(sleeveNum);
    if (work?.type === "COMPANY") {
      result.jobs[work.companyName] = sleeveNum;
    } else if (work?.type === "FACTION") {
      result.factions[work.factionName] = sleeveNum;
    } else {
      result.unoccupiedSleeves.push(sleeveNum);
    }
  }

  result.unoccupiedSleeves.sort(() => Math.random() - 0.5);

  return result;
}

function removeSleeve(sleeveWork: SleeveWork, sleeve: number): SleeveWork {
  for (const faction in sleeveWork.factions) {
    if (sleeveWork.factions[faction] === sleeve) {
      delete sleeveWork.factions[faction];
    }
  }
  for (const job in sleeveWork.jobs) {
    if (sleeveWork.jobs[job] === sleeve) {
      delete sleeveWork.jobs[job];
    }
  }
  sleeveWork.unoccupiedSleeves.filter(
    (unoccupiedSleeve) => unoccupiedSleeve !== sleeve,
  );

  return sleeveWork;
}

function moveFactionsToUnoccupied(sleeveWork: SleeveWork): SleeveWork {
  for (const faction in sleeveWork.factions) {
    sleeveWork.unoccupiedSleeves.push(sleeveWork.factions[faction]);
    delete sleeveWork.factions[faction];
  }
  return sleeveWork;
}

function moveJobsToUnoccupied(sleeveWork: SleeveWork): SleeveWork {
  for (const job in sleeveWork.jobs) {
    sleeveWork.unoccupiedSleeves.push(sleeveWork.jobs[job]);
    delete sleeveWork.jobs[job];
  }
  return sleeveWork;
}

function checkForShockSync(ns: NS, sleeveWork: SleeveWork): SleeveWork {
  for (let sleeveNum = 0; sleeveNum < ns.sleeve.getNumSleeves(); sleeveNum++) {
    const stats = ns.sleeve.getSleeve(sleeveNum);
    if (stats.shock > 0) {
      ns.print(`Sleeve ${sleeveNum} set to shock recovery.`);
      ns.sleeve.setToShockRecovery(sleeveNum);
      sleeveWork = removeSleeve(sleeveWork, sleeveNum);
    } else if (stats.sync < 100) {
      ns.print(`Sleeve ${sleeveNum} set to synchronize.`);
      ns.sleeve.setToSynchronize(sleeveNum);
      sleeveWork = removeSleeve(sleeveWork, sleeveNum);
    }
  }

  return sleeveWork;
}

function getFactionsToWork(ns: NS): string[] {
  const factionsToWork: string[] = [];
  const installedAugments = ns.singularity.getOwnedAugmentations(true);

  const factions = ns.getPlayer().factions;
  for (const faction of factions) {
    const augments = ns.singularity
      .getAugmentationsFromFaction(faction)
      .filter((aug) => !installedAugments.includes(aug));
    const augmentCosts = augments.map((augment) =>
      ns.singularity.getAugmentationRepReq(augment),
    );
    const maxCost = Math.max(...augmentCosts);
    if (ns.singularity.getFactionRep(faction) < maxCost) {
      factionsToWork.push(faction);
    }
  }

  return factionsToWork;
}

function getCompaniesToWork(ns: NS): string[] {
  const companiesToWork: string[] = [];

  const companies = ns.getPlayer().jobs;
  for (const company in companies) {
    if (
      ns.singularity.getCompanyRep(company as CompanyName) < targetCompanyRep
    ) {
      companiesToWork.push(company);
    }
  }
  return companiesToWork;
}

function setToDoCrime(ns: NS, unoccupiedSleeves: number[]) {
  for (const sleeve of unoccupiedSleeves) {
    const sleeveStats = ns.sleeve.getSleeve(sleeve);
    const possibleCrimes = Object.values(ns.enums.CrimeType);
    possibleCrimes.sort((crimeA, crimeB) => {
      const gainsA = ns.formulas.work.crimeGains(sleeveStats, crimeA);
      const gainsB = ns.formulas.work.crimeGains(sleeveStats, crimeB);
      const probabilityA = ns.formulas.work.crimeSuccessChance(
        sleeveStats,
        crimeA,
      );
      const probabilityB = ns.formulas.work.crimeSuccessChance(
        sleeveStats,
        crimeB,
      );
      const timeA = ns.singularity.getCrimeStats(crimeA).time;
      const timeB = ns.singularity.getCrimeStats(crimeB).time;

      return (
        (gainsB.money * probabilityB) / timeB -
        (gainsA.money * probabilityA) / timeA
      );
    });

    const selectedCrime = possibleCrimes.shift() as CrimeType;
    ns.sleeve.setToCommitCrime(sleeve, selectedCrime);
  }
}

function setToDoCrimeForExp(ns: NS, unoccupiedSleeves: number[]) {
  for (const sleeve of unoccupiedSleeves) {
    const sleeveStats = ns.sleeve.getSleeve(sleeve);
    const possibleCrimes = Object.values(ns.enums.CrimeType);
    possibleCrimes.sort((crimeA, crimeB) => {
      const gainsA = ns.formulas.work.crimeGains(sleeveStats, crimeA);
      const gainsB = ns.formulas.work.crimeGains(sleeveStats, crimeB);

      return (
        gainsB.agiExp +
        gainsB.defExp +
        gainsB.dexExp +
        gainsB.strExp -
        (gainsA.agiExp + gainsA.defExp + gainsA.dexExp + gainsA.strExp)
      );
    });

    const selectedCrime = possibleCrimes.shift() as CrimeType;
    ns.sleeve.setToCommitCrime(sleeve, selectedCrime);
  }
}

function setToFactionWorkPrioritize(
  ns: NS,
  sleeveNumber: number,
  faction: string,
) {
  const possibleWorkOptions = ns.singularity.getFactionWorkTypes(faction);
  const sleeveStats = ns.sleeve.getSleeve(sleeveNumber);
  const factionFavor = ns.singularity.getFactionFavor(faction);
  possibleWorkOptions.sort((workA, workB) => {
    const gainsA = ns.formulas.work.factionGains(
      sleeveStats,
      workA,
      factionFavor,
    );
    const gainsB = ns.formulas.work.factionGains(
      sleeveStats,
      workB,
      factionFavor,
    );

    if (focus === "HACK") {
      return gainsB.hackExp - gainsA.hackExp;
    } else if (focus === "COMBAT") {
      return (
        gainsB.agiExp +
        gainsB.defExp +
        gainsB.dexExp +
        gainsB.strExp -
        (gainsA.agiExp + gainsA.defExp + gainsA.dexExp + gainsA.strExp)
      );
    } else if (focus === "AGI") {
      return gainsB.agiExp - gainsA.agiExp;
    } else if (focus === "DEF") {
      return gainsB.defExp - gainsA.defExp;
    } else if (focus === "DEX") {
      return gainsB.dexExp - gainsA.dexExp;
    } else if (focus === "STR") {
      return gainsB.strExp - gainsA.strExp;
    } else {
      return gainsB.reputation - gainsA.reputation;
    }
  });

  const workType = possibleWorkOptions.shift() as FactionWorkType;
  ns.sleeve.setToFactionWork(sleeveNumber, faction, workType);
}

function setToTrain(ns: NS, unoccupiedSleeves: number[]) {
  for (const sleeve of unoccupiedSleeves) {
    switch (focus) {
      case "HACK":
        ns.sleeve.setToUniversityCourse(
          sleeve,
          "rothman university",
          "algorithms",
        );
        break;
      case "AGI":
      case "STR":
      case "DEF":
      case "DEX":
        ns.sleeve.setToGymWorkout(sleeve, "powerhouse gym", focus);
        break;
    }
  }
}
