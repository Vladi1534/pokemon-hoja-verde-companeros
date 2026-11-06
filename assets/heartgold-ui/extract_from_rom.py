#!/usr/bin/env python3
"""Decode selected HeartGold UI graphics from an owner-supplied ROM as data.

Usage: python extract_from_rom.py path/to/game.nds --output ./output
The source is never executed. Only PNG resources, manifests and JS are emitted.
Requires Pillow. Does not download a game or reproduce a ROM.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import io
import json
import struct
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw

U16 = lambda b, p: struct.unpack_from('<H', b, p)[0]
U32 = lambda b, p: struct.unpack_from('<I', b, p)[0]

def sections(blob):
    p = U16(blob, 12)
    while p + 8 <= len(blob):
        size = U32(blob, p + 4)
        if size < 8 or p + size > len(blob):
            raise ValueError('Invalid Nitro section length')
        yield blob[p:p+4], blob[p:p+size]
        p += size

def section(blob, magic):
    return next(data for name, data in sections(blob) if name == magic)

def nitro_files(rom):
    fntoff, fntsize, fatoff, fatsize = struct.unpack_from('<4I', rom, 0x40)
    fnt = rom[fntoff:fntoff+fntsize]
    entries = {}
    def walk(did, path):
        p, fid, _ = struct.unpack_from('<IHH', fnt, (did & 0xfff)*8)
        while fnt[p]:
            flag = fnt[p]
            p += 1
            name = fnt[p:p+(flag & 127)].decode('ascii')
            p += flag & 127
            if flag & 128:
                sub = U16(fnt, p)
                p += 2
                walk(sub, path + name + '/')
            else:
                start, end = struct.unpack_from('<II', rom, fatoff+fid*8)
                if start > end or end > len(rom):
                    raise ValueError('Invalid NitroFS extent')
                entries[path+name] = (start, end)
                fid += 1
    walk(0xf000, '')
    return entries

def narc(blob):
    fat, data = section(blob, b'BTAF'), section(blob, b'GMIF')
    return [data[8+U32(fat,12+i*8):8+U32(fat,16+i*8)] for i in range(U16(fat,8))]

def palette(blob):
    s = section(blob, b'TTLP')
    start, size = 8 + U32(s, 20), U32(s, 16)
    vals = struct.unpack('<' + 'H'*(size//2), s[start:start+size])
    return [((c & 31)*255//31, ((c >> 5) & 31)*255//31, ((c >> 10) & 31)*255//31, 255) for c in vals]

def characters(blob):
    s = section(blob, b'RAHC')
    depth = 4 if U32(s, 12) == 3 else 8
    start, size = 8 + U32(s, 28), U32(s, 24)
    return s[start:start+size], depth

def tile(data, depth, tid, pal, bank=0, transparent=True):
    unit = 32 if depth == 4 else 64
    chunk = data[tid*unit:(tid+1)*unit]
    out = Image.new('RGBA', (8,8))
    if len(chunk) != unit:
        return out
    vals = [p for v in chunk for p in (v & 15, v >> 4)] if depth == 4 else list(chunk)
    out.putdata([(0,0,0,0) if v == 0 and transparent else pal[(v + (bank*16 if depth == 4 else 0)) % len(pal)] for v in vals])
    return out

def cell(ncgr, nclr, ncer, index):
    data, depth = characters(ncgr)
    pal, s = palette(nclr), section(ncer, b'KBEC')
    count, kind = U16(s, 8), U16(s, 10)
    if index >= count:
        raise IndexError(index)
    table, entry = 8 + U32(s, 12), 16 if kind else 8
    pos = table + entry*count + U32(s, table+index*entry+4)
    shapes = [[(8,8),(16,16),(32,32),(64,64)],[(16,8),(32,8),(32,16),(64,32)],[(8,16),(8,32),(16,32),(32,64)]]
    objs = []
    for i in range(U16(s, table+index*entry)):
        a, b, c = struct.unpack_from('<HHH', s, pos+i*6)
        x, y = b & 511, a & 255
        x = x-512 if x >= 256 else x
        y = y-256 if y >= 128 else y
        shape, size = a >> 14, b >> 14
        if shape > 2:
            continue
        w, h = shapes[shape][size]
        img = Image.new('RGBA', (w,h))
        for n in range(w*h//64):
            img.alpha_composite(tile(data, depth, (c & 1023)+n, pal, c >> 12), ((n % (w//8))*8,(n//(w//8))*8))
        if b & 4096:
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if b & 8192:
            img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        objs.append((x,y,img))
    if not objs:
        return Image.new('RGBA',(1,1))
    x0,y0 = min(x for x,y,img in objs),min(y for x,y,img in objs)
    x1,y1 = max(x+img.width for x,y,img in objs),max(y+img.height for x,y,img in objs)
    out = Image.new('RGBA',(x1-x0,y1-y0))
    for x,y,img in reversed(objs):
        out.alpha_composite(img,(x-x0,y-y0))
    return out

def item_icon(ncgr, nclr):
    data, depth = characters(ncgr)
    pal = palette(nclr)
    img = Image.new('RGBA',(32,32))
    for n in range(16):
        img.alpha_composite(tile(data,depth,n,pal),((n%4)*8,(n//4)*8))
    return img

def screen(ncgr,nclr,nscr):
    data,depth = characters(ncgr)
    pal,s = palette(nclr),section(nscr,b'NRCS')
    w,h = U16(s,8),U16(s,10)
    img = Image.new('RGBA',(w,h))
    for n in range(w*h//64):
        v = U16(s,20+n*2)
        t = tile(data,depth,v&1023,pal,v>>12)
        if v & 1024:
            t = t.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if v & 2048:
            t = t.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        img.alpha_composite(t,((n%(w//8))*8,(n//(w//8))*8))
    return img

ITEMS = {
    'ball':(8,9),'superball':(6,7),'ultraball':(4,5),'masterball':(2,3),
    'potion':(24,25),'superpotion':(24,37),'hyperpotion':(24,36),
    'antidote':(26,27),'fullheal':(38,39),'revive':(40,42),
    'firestone':(119,120),'waterstone':(123,124),'thunderstone':(121,122),
    'leafstone':(125,126),'moonstone':(117,118),'repel':(109,114),
    'rareCandy':(90,91),'ether':(58,59),'oldrod':(353,354),
    'goodrod':(355,356),'superrod':(357,358),'bicycle':(437,438),
    'map':(439,440),'card_key':(767,768),
    'hm01':(414,402),'hm02':(414,413),'hm03':(414,400),
    'hm04':(414,402),'hm05':(414,400),'hm06':(414,398),'tm01':(397,398),
}
ALIASES = {
    'pokeball':'ball','greatball':'superball','rare_candy':'rareCandy',
    'cut':'hm01','fly':'hm02','surf':'hm03','surf_lesson':'hm03',
    'strength':'hm04','flash':'hm05','rocksmash':'hm06','rod':'oldrod','cardkey':'card_key'
}
POCKETS = {'medicine':0,'items':1,'balls':2,'machines':3,'berries':4,'mail':5,'battle':6,'key':7}
ARROWS = {'left':12,'right':13,'up':25,'down':27}
FRAMES = {'tab':8,'item':10,'selection':11,'button':17}

def build(rom, source, out):
    out.mkdir(parents=True,exist_ok=True)
    files = nitro_files(rom)
    bagblob,itemblob,cardblob = [rom[s:e] for s,e in (files[p] for p in ('a/0/1/5','a/0/1/8','a/0/4/9'))]
    bag,items,card = narc(bagblob),narc(itemblob),narc(cardblob)
    obj = {'bag':None,'bagFemale':None,'pockets':{},'items':{},'arrows':{},'frames':{}}
    dims,sources,previews = {},{},[]
    def emit(key,img,filename,ref):
        path = out / filename
        path.parent.mkdir(parents=True,exist_ok=True)
        img.save(path)
        dims[key] = list(img.size)
        sources[key] = ref
        previews.append((key,img))
        return 'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
    for key,gr,pl,ce,filename in [('bag',2,3,1,'bag.png'),('bagFemale',33,34,32,'bag-female.png')]:
        obj[key] = emit(key,cell(bag[gr],bag[pl],bag[ce],0),filename,{'archive':'a/0/1/5','ncgr':gr,'nclr':pl,'ncer':ce,'cell':0})
    for cat,mapping in [('pockets',POCKETS),('arrows',ARROWS),('frames',FRAMES)]:
        for key,idx in mapping.items():
            obj[cat][key] = emit(cat+'.'+key,cell(bag[51],bag[47],bag[49],idx),f'png/{cat}/{key}.png',{'archive':'a/0/1/5','ncgr':51,'nclr':47,'ncer':49,'cell':idx})
    for key,(gr,pl) in ITEMS.items():
        obj['items'][key] = emit('items.'+key,item_icon(items[gr],items[pl]),f'png/items/{key}.png',{'archive':'a/0/1/8','ncgr':gr,'nclr':pl})
    for alias,target in ALIASES.items():
        obj['items'][alias] = obj['items'][target]
    obj['dimensions'] = dims
    (out/'hg-ui-assets.js').write_text('// HeartGold graphics decoded from the archive supplied by the project owner. See HG-UI-CREDITS.md.\nconst HG_UI='+json.dumps(obj,separators=(',',':'))+';\n')
    portraits={}
    for key,scr in [('ethan',54),('lyra',55)]:
        img = screen(card[44],card[0],card[scr])
        bbox=img.getbbox()
        if bbox:
            img=img.crop(bbox)
        portraits[key] = emit('portraits.'+key,img,f'portraits/{key}.png',{'archive':'a/0/4/9','ncgr':44,'nclr':0,'nscr':scr,'crop':bbox})
    (out/'hg-portraits.js').write_text('// Ethan and Lyra trainer-card portraits, HeartGold. See HG-UI-CREDITS.md.\nObject.assign(HG_UI,{portraits:'+json.dumps(portraits,separators=(',',':'))+'});\n')
    manifest={'sourceFilename':source,'romSha256':hashlib.sha256(rom).hexdigest(),'romHeaderTitle':rom[:12].rstrip(b'\0').decode('ascii'),'romGameCode':rom[12:16].decode('ascii'),'romBytes':len(rom),'archives':{p:hashlib.sha256(blob).hexdigest() for p,blob in [('a/0/1/5',bagblob),('a/0/1/8',itemblob),('a/0/4/9',cardblob)]},'sources':sources,'dimensions':dims,'aliases':ALIASES,'note':'Only decoded graphics; no executable ROM or story scripts included. flash is a retained application alias to HM05, not an assertion that HG HM05 teaches Flash.'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    # A labelled verification sheet is a development-only artifact.
    pw,ph,cols=168,160,6
    sheet=Image.new('RGB',(pw*cols,ph*((len(previews)+cols-1)//cols)), '#e6e9ec')
    draw=ImageDraw.Draw(sheet)
    for n,(key,img) in enumerate(previews):
        x,y=(n%cols)*pw,(n//cols)*ph
        draw.text((x+4,y+4),key,fill='#203248')
        scale=min(2,128/max(img.size))
        pic=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),Image.Resampling.NEAREST)
        sheet.paste(pic,(x+(pw-pic.width)//2,y+22),pic)
    sheet.save(out/'contact-sheet.png')
    print(json.dumps({'bundleBytes':(out/'hg-ui-assets.js').stat().st_size,'uniqueImages':len(previews),'itemKeys':len(obj['items']),'output':str(out)}))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path)
    parser.add_argument('--output',type=Path,default=Path('deliverable'))
    args=parser.parse_args()
    if zipfile.is_zipfile(args.source):
        with zipfile.ZipFile(args.source) as z:
            nds=[x for x in z.infolist() if x.filename.lower().endswith('.nds')]
            if len(nds)!=1:
                raise ValueError('Expected exactly one NDS file')
            rom=z.read(nds[0])
            source=args.source.name+' / '+nds[0].filename
    else:
        rom=args.source.read_bytes()
        source=args.source.name
    build(rom,source,args.output)

if __name__=='__main__':
    main()
