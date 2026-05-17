import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  while (true) {
    const fragments = ns.stanek.activeFragments();
    fragments.sort((a, b) => {
      return a.numCharge - b.numCharge;
    });
    ns.print(fragments);
    const toCharge = fragments.shift();
    if (toCharge == null) {
      return;
    }
    await ns.stanek.chargeFragment(toCharge.x, toCharge.y);
  }
}
