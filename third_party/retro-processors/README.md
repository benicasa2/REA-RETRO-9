# Local processor modules

The REA Retro extension uses Ghidra's built-in 65C02 language and these separately
installed data-only processor modules. No Java plugin, network downloader or loader
is installed by these modules.

- REA65816: MIT, kaayzouee/ghidra-65816 commit dbe194026a4b810e9224cc9a4092de2798c67866.
  Local fix removes the invalid cspec prototype type attribute for Ghidra 12.1.4.
  Historical language ID 65816:LE:16:default; actual default bus space is 24-bit.
- REA6800: Apache-2.0, sigurasg/GhidraMC6800 commit 713ae0232f6e2f67b67d6ea0cf9b4e7f6864a6b2.
  Only the MC6800 language and dependencies are selected.
- REA8080: Apache-2.0, derived from the official Ghidra 12.1.4 8085 specification.
  Removes RIM/SIM, their userops and 8085-only interrupt vectors. It deliberately
  does not bind 8080 inputs to the Z80 or unmodified 8085 language. Undocumented
  instructions and exact P-code flag behavior are not validated.

Each folder retains its LICENSE and ORIGIN.md. Generated .sla binaries are kept
only in the local Ghidra installation. The REA package does not auto-install them.

From the repository root, explicitly install into your existing Ghidra:

```powershell
python scripts/install-local-retro-processors.py --ghidra C:\tools\ghidra_12.1.4_PUBLIC --java-home C:\tools\jdk-25
```

The installer copies into new REA-prefixed module directories, backs up differing
files, compiles with Ghidra's own SLEIGH compiler, and is idempotent. It neither
installs Ghidra/Java nor changes any global environment variables.

65816 decoding starts in native mode with 16-bit accumulator and index registers.
REP/SEP tracking is supplied by the community module; other initial modes are not
inferred. PLP/RTI/XCE, bank wrapping, data-bank/direct-page state and P-code results
require independent review. This is static CPU analysis, not SNES or IIgs emulation.
