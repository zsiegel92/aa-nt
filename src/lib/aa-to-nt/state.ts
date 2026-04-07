import type { CodonMapSpec, DesignSpec, InputTag, RegionSpec } from "@/api/client";

function nextUniqueName(existingNames: readonly string[], baseName: string): string {
  let candidateIndex = 2;
  let candidate = `${baseName}_${candidateIndex}`;
  while (existingNames.includes(candidate)) {
    candidateIndex += 1;
    candidate = `${baseName}_${candidateIndex}`;
  }
  return candidate;
}

function syncDesignVersions(designs: readonly DesignSpec[]): DesignSpec[] {
  const versionById = new Map<string, number>();
  return designs.map((design) => {
    const nextVersion = versionById.get(design.id) ?? 0;
    versionById.set(design.id, nextVersion + 1);
    return { ...design, version: nextVersion };
  });
}

function syncRegionMapsForNewRegion(
  designs: readonly DesignSpec[],
  regionName: string,
  fallbackCodonMapName: string
): DesignSpec[] {
  return designs.map((design) => ({
    ...design,
    region_designs: {
      ...design.region_designs,
      [regionName]: fallbackCodonMapName,
    },
  }));
}

function renameRegionAcrossDesigns(
  designs: readonly DesignSpec[],
  previousName: string,
  nextName: string
): DesignSpec[] {
  return designs.map((design) => {
    const { [previousName]: previousCodonMapName, ...rest } = design.region_designs;
    return {
      ...design,
      region_designs: {
        ...rest,
        [nextName]: previousCodonMapName ?? "",
      },
    };
  });
}

function removeRegionAcrossDesigns(
  designs: readonly DesignSpec[],
  regionName: string
): DesignSpec[] {
  return designs.map((design) => {
    const { [regionName]: _removed, ...rest } = design.region_designs;
    return {
      ...design,
      region_designs: rest,
    };
  });
}

function renameCodonMapAcrossDesigns(
  designs: readonly DesignSpec[],
  previousName: string,
  nextName: string
): DesignSpec[] {
  return designs.map((design) => ({
    ...design,
    region_designs: Object.fromEntries(
      Object.entries(design.region_designs).map(([regionName, codonMapName]) => [
        regionName,
        codonMapName === previousName ? nextName : codonMapName,
      ])
    ),
  }));
}

function removeCodonMapAcrossDesigns(
  designs: readonly DesignSpec[],
  codonMapName: string,
  replacementCodonMapName: string
): DesignSpec[] {
  return designs.map((design) => ({
    ...design,
    region_designs: Object.fromEntries(
      Object.entries(design.region_designs).map(([regionName, mappedCodonMapName]) => [
        regionName,
        mappedCodonMapName === codonMapName ? replacementCodonMapName : mappedCodonMapName,
      ])
    ),
  }));
}

function getConnectedRegionNames(
  regions: readonly RegionSpec[],
  regionName: string
): Set<string> {
  const connectedNames = new Set<string>([regionName]);
  let changed = true;
  while (changed) {
    changed = false;
    regions.forEach((region) => {
      if (
        connectedNames.has(region.name) ||
        (region.predecessor !== undefined &&
          region.predecessor !== null &&
          connectedNames.has(region.predecessor))
      ) {
        if (!connectedNames.has(region.name)) {
          connectedNames.add(region.name);
          changed = true;
        }
        if (region.predecessor && !connectedNames.has(region.predecessor)) {
          connectedNames.add(region.predecessor);
          changed = true;
        }
      }
    });
  }
  return connectedNames;
}

function updateRegionField(
  region: RegionSpec,
  field: keyof RegionSpec,
  value: RegionSpec[keyof RegionSpec]
): RegionSpec {
  if (field === "wild_type") {
    const wildType = `${value ?? ""}`;
    return {
      ...region,
      wild_type: wildType,
      length: region.constant_nt ? Math.floor(wildType.length / 3) : region.length,
    };
  }
  if (field === "constant_nt") {
    const constantNt = Boolean(value);
    return {
      ...region,
      constant_nt: constantNt,
      length: constantNt ? Math.floor(region.wild_type.length / 3) : region.length,
    };
  }
  if (field === "length") {
    return {
      ...region,
      length: Number(value),
    };
  }
  if (
    field === "substitution" ||
    field === "reverse_complement" ||
    field === "has_custom_upstream_tail_annotation_length" ||
    field === "has_custom_downstream_tail_annotation_length"
  ) {
    return {
      ...region,
      [field]: Boolean(value),
    };
  }
  if (
    field === "custom_upstream_tail_annotation_length" ||
    field === "custom_downstream_tail_annotation_length"
  ) {
    return {
      ...region,
      [field]: Number(value),
    };
  }
  return {
    ...region,
    [field]: value,
  };
}

export type InputTagAction =
  | { type: "replace"; value: InputTag }
  | { type: "setDesignColumnName"; value: string }
  | {
      type: "updateCodonMap";
      index: number;
      field: keyof CodonMapSpec;
      value: string;
    }
  | { type: "duplicateCodonMap"; index: number }
  | { type: "deleteCodonMap"; index: number }
  | {
      type: "updateRegion";
      index: number;
      field: keyof RegionSpec;
      value: RegionSpec[keyof RegionSpec];
    }
  | { type: "duplicateRegion"; index: number }
  | { type: "deleteRegion"; index: number }
  | {
      type: "updateDesign";
      index: number;
      field: "id";
      value: string;
    }
  | {
      type: "updateDesignRegionMap";
      designIndex: number;
      regionName: string;
      codonMapName: string;
    }
  | { type: "duplicateDesign"; index: number }
  | { type: "deleteDesign"; index: number };

