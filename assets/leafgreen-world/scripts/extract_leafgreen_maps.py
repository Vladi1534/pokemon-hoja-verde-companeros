#!/usr/bin/env python3
"""Read-only FRLG map extraction. Never executes, modifies or copies the input ROM.

Uses pret/pokefirered for symbol names / table lengths; all numeric map data and
PNG pixels are read from the supplied ROM. Locates the group table by exact
PalletTown block-data fingerprint, then verifies all 425 headers.
"""
from __future__ import annotations
import argparse, base64, collections, hashlib, json, re, struct, subprocess, zipfile
from pathlib import Path
from PIL import Image, ImageDraw

BASE = 0x08000000
DIRS = {1:'down',2:'up',3:'left',4:'right',5:'dive',6:'emerge'}

def dump(path, data, pretty=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2 if pretty else None,
                               separators=None if pretty else (',',':'))+'\n')

class Rom:
    def __init__(self, path):
        if zipfile.is_zipfile(path):
            with zipfile.ZipFile(path) as z:
                names=[n for n in z.namelist() if n.lower().endswith('.gba')]
                if len(names)!=1: raise ValueError('Expected exactly one GBA file in ZIP')
                self.data=z.read(names[0]); self.filename=names[0]
        else: self.data=path.read_bytes(); self.filename=path.name
    def u8(self,p): return self.data[p]
    def u16(self,p): return struct.unpack_from('<H',self.data,p)[0]
    def s16(self,p): return struct.unpack_from('<h',self.data,p)[0]
    def u32(self,p): return struct.unpack_from('<I',self.data,p)[0]
    def s32(self,p): return struct.unpack_from('<i',self.data,p)[0]
    def ptr(self,p,nullable=False):
        n=self.u32(p)
        if n==0 and nullable:return None
        if not BASE<=n<BASE+len(self.data):raise ValueError(f'Invalid ROM pointer {n:#x} at {p:#x}')
        return n-BASE
    def hits(self,word):
        start=0
        while True:
            p=self.data.find(word,start)
            if p<0:return
            yield p;start=p+1
    def refs(self,p): return self.hits(struct.pack('<I',BASE+p))
    def lz77(self,p):
        if self.data[p]!=0x10:raise ValueError(f'Unsupported compression at {p:#x}')
        size=int.from_bytes(self.data[p+1:p+4],'little');p+=4;out=bytearray()
        while len(out)<size:
            flags=self.u8(p);p+=1
            for bit in range(7,-1,-1):
                if flags & (1<<bit):
                    a,b=self.data[p:p+2];p+=2;distance=((a&15)<<8|b)+1
                    for _ in range((a>>4)+3):out.append(out[-distance])
                else:out.append(self.u8(p));p+=1
                if len(out)>=size:break
        return bytes(out[:size])

def source_metadata(root):
    groups=json.loads((root/'data/maps/map_groups.json').read_text())
    layouts=json.loads((root/'data/layouts/layouts.json').read_text())['layouts']
    layout_ids={l['id']:(i+1,l) for i,l in enumerate(layouts) if 'id' in l}
    maps=[]
    for group,group_name in enumerate(groups['group_order']):
        for number,name in enumerate(groups[group_name]):
            src=json.loads((root/f'data/maps/{name}/map.json').read_text())
            maps.append((group,number,name,src,*layout_ids[src['layout']]))
    behavior={int(n,0):label for label,n in re.findall(r'#define\s+(MB_\w+)\s+(0x[\da-fA-F]+|\d+)\b',
               (root/'include/constants/metatile_behaviors.h').read_text())}
    mtpaths={name:root/path for name,path in re.findall(r'gMetatiles_(\w+)\[\]\s*=\s*INCBIN_U16\("([^"]+)"\)',
             (root/'src/data/tilesets/metatiles.h').read_text())}
    return groups,maps,behavior,mtpaths

