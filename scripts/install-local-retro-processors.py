"""Install the vendored REA Retro processor data into an explicit local Ghidra."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ghidra', type=Path, required=True)
parser.add_argument('--java-home', type=Path, required=True)
args = parser.parse_args()
ghidra = args.ghidra.resolve()
java = args.java_home.resolve() / 'bin' / ('java.exe' if __import__('os').name == 'nt' else 'java')
assert (ghidra / 'Ghidra/application.properties').is_file(), 'Choose an extracted Ghidra distribution'
assert java.is_file(), 'Choose a full JDK installation'
source = Path(__file__).resolve().parents[1] / 'third_party/retro-processors'
classpath = []
for name in ['SoftwareModeling', 'Generic', 'Utility']:
    classpath.extend((ghidra / 'Ghidra/Framework' / name / 'lib').glob('*.jar'))
assert classpath, 'Ghidra framework libraries are missing'
import os
for module in ['REA65816', 'REA6800', 'REA8080', 'REA6510']:
    destination = ghidra / 'Ghidra/Processors' / module
    for file in (source / module).rglob('*'):
        if not file.is_file():
            continue
        target = destination / file.relative_to(source / module)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            previous = target.read_bytes()
            if previous == file.read_bytes():
                continue
            backup = target.with_name(target.name + '.backup-' + hashlib.sha256(previous).hexdigest()[:12])
            if not backup.exists():
                backup.write_bytes(previous)
        shutil.copyfile(file, target)
    subprocess.run([str(java), '-Xmx2048M', '-cp', os.pathsep.join(map(str, classpath)),
                    'ghidra.pcodeCPort.slgh_compile.SleighCompile', '-a',
                    str(destination / 'data/languages')], check=True)
    print('Installed and compiled:', module)
print('Restart any running Ghidra process to load these definitions.')