export function inputTagReducer(state: InputTag, action: InputTagAction): InputTag {
  switch (action.type) {
    case "replace":
      return action.value;
    case "setDesignColumnName":
      return { ...state, design_column_name: action.value };
    case "updateCodonMap": {
      const codonMaps = state.codon_maps.map((codonMap, index) => {
        if (index !== action.index) {
          return codonMap;
        }
        const nextCodonMap = {
          ...codonMap,
          [action.field]: action.value,
        } as CodonMapSpec;
        return nextCodonMap;
      });
      if (action.field !== "name") {
        return { ...state, codon_maps: codonMaps };
      }
      const previousName = state.codon_maps[action.index]?.name ?? "";
      return {
        ...state,
        codon_maps: codonMaps,
        designs: renameCodonMapAcrossDesigns(
          state.designs,
          previousName,
          action.value
        ),
      };
    }
    case "duplicateCodonMap": {
      const source = state.codon_maps[action.index];
      if (!source) {
        return state;
      }
      const duplicateName = nextUniqueName(
        state.codon_maps.map((codonMap) => codonMap.name),
        source.name
      );
      return {
        ...state,
        codon_maps: [
          ...state.codon_maps.slice(0, action.index + 1),
          { ...source, name: duplicateName },
          ...state.codon_maps.slice(action.index + 1),
        ],
      };
    }
    case "deleteCodonMap": {
      if (state.codon_maps.length <= 1) {
        return state;
      }
      const removed = state.codon_maps[action.index];
      const nextCodonMaps = state.codon_maps.filter((_, index) => index !== action.index);
      if (!removed || nextCodonMaps.length === 0) {
        return state;
      }
      return {
        ...state,
        codon_maps: nextCodonMaps,
        designs: removeCodonMapAcrossDesigns(
          state.designs,
          removed.name,
          nextCodonMaps[0].name
        ),
      };
    }
    case "updateRegion": {
      const currentRegion = state.regions[action.index];
      if (!currentRegion) {
        return state;
      }
      const updatedRegion = updateRegionField(
        currentRegion,
        action.field,
        action.value
      );
      let nextRegions = state.regions.map((region, index) =>
        index === action.index ? updatedRegion : region
      );
      let nextDesigns = state.designs;
      if (action.field === "name") {
        nextRegions = nextRegions.map((region, index) =>
          index === action.index
            ? region
            : {
                ...region,
                predecessor:
                  region.predecessor === currentRegion.name
                    ? updatedRegion.name
                    : region.predecessor,
              }
        );
        nextDesigns = renameRegionAcrossDesigns(
          state.designs,
          currentRegion.name,
          updatedRegion.name
        );
      }
      if (action.field === "reverse_complement") {
        const connectedNames = getConnectedRegionNames(nextRegions, updatedRegion.name);
        nextRegions = nextRegions.map((region) =>
          connectedNames.has(region.name)
            ? { ...region, reverse_complement: Boolean(action.value) }
            : region
        );
      }
      return {
        ...state,
        regions: nextRegions,
        designs: nextDesigns,
      };
    }
    case "duplicateRegion": {
      const source = state.regions[action.index];
      if (!source) {
        return state;
      }
      const duplicateName = nextUniqueName(
        state.regions.map((region) => region.name),
        source.name
      );
      const duplicatedRegion: RegionSpec = {
        ...source,
        name: duplicateName,
        predecessor: null,
      };
      return {
        ...state,
        regions: [
          ...state.regions.slice(0, action.index + 1),
          duplicatedRegion,
          ...state.regions.slice(action.index + 1),
        ],
        designs: syncRegionMapsForNewRegion(
          state.designs,
          duplicateName,
          state.codon_maps[0]?.name ?? ""
        ),
      };
    }
    case "deleteRegion": {
      if (state.regions.length <= 1) {
        return state;
      }
      const removed = state.regions[action.index];
      if (!removed) {
        return state;
      }
      return {
        ...state,
        regions: state.regions
          .filter((_, index) => index !== action.index)
          .map((region) => ({
            ...region,
            predecessor:
              region.predecessor === removed.name ? null : region.predecessor,
          })),
        designs: removeRegionAcrossDesigns(state.designs, removed.name),
      };
    }
    case "updateDesign": {
      const nextDesigns = state.designs.map((design, index) =>
        index === action.index ? { ...design, [action.field]: action.value } : design
      );
      return {
        ...state,
        designs: syncDesignVersions(nextDesigns),
      };
    }
    case "updateDesignRegionMap": {
      return {
        ...state,
        designs: state.designs.map((design, index) =>
          index === action.designIndex
            ? {
                ...design,
                region_designs: {
                  ...design.region_designs,
                  [action.regionName]: action.codonMapName,
                },
              }
            : design
        ),
      };
    }
    case "duplicateDesign": {
      const source = state.designs[action.index];
      if (!source) {
        return state;
      }
      const nextDesigns = [
        ...state.designs.slice(0, action.index + 1),
        {
          ...source,
          region_designs: { ...source.region_designs },
        },
        ...state.designs.slice(action.index + 1),
      ];
      return {
        ...state,
        designs: syncDesignVersions(nextDesigns),
      };
    }
    case "deleteDesign": {
      if (state.designs.length <= 1) {
        return state;
      }
      return {
        ...state,
        designs: syncDesignVersions(
          state.designs.filter((_, index) => index !== action.index)
        ),
      };
    }
  }
}
