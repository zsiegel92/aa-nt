from __future__ import annotations

import base64
from typing import Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)

from aa_to_nt_backend.constants import AMINO_ACID_TO_CODONS


class CodonMapSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    A: str
    C: str
    D: str
    E: str
    F: str
    G: str
    H: str
    I: str
    K: str
    L: str
    M: str
    N: str
    P: str
    Q: str
    R: str
    S: str
    T: str
    V: str
    W: str
    Y: str

    @field_validator(
        "A",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "K",
        "L",
        "M",
        "N",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "V",
        "W",
        "Y",
    )
    @classmethod
    def validate_codon(cls, value: str, info: ValidationInfo) -> str:
        if info.field_name is None:
            raise ValueError("Missing field metadata")
        normalized = value.upper()
        if normalized not in AMINO_ACID_TO_CODONS[info.field_name]:
            raise ValueError(f"{normalized} is not valid for {info.field_name}")
        return normalized

    def codon_for(self, amino_acid: str) -> str:
        return getattr(self, amino_acid)

    def as_dict(self) -> dict[str, str]:
        return self.model_dump()


class RegionSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    length: int = Field(ge=0)
    substitution: bool
    wild_type: str = ""
    predecessor: str | None = None
    start_tail: str = ""
    end_tail: str = ""
    reverse_complement: bool = False
    constant_nt: bool = False
    has_custom_upstream_tail_annotation_length: bool = False
    has_custom_downstream_tail_annotation_length: bool = False
    custom_upstream_tail_annotation_length: int = Field(default=0, ge=0)
    custom_downstream_tail_annotation_length: int = Field(default=0, ge=0)

    @field_validator("wild_type", "start_tail", "end_tail")
    @classmethod
    def normalize_sequence(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_lengths(self) -> Self:
        if self.constant_nt and len(self.wild_type) % 3 != 0:
            raise ValueError(
                "constant_nt regions require wild_type length divisible by 3"
            )
        if self.constant_nt and len(self.wild_type) // 3 != self.length:
            raise ValueError(
                "constant_nt region length must match wild_type codon count"
            )
        if (
            self.substitution
            and self.wild_type
            and len(self.wild_type) != self.length * 3
        ):
            raise ValueError("substitution wild_type length must equal length * 3")
        return self


class DesignSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=100)
    version: int = Field(ge=0)
    region_designs: dict[str, str]


class InputTag(BaseModel):
    model_config = ConfigDict(extra="forbid")

    codon_maps: tuple[CodonMapSpec, ...]
    regions: tuple[RegionSpec, ...]
    designs: tuple[DesignSpec, ...]
    design_column_name: str = ""

    @model_validator(mode="after")
    def validate_names(self) -> Self:
        codon_map_names = [codon_map.name for codon_map in self.codon_maps]
        if len(set(codon_map_names)) != len(codon_map_names):
            raise ValueError("Codon map names must be unique")

        region_names = [region.name for region in self.regions]
        if len(set(region_names)) != len(region_names):
            raise ValueError("Region names must be unique")

        region_name_set = set(region_names)
        codon_map_name_set = set(codon_map_names)

        for region in self.regions:
            if region.predecessor and region.predecessor not in region_name_set:
                raise ValueError(f"Unknown predecessor {region.predecessor!r}")

        if not self.designs:
            raise ValueError("At least one design is required")

        for design in self.designs:
            if set(design.region_designs) != region_name_set:
                raise ValueError("Each design must map every region exactly once")
            unknown_codon_maps = (
                set(design.region_designs.values()) - codon_map_name_set
            )
            if unknown_codon_maps:
                raise ValueError(
                    f"Design {design.id!r} references unknown codon maps: "
                    f"{sorted(unknown_codon_maps)!r}"
                )
        return self


class TransformWorkbookRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input_file_name: str = Field(min_length=1)
    input_file_media_type: str = Field(min_length=1)
    input_file_base64: str = Field(min_length=1)
    input_tag: InputTag
    input_share_url: str | None = None

    def decoded_file_bytes(self) -> bytes:
        return base64.b64decode(self.input_file_base64)


class TransformWorkbookResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    output_file_name: str
    output_file_media_type: str
    output_file_base64: str


class LoginCredentials(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str
