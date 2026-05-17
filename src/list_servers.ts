import { NS } from "@ns";

export function main(ns: NS): Promise<void> {
  ns.tprint(ns.cloud.getServerNames().length + " servers:");
  ns.cloud.getServerNames().forEach((s) => {
    ns.tprint(" " + s);
  });
}