def locate_table(rom, groups, maps, root):
    pallet=next(m for m in maps if m[2]=='PalletTown');g,n,name,src,lid,layout=pallet
    fingerprint=(root/layout['blockdata_filepath']).read_bytes()
    candidates=[]
    for block_ptr in rom.hits(fingerprint):
        for ref in rom.refs(block_ptr):
            lp=ref-12
            if lp<0 or rom.u32(lp)!=layout['width'] or rom.u32(lp+4)!=layout['height']:continue
            for header in rom.refs(lp):
                if rom.u16(header+18)!=lid:continue
                try:rom.ptr(header+4);rom.ptr(header+8)
                except (ValueError,IndexError):continue
                for table_slot in rom.refs(header):
                    group_pointer=table_slot-4*n
                    for group_slot in rom.refs(group_pointer):
                        candidate=group_slot-4*g
                        try:
                            for gi,ni,_,ss,li,ll in maps:
                                hp=rom.ptr(rom.ptr(candidate+gi*4)+ni*4);lo=rom.ptr(hp)
                                if rom.u16(hp+18)!=li:raise ValueError('Wrong layout id')
                                if (rom.u32(lo),rom.u32(lo+4))!=(ll['width'],ll['height']):raise ValueError('Wrong dimensions')
                        except (ValueError,IndexError,struct.error):continue
                        candidates.append(candidate)
    candidates=sorted(set(candidates))
    if len(candidates)!=1:raise ValueError(f'Ambiguous/missing group table: {candidates}')
    return candidates[0]

