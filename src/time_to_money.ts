import { NS } from "@ns";

export function main(ns: NS): Promise<void> {
  let hashesPerSecond = 0;
  for (let node = 0; node < ns.hacknet.numNodes(); node++) {
    const nodeInfo = ns.hacknet.getNodeStats(node);
    hashesPerSecond += nodeInfo.production;
  }

  const hacknetMoneyPerS = (hashesPerSecond / 4) * 1000000;

  const totalMoneyPerS = hacknetMoneyPerS + ns.getTotalScriptIncome()[0];
  ns.tprint(`Total money / second: ${ns.format.number(totalMoneyPerS)}`);

  const parsedInput = scaleInput(ns.args[0] as string);
  ns.tprint(`Time needed to reach ${ns.format.number(parsedInput)}`);

  const timeNeeded = parsedInput / totalMoneyPerS;
  ns.tprint(
    `${timeNeeded} seconds == ${timeNeeded / 60} minutes == ${timeNeeded / 3600} hours.`,
  );
}

function scaleInput(input: string): number {
  let numeric = parseInt(input);
  if (input.endsWith("k")) {
    numeric *= 1000;
  } else if (input.endsWith("m")) {
    numeric *= 1000000;
  } else if (input.endsWith("b")) {
    numeric *= 1000000000;
  } else if (input.endsWith("t")) {
    numeric *= 1000000000000;
  }
  return numeric;
}
