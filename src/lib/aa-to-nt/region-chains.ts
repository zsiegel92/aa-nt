import type { RegionSpec } from "@/api/client";

export type RegionChain = {
  head: RegionSpec;
  regions: RegionSpec[];
};

export function getRegionByName(
  regions: readonly RegionSpec[],
  regionName: string | null | undefined,
): RegionSpec | null {
  if (!regionName) {
    return null;
  }
  return regions.find((region) => region.name === regionName) ?? null;
}

export function getSuccessor(
  regions: readonly RegionSpec[],
  regionName: string,
): RegionSpec | null {
  return regions.find((region) => region.predecessor === regionName) ?? null;
}

export function hasSuccessor(
  regions: readonly RegionSpec[],
  regionName: string,
): boolean {
  return getSuccessor(regions, regionName) !== null;
}

export function isAncestor(
  regions: readonly RegionSpec[],
  ancestorName: string,
  descendantName: string,
): boolean {
  let currentRegion = getRegionByName(regions, descendantName);
  const seen = new Set<string>();

  while (currentRegion?.predecessor) {
    if (seen.has(currentRegion.name)) {
      return false;
    }
    if (currentRegion.predecessor === ancestorName) {
      return true;
    }
    seen.add(currentRegion.name);
    currentRegion = getRegionByName(regions, currentRegion.predecessor);
  }

  return false;
}

export function getEligiblePredecessors(
  regions: readonly RegionSpec[],
  regionName: string,
): RegionSpec[] {
  return regions.filter(
    (candidate) =>
      candidate.name !== regionName &&
      !isAncestor(regions, regionName, candidate.name) &&
      !hasSuccessor(regions, candidate.name),
  );
}

export function countAncestors(
  regions: readonly RegionSpec[],
  regionName: string,
): number {
  let count = 0;
  let currentRegion = getRegionByName(regions, regionName);
  const seen = new Set<string>();

  while (currentRegion?.predecessor) {
    if (seen.has(currentRegion.name)) {
      break;
    }
    seen.add(currentRegion.name);
    currentRegion = getRegionByName(regions, currentRegion.predecessor);
    if (!currentRegion) {
      break;
    }
    count += 1;
  }

  return count;
}

export function countSuccessors(
  regions: readonly RegionSpec[],
  regionName: string,
): number {
  let count = 0;
  let currentRegion = getRegionByName(regions, regionName);
  const seen = new Set<string>();

  while (currentRegion) {
    if (seen.has(currentRegion.name)) {
      break;
    }
    seen.add(currentRegion.name);
    currentRegion = getSuccessor(regions, currentRegion.name);
    if (currentRegion) {
      count += 1;
    }
  }

  return count;
}

export function sortRegionsByPredecessor(
  regions: readonly RegionSpec[],
): RegionSpec[] {
  const ordered: RegionSpec[] = [];
  const visited = new Set<string>();

  const roots = regions.filter(
    (region) => !getRegionByName(regions, region.predecessor),
  );
  const queue = roots.length > 0 ? [...roots] : [...regions];

  while (queue.length > 0) {
    const head = queue.shift();
    if (!head || visited.has(head.name)) {
      continue;
    }
    let currentRegion: RegionSpec | null = head;
    while (currentRegion && !visited.has(currentRegion.name)) {
      ordered.push(currentRegion);
      visited.add(currentRegion.name);
      currentRegion = getSuccessor(regions, currentRegion.name);
    }
  }

  regions.forEach((region) => {
    if (!visited.has(region.name)) {
      ordered.push(region);
      visited.add(region.name);
    }
  });

  return ordered;
}

function findChainHead(
  regions: readonly RegionSpec[],
  region: RegionSpec,
): RegionSpec {
  let currentRegion: RegionSpec = region;
  const seen = new Set<string>();

  while (currentRegion.predecessor) {
    if (seen.has(currentRegion.name)) {
      break;
    }
    seen.add(currentRegion.name);
    const predecessorRegion = getRegionByName(
      regions,
      currentRegion.predecessor,
    );
    if (!predecessorRegion) {
      break;
    }
    currentRegion = predecessorRegion;
  }

  return currentRegion;
}

export function getRegionChains(regions: readonly RegionSpec[]): RegionChain[] {
  const chains: RegionChain[] = [];
  const visited = new Set<string>();
  const orderedRegions = sortRegionsByPredecessor(regions);

  orderedRegions.forEach((region) => {
    if (visited.has(region.name)) {
      return;
    }

    const head = findChainHead(regions, region);
    const chainRegions: RegionSpec[] = [];
    let currentRegion: RegionSpec | null = region;

    while (currentRegion && !visited.has(currentRegion.name)) {
      chainRegions.push(currentRegion);
      visited.add(currentRegion.name);
      currentRegion = getSuccessor(regions, currentRegion.name);
    }

    chains.push({
      head,
      regions: chainRegions,
    });
  });

  return chains;
}

export function validateRegionChains(regions: readonly RegionSpec[]): void {
  const successorCounts = new Map<string, number>();

  regions.forEach((region) => {
    if (!region.predecessor) {
      return;
    }
    successorCounts.set(
      region.predecessor,
      (successorCounts.get(region.predecessor) ?? 0) + 1,
    );
  });

  successorCounts.forEach((count, regionName) => {
    if (count > 1) {
      throw new Error(
        `Region ${regionName} cannot have more than one successor.`,
      );
    }
  });

  regions.forEach((region) => {
    const seen = new Set<string>();
    let currentRegion: RegionSpec | null = region;

    while (currentRegion?.predecessor) {
      if (seen.has(currentRegion.name)) {
        throw new Error(`Region predecessor cycle detected at ${region.name}.`);
      }
      seen.add(currentRegion.name);
      currentRegion = getRegionByName(regions, currentRegion.predecessor);
    }
  });
}
