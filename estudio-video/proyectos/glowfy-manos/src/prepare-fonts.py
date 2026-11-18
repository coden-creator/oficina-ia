"""Materialize local variable-font instances for Skia, which ignores wght here.
The source OFL font is unchanged; generated files remain in ignored cache.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
root=Path(__file__).resolve().parents[1]
source=root.parents[1]/'assets/fonts/Montserrat/Montserrat[wght].ttf'
dest=root/'cache/fonts';dest.mkdir(parents=True,exist_ok=True)
for weight in (400,500,600,700):
    out=dest/f'Montserrat-{weight}.ttf'
    if not out.exists():
        font=instantiateVariableFont(TTFont(source),{'wght':weight},inplace=True)
        font.save(out)
