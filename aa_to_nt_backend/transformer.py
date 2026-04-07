from __future__ import annotations

import json
from dataclasses import dataclass

import pandas as pd

from aa_to_nt_backend.models import CodonMapSpec, DesignSpec, InputTag, RegionSpec
from aa_to_nt_backend.sequence_tools import (
    build_nucleotide_list,
    concatenate,
    fix_repeat_nucleotides,
    get_longest_run,
    get_reverse_complement,
    translate_wild_type_to_amino_acids,
)


@dataclass(frozen=True)
class RegionRuntime:
    spec: RegionSpec
    wild_type_amino_acids: str | None

    @property
    def wild_type_codons(self) -> tuple[str, ...]:
        wild_type = self.spec.wild_type
        if not wild_type:
            return ()
        return tuple(wild_type[index : index + 3] for index in range(0, len(wild_type), 3))


@dataclass(frozen=True)
class RegionDesignRuntime:
    region: RegionRuntime
    codon_map: CodonMapSpec

    def transform_series(self, data_frame: pd.DataFrame) -> pd.Series:
        if self.region.spec.constant_nt:
            return pd.Series([self.region.spec.wild_type] * len(data_frame), index=data_frame.index)
        amino_acid_values = [str(value) for value in data_frame[self.region.spec.name].tolist()]
        return pd.Series(
            [self.transform_amino_acids(value) for value in amino_acid_values],
            index=data_frame.index,
        )

    def transform_amino_acids(self, amino_acids: str) -> str:
        nucleotides = build_nucleotide_list(
            amino_acids,
            self.codon_map.as_dict(),
            wild_type=self.region.spec.wild_type or None,
            wild_type_amino_acids=self.region.wild_type_amino_acids,
        )
        nucleotide_sequence = concatenate(nucleotides)
        longest_length, _longest_run, longest_index = get_longest_run(nucleotide_sequence)
        fix_iteration = 0
        while longest_length >= 6 and fix_iteration < 7:
            fix_repeat_nucleotides(
                nucleotides,
                amino_acids,
                wild_type=self.region.spec.wild_type or None,
                wild_type_amino_acids=self.region.wild_type_amino_acids,
                longest_index=longest_index,
                longest_length=longest_length,
            )
            nucleotide_sequence = concatenate(nucleotides)
            longest_length, _longest_run, longest_index = get_longest_run(nucleotide_sequence)
            fix_iteration += 1
        if self.region.spec.reverse_complement:
            return get_reverse_complement(nucleotide_sequence)
        return nucleotide_sequence


