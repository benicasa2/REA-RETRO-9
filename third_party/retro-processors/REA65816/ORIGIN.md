Source: https://github.com/kaayzouee/ghidra-65816
Commit: dbe194026a4b810e9224cc9a4092de2798c67866
MIT license. Local compatibility fix: remove unsupported prototype type="unknown" attribute from 65816.cspec for Ghidra 12.1.4. SLEIGH sources unchanged. Language ID says 16 but default bus space is 24-bit. Default context is native 16-bit M/X (ctx_EF/MF/XF=0).
