import type { RawBinaryAdmission } from "../domain/rawBinary.js";

/** Bound Ghidra language for a caller-supplied raw-binary architecture. */
export interface GhidraRawBinaryLanguage {
  readonly languageId: string;
  readonly compilerSpecId: "default" | "gcc";
  readonly defaultAddressSpace: "ram" | "RAM" | "bus";
  readonly limitations?: readonly string[];
}

/**
 * Map caller-visible CPU families to generic Ghidra languages with a
 * supported generic compiler specification. These are analysis conventions,
 * not evidence of the target's original compiler. Each family has one fixed
 * byte order: m68k, 6800 and 6809 are big-endian; the others are little-endian. Big-endian
 * ARM, Thumb-only, Cortex-M, and other processor variants are out of scope.
 */
export const ghidraRawBinaryLanguage = (
  architecture: RawBinaryAdmission["architecture"],
): GhidraRawBinaryLanguage => {
  switch (architecture) {
    case "65c02":
      return {
        languageId: "65C02:LE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "RAM",
      };
    case "65816":
      return {
        languageId: "65816:LE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "bus",
        limitations: [
          "65816 uses the experimental kaayzouee community module with a 24-bit bus despite its historical 16-bit language ID. Entry context is native M=0, X=0, E=0; initial PBR follows the entry bank. Other initial modes are not inferred. REP/SEP mode tracking is supported by the module, but PLP/RTI/XCE and bank-wrap behavior need independent review; p-code is not fully validated.",
        ],
      };
    case "8080":
      return {
        languageId: "8080:LE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "ram",
        limitations: [
          "8080 uses a local language derived from Ghidra 12.1.4's 8085 specification with RIM/SIM and 8085-only interrupt vectors removed. Undocumented opcodes and exact flag semantics are not validated.",
        ],
      };
    case "6800":
      return {
        languageId: "MC6800:BE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "RAM",
        limitations: [
          "6800 uses the Apache-2.0 sigurasg/GhidraMC6800 community processor module, selecting MC6800 rather than 6801 or 6809.",
        ],
      };
    case "z80":
      return {
        languageId: "z80:LE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "ram",
      };
    case "6809":
      return {
        languageId: "6809:BE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "RAM",
      };
    case "6502":
      return {
        languageId: "6502:LE:16:default",
        compilerSpecId: "default",
        defaultAddressSpace: "RAM",
      };
    case "m68k":
      // Ghidra's default 68000 language decodes the 68040 superset; no
      // MC68000-only variant is declared in the 68000 processor module.
      return {
        languageId: "68000:BE:32:default",
        compilerSpecId: "default",
        defaultAddressSpace: "ram",
      };
    case "x86":
      return {
        languageId: "x86:LE:32:default",
        compilerSpecId: "gcc",
        defaultAddressSpace: "ram",
      };
    case "x86_64":
      return {
        languageId: "x86:LE:64:default",
        compilerSpecId: "gcc",
        defaultAddressSpace: "ram",
      };
    case "arm":
      return {
        languageId: "ARM:LE:32:v7",
        compilerSpecId: "default",
        defaultAddressSpace: "ram",
      };
    case "arm64":
      return {
        languageId: "AARCH64:LE:64:v8A",
        compilerSpecId: "default",
        defaultAddressSpace: "ram",
      };
  }
};