def tile_source(rom,p,name,mtpaths):
    tp,pp,mp,ap=(rom.ptr(p+n) for n in [4,8,12,20])
    compressed=bool(rom.u8(p));secondary=bool(rom.u8(p+1))
    raw=rom.lz77(tp) if compressed else rom.data[tp:tp+(384 if secondary else 640)*32]
    count=len(mtpaths[name.removeprefix('gTileset_')].read_bytes())//16
    mts=[list(struct.unpack_from('<8H',rom.data,mp+i*16)) for i in range(count)]
    attrs=[rom.u32(ap+i*4) for i in range(count)]
    return {'name':name,'headerOffset':p,'tileOffset':tp,'paletteOffset':pp,'metatileOffset':mp,
            'attributeOffset':ap,'compressed':compressed,'secondary':secondary,
            'metatileCount':count,'tileCount':len(raw)//32,'tiles':raw,'metatiles':mts,'attributes':attrs}

def make_pair(rom,primary,secondary,behavior,out):
    pid=primary['name'][9:]+'__'+secondary['name'][9:]
    raw=primary['tiles'].ljust(640*32,b'\0')[:640*32]+secondary['tiles'].ljust(384*32,b'\0')[:384*32]
    palette=[]
    for pal in range(16):
        ptr=primary['paletteOffset'] if pal<7 else secondary['paletteOffset']
        for c in range(16):
            n=rom.u16(ptr+pal*32+c*2) if pal<13 else 0
            palette.append(((n&31)*255//31,((n>>5)&31)*255//31,((n>>10)&31)*255//31,255))
    palette[0]=(0,0,0,255)
    cache={}
    def sub_tile(word):
        if word in cache:return cache[word]
        tile_id=word&1023;pal=(word>>12)&15
        rr=raw[tile_id*32:(tile_id+1)*32];pixels=[]
        for value in rr:
            for index in (value&15,value>>4):pixels.append(palette[pal*16+index] if index else (0,0,0,0))
        im=Image.new('RGBA',(8,8));im.putdata(pixels)
        if word&0x400:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if word&0x800:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        cache[word]=im;return im
    under=Image.new('RGBA',(512,512));over=Image.new('RGBA',(512,512));full=Image.new('RGBA',(512,512),(0,0,0,255))
    metadata=[];tile_images={}
    for tile_id in range(1024):
        ts,local=(primary,tile_id) if tile_id<640 else (secondary,tile_id-640)
        if local>=ts['metatileCount']:
            metadata.append(None);continue
        words=ts['metatiles'][local];attr=ts['attributes'][local];layer=(attr>>29)&3
        lower=Image.new('RGBA',(16,16));upper=Image.new('RGBA',(16,16))
        # FRLG normal cells include a lower BG3 fill (tile 0x3014).
        if layer==0:
            for q in range(4):lower.alpha_composite(sub_tile(0x3014),((q&1)*8,(q>>1)*8))
        for q in range(4):lower.alpha_composite(sub_tile(words[q]),((q&1)*8,(q>>1)*8))
        target=lower if layer==1 else upper
        for q in range(4):target.alpha_composite(sub_tile(words[q+4]),((q&1)*8,(q>>1)*8))
        complete=Image.new('RGBA',(16,16),(0,0,0,255));complete.alpha_composite(lower);complete.alpha_composite(upper)
        xy=((tile_id%32)*16,(tile_id//32)*16)
        under.alpha_composite(lower,xy);over.alpha_composite(upper,xy);full.alpha_composite(complete,xy)
        tile_images[tile_id]=(lower,upper,complete)
        beh=attr&0x1ff
        metadata.append({'id':tile_id,'rawAttribute':attr,'behavior':beh,'behaviorName':behavior.get(beh,f'MB_UNKNOWN_{beh:03X}'),
                         'terrain':(attr>>9)&31,'encounterType':(attr>>24)&7,'layerType':layer,
                         'subtiles':words})
    for suffix,im in [('under',under),('over',over),('full',full)]:
        path=out/f'atlases/{pid}.{suffix}.png';path.parent.mkdir(parents=True,exist_ok=True);im.save(path,optimize=True)
    info={'id':pid,'tileSize':16,'atlasColumns':32,'atlasRows':32,
          'under':f'atlases/{pid}.under.png','over':f'atlases/{pid}.over.png','full':f'atlases/{pid}.full.png',
          'primary':{k:v for k,v in primary.items() if k not in ['tiles','attributes','metatiles']},
          'secondary':{k:v for k,v in secondary.items() if k not in ['tiles','attributes','metatiles']},'metatiles':metadata}
    dump(out/f'tilesets/{pid}.json',info)
    return info,tile_images

def parse_map(rom,g,n,name,src,lid,layout,hp,names,root,table):
    lp=rom.ptr(hp);ep=rom.ptr(hp+4);sp=rom.ptr(hp+8);cp=rom.ptr(hp+12,True)
    w,h=rom.u32(lp),rom.u32(lp+4);bp,mp,primary,secondary=(rom.ptr(lp+x) for x in [8,12,16,20])
    bw,bh=rom.u8(lp+24),rom.u8(lp+25)
    bs=rom.data[mp:mp+2*w*h];blocks=list(struct.unpack('<'+'H'*(w*h),bs))
    border=list(struct.unpack_from('<'+'H'*(bw*bh),rom.data,bp))
    def target(group,num):return {'bank':group,'number':num,'id':names.get((group,num))}
    counts=list(rom.data[ep:ep+4]);ptrs=[rom.ptr(ep+4+x*4,True) for x in range(4)]
    events={'objects':[],'warps':[],'coordinates':[],'background':[],'scripts':[]}
    source_event_keys=['object_events','warp_events','coord_events','bg_events']
    for event_group,(count,ptr,sz) in enumerate(zip(counts,ptrs,[24,8,16,12])):
        if count and ptr is None:raise ValueError('Null event array')
        for i in range(count):
            p=ptr+i*sz;ss=src.get(source_event_keys[event_group],[])
            symbolic=ss[i] if i<len(ss) else None
            e={'index':i,'sourceOffset':p,'x':rom.s16(p+4) if event_group==0 else rom.s16(p),
               'y':rom.s16(p+6) if event_group==0 else rom.s16(p+2)}
            if symbolic is not None:e['symbols']=symbolic
            if event_group==0:
                e.update(localId=rom.u8(p),graphicsId=rom.u8(p+1),kind=rom.u8(p+2),
                         elevation=rom.u8(p+8),movementType=rom.u8(p+9),rangeX=rom.u8(p+10)&15,
                         rangeY=rom.u8(p+10)>>4,trainerType=rom.u16(p+12),trainerRange=rom.u16(p+14),
                         scriptAddress=rom.u32(p+16),flagId=rom.u16(p+20))
                if e['kind']==255:e['clone']={'targetLocalId':rom.u8(p+8),'targetMapNumber':rom.u16(p+12),'targetMapBank':rom.u16(p+14)}
                events['objects'].append(e)
            elif event_group==1:
                e.update(elevation=rom.u8(p+4),destinationWarp=rom.u8(p+5),destination=target(rom.u8(p+7),rom.u8(p+6)))
                e['dynamic']=e['destination']['id'] is None or e['destinationWarp']==255
                events['warps'].append(e)
            elif event_group==2:
                e.update(elevation=rom.u8(p+4),triggerVar=rom.u16(p+6),triggerValue=rom.u16(p+8),scriptAddress=rom.u32(p+12))
                events['coordinates'].append(e)
            else:
                e.update(elevation=rom.u8(p+4),kind=rom.u8(p+5),rawValue=rom.u32(p+8))
                if e['kind'] in [5,6,7]:
                    v=e['rawValue'];e['hiddenItem']={'itemId':v&65535,'flagOffset':(v>>16)&255,'quantity':(v>>24)&127,'underfoot':v>>31}
                else:e['scriptAddress']=e['rawValue']
                events['background'].append(e)
    i=sp
    for _ in range(32):
        kind=rom.u8(i)
        if not kind:break
        events['scripts'].append({'type':kind,'scriptAddress':rom.u32(i+1),'sourceOffset':i});i+=5
    else:raise ValueError('Unterminated map script table')
    connections=[]
    if cp is not None:
        count=rom.u32(cp);ptr=rom.ptr(cp+4)
        for i in range(count):
            p=ptr+i*12;direction=rom.u8(p)
            connections.append({'direction':DIRS.get(direction,str(direction)),'directionId':direction,
                                'offset':rom.s32(p+4),'destination':target(rom.u8(p+8),rom.u8(p+9)),'sourceOffset':p})
    native_id=f'frlg_{g:02d}_{n:02d}'
    m={'id':native_id,'name':name,'symbol':src['id'],'bank':g,'number':n,'width':w,'height':h,
       'layoutId':lid,'layoutSymbol':src['layout'],'primaryTileset':layout['primary_tileset'],
       'secondaryTileset':layout['secondary_tileset'],'regionMapSection':rom.u8(hp+20),'regionMapSymbol':src['region_map_section'],
       'musicId':rom.u16(hp+16),'musicSymbol':src['music'],'requiresFlash':bool(rom.u8(hp+21)),
       'weather':rom.u8(hp+22),'mapType':rom.u8(hp+23),'mapTypeSymbol':src['map_type'],
       'allowCycling':bool(rom.u8(hp+24)),'allowEscaping':bool(rom.u8(hp+25)&1),
       'allowRunning':bool(rom.u8(hp+25)&2),'showMapName':bool(rom.u8(hp+25)&4),
       'floorNumber':struct.unpack_from('b',rom.data,hp+26)[0],'battleScene':rom.u8(hp+27),
       'source':{'headerOffset':hp,'layoutOffset':lp,'blockOffset':mp,'borderOffset':bp,'eventOffset':ep,
                 'primaryTilesetOffset':primary,'secondaryTilesetOffset':secondary,
                 'blockSha256':hashlib.sha256(bs).hexdigest(),'matchesDecompBlocks':bs==(root/layout['blockdata_filepath']).read_bytes()},
       'blockEncoding':'uint16 little-endian; id = block & 1023; collision = (block >> 10) & 3; elevation = block >> 12',
       'blocks':[blocks[y*w:(y+1)*w] for y in range(h)],
       'border':{'width':bw,'height':bh,'blocks':border},'events':events,'connections':connections}
    return m

def validate(maps,infos):
    byid={m['id']:m for m in maps};issues=[];edges=[];symbols=collections.Counter();dynamic=[]
    for m in maps:
        for e in m['events']['warps']:
            if not (0<=e['x']<m['width'] and 0<=e['y']<m['height']):issues.append({'kind':'warp_outside_map','map':m['id'],'warp':e['index']})
            if e['dynamic']:dynamic.append({'map':m['id'],'warp':e['index'],'destination':e['destination'],'destinationWarp':e['destinationWarp']});continue
            t=byid.get(e['destination']['id'])
            if t is None:issues.append({'kind':'missing_warp_map','map':m['id'],'warp':e['index']});continue
            if e['destinationWarp']>=len(t['events']['warps']):issues.append({'kind':'missing_warp_index','map':m['id'],'warp':e['index']});continue
            to=t['events']['warps'][e['destinationWarp']]
            e['destinationCoordinates']={'x':to['x'],'y':to['y'],'elevation':to['elevation']}
            edges.append({'kind':'warp','from':m['id'],'to':t['id'],'fromWarp':e['index'],'toWarp':e['destinationWarp']})
        for c in m['connections']:
            t=byid.get(c['destination']['id'])
            if t is None:issues.append({'kind':'missing_connection_map','map':m['id'],'connection':c})
            else:edges.append({'kind':'connection','from':m['id'],'to':t['id'],'direction':c['direction'],'offset':c['offset']})
        if not m['source']['matchesDecompBlocks']:issues.append({'kind':'geometry_differs_from_reference','map':m['id']})
        info=infos[m['tilesetPair']]
        for row in m['blocks']:
            for b in row:
                mid=b&1023
                if info['metatiles'][mid] is None:issues.append({'kind':'missing_metatile','map':m['id'],'metatile':mid})
        for ek,sk in [('objects','object_events'),('warps','warp_events'),('coordinates','coord_events'),('background','bg_events')]:
            for e in m['events'][ek]:
                if 'symbols' in e:
                    ss=e['symbols'];symbols['withReference']+=1
                    if (e['x'],e['y'])!=(ss['x'],ss['y']):issues.append({'kind':'symbol_coordinate_mismatch','map':m['id'],'eventType':ek,'index':e['index']})
    counts={k:sum(len(m['events'][k]) for m in maps) for k in ['objects','warps','coordinates','background','scripts']}
    return {'mapCount':len(maps),'tileCount':sum(m['width']*m['height'] for m in maps),
            'blockDataMatchesReference':sum(m['source']['matchesDecompBlocks'] for m in maps),
            'eventCounts':counts,'connectionCount':sum(len(m['connections']) for m in maps),
            'tilesetPairCount':len(infos),'issues':issues,'dynamicWarps':dynamic},edges

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--rom',type=Path,required=True);ap.add_argument('--decomp',type=Path,required=True)
    ap.add_argument('--out',type=Path,required=True);ap.add_argument('--render',choices=['none','selected','all'],default='selected')
    args=ap.parse_args();rom=Rom(args.rom);root=args.decomp;out=args.out;out.mkdir(parents=True,exist_ok=True)
    groups,source_maps,behavior,mtpaths=source_metadata(root);table=locate_table(rom,groups,source_maps,root)
    names={(g,n):f'frlg_{g:02d}_{n:02d}' for g,n,*_ in source_maps}
    maps=[];tilesets={};pairs={};images={}
    for g,n,name,src,lid,layout in source_maps:
        hp=rom.ptr(rom.ptr(table+g*4)+n*4)
        m=parse_map(rom,g,n,name,src,lid,layout,hp,names,root,table)
        for role in ['primary','secondary']:
            key=m[role+'Tileset'];ptr=m['source'][role+'TilesetOffset']
            if key not in tilesets:tilesets[key]=tile_source(rom,ptr,key,mtpaths)
        primary=tilesets[m['primaryTileset']];secondary=tilesets[m['secondaryTileset']]
        pairid=primary['name'][9:]+'__'+secondary['name'][9:]
        if pairid not in pairs:pairs[pairid],images[pairid]=make_pair(rom,primary,secondary,behavior,out)
        m['tilesetPair']=pairid;maps.append(m)
    validation,edges=validate(maps,pairs)
    selected={'PalletTown','ViridianCity','ViridianForest','MtMoon_1F','MtMoon_B1F','MtMoon_B2F','PewterCity',
              'Route1','Route2','Route3','Route4','CeruleanCity','VictoryRoad_1F','RockTunnel_1F','RockTunnel_B1F',
              'PalletTown_PlayersHouse_1F','PewterCity_Museum_1F','PewterCity_Museum_2F'}
    for m in maps:
        dump(out/f'maps/{m["id"]}.json',m)
        if args.render=='all' or (args.render=='selected' and m['name'] in selected):
            im=Image.new('RGBA',(m['width']*16,m['height']*16),(0,0,0,255))
            for y,row in enumerate(m['blocks']):
                for x,b in enumerate(row):
                    ims=images[m['tilesetPair']].get(b&1023)
                    if ims:im.alpha_composite(ims[2],(x*16,y*16))
            p=out/f'reference/{m["name"]}.png';p.parent.mkdir(exist_ok=True);im.convert('RGB').save(p,optimize=True)
    try:commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
    except Exception:commit='unknown'
    index={'schema':'leafgreen-native-map-index/v1','coordinateUnit':'original 16x16 pixel metatile',
           'rom':{'filename':rom.filename,'sha256':hashlib.sha256(rom.data).hexdigest(),'size':len(rom.data),
                  'title':rom.data[0xa0:0xac].decode('ascii'),'gameCode':rom.data[0xac:0xb0].decode('ascii'),
                  'revision':rom.u8(0xbc),'groupTableOffset':table},
           'reference':{'repository':'https://github.com/pret/pokefirered','commit':commit,
                        'role':'symbol labels, table cardinalities, geometry cross-check; numeric values read from supplied ROM'},
           'groups':[{'bank':i,'name':g,'mapCount':len(groups[g])} for i,g in enumerate(groups['group_order'])],
           'maps':[{k:m[k] for k in ['id','name','symbol','bank','number','width','height','layoutId','layoutSymbol','tilesetPair','mapTypeSymbol','regionMapSymbol']} for m in maps],
           'tilesets':[{'id':p,'file':f'tilesets/{p}.json'} for p in sorted(pairs)]}
    dump(out/'index.json',index,True);dump(out/'validation.json',validation,True);dump(out/'graph.json',{'edges':edges})
    dump(out/'metatile-behaviors.json',behavior,True)
    print(json.dumps({'out':str(out),'table':hex(table),**{k:v for k,v in validation.items() if k not in ['issues','dynamicWarps']},
                      'issueCount':len(validation['issues']),'dynamicWarpCount':len(validation['dynamicWarps'])},indent=2))

if __name__=='__main__':main()
