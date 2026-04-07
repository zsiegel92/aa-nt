import type { CodonMapSpec } from "@/api/client";

export type AminoAcidCode = Exclude<keyof CodonMapSpec, "name">;

type AminoAcidMetadata = {
  code: AminoAcidCode;
  name: string;
  abbreviation: string;
  codons: readonly string[];
};

export const codonFrequencyColors = [
  "#006605",
  "#00b309",
  "#00e60c",
  "#4dff56",
  "#80ff86",
  "#99ff9e",
] as const;

export const aminoAcidMetadata: readonly AminoAcidMetadata[] = [
  {
    code: "A",
    name: "Alanine",
    abbreviation: "Ala",
    codons: ["GCC", "GCT", "GCA", "GCG"],
  },
  { code: "C", name: "Cysteine", abbreviation: "Cys", codons: ["TGC", "TGT"] },
  {
    code: "D",
    name: "Aspartic acid",
    abbreviation: "Asp",
    codons: ["GAC", "GAT"],
  },
  {
    code: "E",
    name: "Glutamic acid",
    abbreviation: "Glu",
    codons: ["GAG", "GAA"],
  },
  {
    code: "F",
    name: "Phenylalanine",
    abbreviation: "Phe",
    codons: ["TTC", "TTT"],
  },
  {
    code: "G",
    name: "Glycine",
    abbreviation: "Gly",
    codons: ["GGC", "GGA", "GGG", "GGT"],
  },
  { code: "H", name: "Histidine", abbreviation: "His", codons: ["CAC", "CAT"] },
  {
    code: "I",
    name: "Isoleucine",
    abbreviation: "Ile",
    codons: ["ATC", "ATT", "ATA"],
  },
  { code: "K", name: "Lysine", abbreviation: "Lys", codons: ["AAG", "AAA"] },
  {
    code: "L",
    name: "Leucine",
    abbreviation: "Leu",
    codons: ["CTG", "CTC", "CTT", "TTG", "CTA", "TTA"],
  },
  { code: "M", name: "Methionine", abbreviation: "Met", codons: ["ATG"] },
  {
    code: "N",
    name: "Asparagine",
    abbreviation: "Asn",
    codons: ["AAC", "AAT"],
  },
  {
    code: "P",
    name: "Proline",
    abbreviation: "Pro",
    codons: ["CCC", "CCT", "CCA", "CCG"],
  },
  { code: "Q", name: "Glutamine", abbreviation: "Gln", codons: ["CAG", "CAA"] },
  {
    code: "R",
    name: "Arginine",
    abbreviation: "Arg",
    codons: ["CGG", "AGG", "AGA", "CGC", "CGA", "CGT"],
  },
  {
    code: "S",
    name: "Serine",
    abbreviation: "Ser",
    codons: ["AGC", "TCC", "TCT", "TCA", "AGT", "TCG"],
  },
  {
    code: "T",
    name: "Threonine",
    abbreviation: "Thr",
    codons: ["ACC", "ACA", "ACT", "ACG"],
  },
  {
    code: "V",
    name: "Valine",
    abbreviation: "Val",
    codons: ["GTG", "GTC", "GTT", "GTA"],
  },
  { code: "W", name: "Tryptophan", abbreviation: "Trp", codons: ["TGG"] },
  { code: "Y", name: "Tyrosine", abbreviation: "Tyr", codons: ["TAC", "TAT"] },
] as const;

export const aminoAcidMetadataByCode = new Map(
  aminoAcidMetadata.map((entry) => [entry.code, entry]),
);

export const reverseCodonLookup = Object.fromEntries(
  aminoAcidMetadata.flatMap((entry) =>
    entry.codons.flatMap((codon) => [
      [codon, entry.code],
      [codon.toLowerCase(), entry.code.toLowerCase()],
    ]),
  ),
);

export function translateWildTypeNucleotides(
  nucleotides: string,
  totalLength?: number,
): string {
  const paddedNucleotides =
    totalLength === undefined
      ? nucleotides
      : `${nucleotides}${"_".repeat(Math.max(totalLength * 3 - nucleotides.length, 0))}`;

  const translatedCodons: string[] = [];
  for (let index = 0; index < paddedNucleotides.length; index += 3) {
    const codon = paddedNucleotides.slice(index, index + 3);
    if (codon.length < 3) {
      break;
    }
    translatedCodons.push(reverseCodonLookup[codon] ?? "?");
  }
  return translatedCodons.join("");
}