@dataclass(frozen=True)
class DesignRuntime:
    spec: DesignSpec
    region_designs: tuple[RegionDesignRuntime, ...]
    super_region_designs: tuple[tuple[RegionDesignRuntime, ...], ...]

    def output_sheet_name(self) -> str:
        return f"Output_Design_{self.spec.id}"

    def transform(
        self,
        data_frame: pd.DataFrame,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        output_frame = data_frame.copy()
        annotation_frame = data_frame.copy()
        basic_frame = data_frame.copy()
        output_frame["outputDesignID"] = self.spec.id
        annotation_frame["outputDesignID"] = self.spec.id
        basic_frame["outputDesignID"] = self.spec.id
        basic_frame["outputDesignVersion"] = self.spec.version

        for super_region_design in self.super_region_designs:
            start_region = super_region_design[0].region.spec
            end_region = super_region_design[-1].region.spec
            super_region_name = build_super_region_name(super_region_design)
            output_column = f"v{self.spec.version}--{super_region_name}"
            annotation_column = f"v{self.spec.version}--{build_super_region_name(super_region_design, annotation=True)}"
            output_frame[output_column] = start_region.start_tail
            annotation_frame[annotation_column] = start_region.start_tail[
                len(start_region.start_tail) - start_region.custom_upstream_tail_annotation_length :
            ]

            for region_design in super_region_design:
                transformed = region_design.transform_series(data_frame)
                basic_frame[f"{region_design.region.spec.name}_nts"] = transformed
                output_frame[output_column] = output_frame[output_column] + transformed
                annotation_frame[annotation_column] = annotation_frame[annotation_column] + transformed

            output_frame[output_column] = output_frame[output_column] + end_region.end_tail
            annotation_frame[annotation_column] = (
                annotation_frame[annotation_column]
                + end_region.end_tail[: end_region.custom_downstream_tail_annotation_length]
            )

            if start_region.reverse_complement:
                output_frame[output_column] = pd.Series(
                    [
                        get_reverse_complement(str(value))
                        for value in output_frame[output_column].tolist()
                    ],
                    index=output_frame.index,
                )

        return output_frame, basic_frame, annotation_frame


def build_super_region_name(
    super_region_design: tuple[RegionDesignRuntime, ...],
    *,
    annotation: bool = False,
) -> str:
    base_name = "--".join(region_design.region.spec.name for region_design in super_region_design)
    if super_region_design[0].region.spec.reverse_complement and not annotation:
        return f"{base_name}_reverseComplement"
    return base_name


def build_super_regions(regions: tuple[RegionRuntime, ...]) -> tuple[tuple[RegionRuntime, ...], ...]:
    super_regions = [[region] for region in regions if region.spec.predecessor is None]
    successors = [region for region in regions if region.spec.predecessor is not None]
    while successors:
        found_successor = False
        for region in list(successors):
            for super_region in super_regions:
                if super_region[-1].spec.name == region.spec.predecessor:
                    super_region.append(region)
                    successors.remove(region)
                    found_successor = True
                    break
            if found_successor:
                break
        if not found_successor:
            raise ValueError("Regions contain a predecessor cycle or disjoint predecessor reference")
    return tuple(tuple(group) for group in super_regions)


def build_design_runtime(
    input_tag: InputTag,
) -> tuple[tuple[DesignRuntime, ...], tuple[RegionRuntime, ...]]:
    codon_maps_by_name = {codon_map.name: codon_map for codon_map in input_tag.codon_maps}
    regions = tuple(
        RegionRuntime(
            spec=region,
            wild_type_amino_acids=translate_wild_type_to_amino_acids(region.wild_type, region.length)
            if region.wild_type
            else None,
        )
        for region in input_tag.regions
    )
    regions_by_name = {region.spec.name: region for region in regions}
    super_regions = build_super_regions(regions)
    design_runtimes: list[DesignRuntime] = []

    for design in input_tag.designs:
        region_designs = tuple(
            RegionDesignRuntime(
                region=regions_by_name[region_name],
                codon_map=codon_maps_by_name[codon_map_name],
            )
            for region_name, codon_map_name in design.region_designs.items()
        )
        super_region_designs = tuple(
            tuple(
                next(region_design for region_design in region_designs if region_design.region == region)
                for region in super_region
            )
            for super_region in super_regions
        )
        design_runtimes.append(
            DesignRuntime(
                spec=design,
                region_designs=region_designs,
                super_region_designs=super_region_designs,
            )
        )
    return tuple(design_runtimes), regions


def transform_input_dataframe(
    data_frame: pd.DataFrame,
    input_tag: InputTag,
) -> dict[str, pd.DataFrame]:
    design_runtimes, regions = build_design_runtime(input_tag)
    input_columns = [str(column) for column in data_frame.columns.tolist()]
    output_sheets: dict[str, pd.DataFrame] = {}
    annotation_sheets: dict[str, pd.DataFrame] = {}
    basic_frames: list[pd.DataFrame] = []

    for design_runtime in design_runtimes:
        design_input_frame = data_frame.copy()
        if input_tag.design_column_name:
            design_input_frame = design_input_frame.loc[
                design_input_frame[input_tag.design_column_name] == design_runtime.spec.id
            ].copy()
        output_frame, basic_frame, annotation_frame = design_runtime.transform(design_input_frame)
        output_sheets[design_runtime.output_sheet_name()] = output_frame
        annotation_sheets[design_runtime.output_sheet_name()] = annotation_frame
        basic_frames.append(basic_frame)

    wide_frame = pd.concat(output_sheets.values(), ignore_index=True)
    wide_annotation_frame = pd.concat(annotation_sheets.values(), ignore_index=True)

    id_vars = [column for column in wide_frame.columns if column in input_columns + ["outputDesignID"]]
    value_vars = [column for column in wide_frame.columns if column not in id_vars]
    tall_frame = wide_frame.melt(
        id_vars=id_vars,
        value_vars=value_vars,
        var_name="version--region",
        value_name="output_sequence",
    )
    version_region_values = [str(value) for value in tall_frame["version--region"].tolist()]
    tall_frame["output_version"] = [value.split("--", 1)[0] for value in version_region_values]
    tall_frame["output_region"] = [value.split("--", 1)[1] for value in version_region_values]
    tall_frame = tall_frame.drop(columns=["version--region"])

    id_vars_annotation = [
        column
        for column in wide_annotation_frame.columns
        if column in input_columns + ["outputDesignID"]
    ]
    value_vars_annotation = [
        column for column in wide_annotation_frame.columns if column not in id_vars_annotation
    ]

    tall_region_frame = build_tall_region_frame(wide_frame, id_vars, value_vars)
    annotated_region_frame = build_tall_region_frame(
        wide_annotation_frame,
        id_vars_annotation,
        value_vars_annotation,
    )

    output_sheets["OUTPUT_ALL_region_version_cols"] = wide_frame
    output_sheets["OUTPUT_ALL_tall"] = tall_frame
    output_sheets["OUTPUT_ALL_region_cols"] = tall_region_frame
    output_sheets["OUTPUT_annotated"] = annotated_region_frame
    output_sheets["OUTPUT_basic_tall"] = pd.concat(basic_frames, ignore_index=True)
    output_sheets["Input_Regions"] = pd.DataFrame([region.spec.model_dump() for region in regions])
    output_sheets["Input_CodonMaps"] = (
        pd.DataFrame(
            {codon_map.name: codon_map.model_dump(exclude={"name"}) for codon_map in input_tag.codon_maps}
        )
        .reset_index()
        .rename(columns={"index": "AA"})
    )
    output_sheets["Input_Designs"] = pd.DataFrame(
        [
            {
                "id": design.id,
                "version": design.version,
                **design.region_designs,
            }
            for design in input_tag.designs
        ]
    )
    output_sheets["Input_tag"] = pd.DataFrame(
        [
            {
                "Input_tag": json.dumps(input_tag.model_dump(mode="json")),
            }
        ]
    )
    return output_sheets


def build_tall_region_frame(
    wide_frame: pd.DataFrame,
    id_vars: list[str],
    value_vars: list[str],
) -> pd.DataFrame:
    renamed_id_vars = {column: f"input__{column}" for column in id_vars}
    version_suffix_columns = {
        column: f"{column.split('--', 1)[1]}--{column.split('--', 1)[0]}"
        for column in value_vars
    }
    stub_names = list({column.split("--", 1)[1] for column in value_vars})
    tall_frame = pd.wide_to_long(
        wide_frame.rename(columns=renamed_id_vars).rename(columns=version_suffix_columns),
        stubnames=stub_names,
        i=list(renamed_id_vars.values()),
        j="output_version",
        sep="--v",
    ).reset_index()
    reverse_id_vars = {renamed: original for original, renamed in renamed_id_vars.items()}
    return tall_frame.rename(columns=reverse_id_vars).dropna()
