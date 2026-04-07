import {
  zInputTag,
  type DesignSpec,
  type InputTag,
} from "@/lib/api/short-types";

export function validateInputTagState(inputTag: InputTag): InputTag {
  const parsed = zInputTag.parse(inputTag);
  const codonMapNames = parsed.codon_maps.map((codonMap) => codonMap.name);
  if (new Set(codonMapNames).size !== codonMapNames.length) {
    throw new Error("Codon map names must be unique.");
  }

  const regionNames = parsed.regions.map((region) => region.name);
  if (new Set(regionNames).size !== regionNames.length) {
    throw new Error("Region names must be unique.");
  }

  const regionNameSet = new Set(regionNames);
  const codonMapNameSet = new Set(codonMapNames);

  for (const region of parsed.regions) {
    if (region.predecessor && !regionNameSet.has(region.predecessor)) {
      throw new Error(`Unknown predecessor: ${region.predecessor}`);
    }
  }

  if (parsed.designs.length === 0) {
    throw new Error("At least one design is required.");
  }

  parsed.designs.forEach((design) => {
    validateDesignMapping(design, regionNameSet, codonMapNameSet);
  });

  return parsed;
}

function validateDesignMapping(
  design: DesignSpec,
  regionNames: Set<string>,
  codonMapNames: Set<string>,
) {
  const mappedRegionNames = new Set(Object.keys(design.region_designs));
  if (mappedRegionNames.size !== regionNames.size) {
    throw new Error(`Design ${design.id} must map every region exactly once.`);
  }
  for (const regionName of regionNames) {
    if (!mappedRegionNames.has(regionName)) {
      throw new Error(`Design ${design.id} is missing region ${regionName}.`);
    }
  }
  for (const codonMapName of Object.values(design.region_designs)) {
    if (!codonMapNames.has(codonMapName)) {
      throw new Error(
        `Design ${design.id} references unknown codon map ${codonMapName}.`,
      );
    }
  }
}
