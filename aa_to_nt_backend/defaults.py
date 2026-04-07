from __future__ import annotations

from aa_to_nt_backend.constants import DEFAULT_CODON_MAPS, DEFAULT_REGIONS
from aa_to_nt_backend.models import CodonMapSpec, DesignSpec, InputTag, RegionSpec


def build_default_input_tag() -> InputTag:
    codon_maps = tuple(
        CodonMapSpec.model_validate(value) for value in DEFAULT_CODON_MAPS
    )
    regions = tuple(RegionSpec.model_validate(value) for value in DEFAULT_REGIONS)
    default_design = DesignSpec(
        id="ID1",
        version=0,
        region_designs={region.name: codon_maps[0].name for region in regions},
    )
    return InputTag(
        codon_maps=codon_maps,
        regions=regions,
        designs=(default_design,),
        design_column_name="",
    )
