# MOS 6510 / 8500 local processor definitions

Derived from the Apache-2.0 Ghidra 12.1.4 6502 specification:
https://github.com/NationalSecurityAgency/ghidra/tree/Ghidra_12.1.4_build/Ghidra/Processors/6502/data/languages

6502.slaspec and 6502.cspec are unchanged. New language identities and processor
specifications add volatile byte symbols CPU_PORT_DDR ($0000) and CPU_PORT_DATA
($0001), while retaining zero-page, stack and interrupt vector descriptions.
This models static instruction analysis and volatile accesses, not the six-bit
port's electrical behavior, C64 bank switching, undocumented opcodes, or timing.

Register assignments: Commodore 64 Programmer's Reference Guide, page 320:
https://www.devili.iki.fi/Computers/Commodore/C64/Programmers_Reference/Chapter_5/page_320.html
MOS 6510 data sheet:
https://datasheet4u.com/pdf-down/6/5/1/6510-Commodore.pdf
CPU instruction-set reference from the VICE project:
https://github.com/VICE-Team/svn-mirror/tree/main/vice/doc
