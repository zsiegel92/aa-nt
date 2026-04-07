from __future__ import annotations

import re
from typing import Iterable

from aa_to_nt_backend.constants import (
    AMINO_ACID_TO_CODONS,
    CODON_TO_AMINO_ACID,
    NUCLEOTIDE_COMPLEMENTS,
)


def get_reverse_complement(nucleotides: str) -> str:
    return "".join(NUCLEOTIDE_COMPLEMENTS[nucleotide] for nucleotide in reversed(nucleotides))


def get_longest_run(sequence: str) -> tuple[int, str, int]:
    if not sequence:
        return 0, "", -1
    longest = max(
        (substring for character in set(sequence) for substring in re.findall(f"{character}+", sequence)),
        key=len,
    )
    return len(longest), longest, sequence.index(longest)


def build_nucleotide_list(
    amino_acids: str,
    codon_map: dict[str, str],
    *,
    wild_type: str | None,
    wild_type_amino_acids: str | None,
) -> list[str]:
    nucleotides: list[str] = []
    for index, amino_acid in enumerate(amino_acids):
        if wild_type and wild_type_amino_acids and amino_acid == wild_type_amino_acids[index]:
            nucleotides.append(wild_type[index * 3 : (index * 3) + 3])
        else:
            nucleotides.append(codon_map[amino_acid])
    return nucleotides


def swap_codon_inplace(nucleotides: list[str], amino_acid_index: int, amino_acid: str | None) -> None:
    resolved_amino_acid = amino_acid or CODON_TO_AMINO_ACID[nucleotides[amino_acid_index].upper()]
    current_codon = nucleotides[amino_acid_index].upper()
    codons = AMINO_ACID_TO_CODONS[resolved_amino_acid]
    next_index = (codons.index(current_codon) + 1) % len(codons)
    replacement = codons[next_index]
    nucleotides[amino_acid_index] = replacement


def fix_repeat_nucleotides(
    nucleotides: list[str],
    amino_acids: str,
    *,
    wild_type: str | None,
    wild_type_amino_acids: str | None,
    longest_index: int,
    longest_length: int,
) -> None:
    amino_acid_index = (longest_index // 3) + ((3 - longest_index) % 3)
    amino_acid = amino_acids[amino_acid_index]
    if wild_type_amino_acids is not None and amino_acid == wild_type_amino_acids[amino_acid_index]:
        if (longest_index % 3) in {1, 2} and amino_acid_index > 0:
            amino_acid_index -= 1
            amino_acid = amino_acids[amino_acid_index]
        while (
            amino_acid_index < len(amino_acids) - 1
            and amino_acid == wild_type_amino_acids[amino_acid_index]
            and ((amino_acid_index * 3) + 2) < (longest_index + longest_length - 1)
        ):
            amino_acid_index += 1
            amino_acid = amino_acids[amino_acid_index]
    swap_codon_inplace(nucleotides, amino_acid_index, amino_acid)


def translate_wild_type_to_amino_acids(wild_type: str, expected_length: int) -> str | None:
    if not wild_type or len(wild_type) % 3 != 0:
        return None
    codons = (wild_type[index : index + 3].upper() for index in range(0, len(wild_type), 3))
    translated = "".join(CODON_TO_AMINO_ACID[codon] for codon in codons)
    return translated if len(translated) == expected_length else None


def concatenate(parts: Iterable[str]) -> str:
    return "".join(parts)
