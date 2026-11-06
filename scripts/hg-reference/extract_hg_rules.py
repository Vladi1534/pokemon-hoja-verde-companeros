#!/usr/bin/env python3
"""Extract factual HG combat tables from a user-supplied ROM/ZIP; never execute it.

Inputs: --rom FILE --current kanto.json --decomp pret/pokeheartgold --csv PokeAPI/csv
The ROM remains local. Outputs only selected species/move numeric data, source
hashes and differences. Requires Python standard library only.
"""
import argparse, csv, hashlib, json, re, struct, subprocess, zipfile
from pathlib import Path

U16=lambda b,p:struct.unpack_from('<H',b,p)[0]
U32=lambda b,p:struct.unpack_from('<I',b,p)[0]
TYPES=['Normal','Fighting','Flying','Poison','Ground','Rock','Bug','Ghost','Steel','???','Fire','Water','Grass','Electric','Psychic','Ice','Dragon','Dark']
STAT=['hp','atk','def','spe','spa','spd']
GROUPS=['NONE','MONSTER','WATER_1','BUG','FLYING','FIELD','FAIRY','GRASS','HUMAN_LIKE','WATER_3','MINERAL','AMORPHOUS','WATER_2','DITTO','DRAGON','UNDISCOVERED']

def filesystem(rom):
    fntoff,_,fatoff,_=struct.unpack_from('<4I',rom,0x40); files={}
    def walk(did,path):
        p,fid,_=struct.unpack_from('<IHH',rom,fntoff+(did&4095)*8);p+=fntoff
        while rom[p]:
            flag=rom[p];p+=1;name=rom[p:p+(flag&127)].decode('ascii');p+=flag&127
            if flag&128:
                child=U16(rom,p);p+=2;walk(child,path+name+'/')
            else:
                start,end=struct.unpack_from('<II',rom,fatoff+fid*8)
                assert 0<=start<=end<=len(rom)
                files[path+name]=rom[start:end];fid+=1
    walk(0xf000,'');return files

def narc(blob):
    assert blob[:4]==b'NARC';p=U16(blob,12);blocks={}
    while p<len(blob):
        length=U32(blob,p+4);assert length>=8 and p+length<=len(blob)
        blocks[blob[p:p+4]]=blob[p:p+length];p+=length
    fat,data=blocks[b'BTAF'],blocks[b'GMIF']
    return [data[8+U32(fat,12+i*8):8+U32(fat,16+i*8)] for i in range(U16(fat,8))]

def csvrows(root,name):
    return list(csv.DictReader((root/name).open()))

def constants(path,prefix):
    return {name:int(num,0) for name,num in re.findall(r'^#define\s+('+prefix+r'\w+)\s+(0x[0-9A-Fa-f]+|\d+)\b',path.read_text(),re.M)}

def main():
    p=argparse.ArgumentParser();p.add_argument('--rom',type=Path,required=True);p.add_argument('--current',type=Path,required=True);p.add_argument('--decomp',type=Path,required=True);p.add_argument('--csv',type=Path,required=True);p.add_argument('--output',type=Path,default=Path('deliverable'));a=p.parse_args()
    if zipfile.is_zipfile(a.rom):
        with zipfile.ZipFile(a.rom) as z:raw=z.read(next(n for n in z.namelist() if n.lower().endswith('.nds')))
    else:raw=a.rom.read_bytes()
    assert raw[12:16] in [b'IPKS',b'IPKE',b'IPKJ',b'IPKP'], 'Expected HeartGold'
    fs=filesystem(raw);paths={'personal':'a/0/0/2','growth':'a/0/0/3','moves':'a/0/1/1','levelUp':'a/0/3/3','evolution':'a/0/3/4','eggMoves':'a/2/2/9'}
    tables={k:narc(fs[v]) for k,v in paths.items()}
    current=json.loads(a.current.read_text());species_ids=sorted(map(int,current['species']))
    moveids=constants(a.decomp/'include/constants/moves.h','MOVE_')
    tmblock=re.search(r'sTMHMMoves\[\]\s*=\s*\{(.*?)\};',(a.decomp/'src/item.c').read_text(),re.S)[1]
    tms=[moveids[n] for n in re.findall(r'\bMOVE_\w+',tmblock)];assert len(tms)==100
    mnames={int(r['move_id']):r['name'] for r in csvrows(a.csv,'move_names.csv') if r['local_language_id']=='7'}
    mrows={int(r['id']):r for r in csvrows(a.csv,'moves.csv')}
    anames={int(r['ability_id']):r['name'] for r in csvrows(a.csv,'ability_names.csv') if r['local_language_id']=='7'}
    arows={int(r['id']):r for r in csvrows(a.csv,'abilities.csv')}
    egg={};sid=0
    for (v,) in struct.iter_unpack('<H',tables['eggMoves'][0]):
        if v>=20000:sid=v-20000;egg[sid]=[]
        elif sid:egg[sid].append(v)
    out={'profile':{'generation':4,'game':'HeartGold','romCode':raw[12:16].decode(),'sourceSha256':hashlib.sha256(raw).hexdigest(),'decompCommit':subprocess.check_output(['git','-C',str(a.decomp),'rev-parse','HEAD']).decode().strip(),'archives':{k:{'path':v,'sha256':hashlib.sha256(fs[v]).hexdigest(),'members':len(tables[k])} for k,v in paths.items()},'notes':['Only the existing 159 species are selected.','Evolution/campaign adaptations are not applied by this extraction.','Numeric data comes from the supplied Spanish HeartGold ROM; Spanish labels and slugs from retained PokeAPI CSVs.']},'species':{},'moves':{},'abilities':{},'tmhm':tms}
    for sid in species_ids:
        b=tables['personal'][sid];assert len(b)==44
        ev=U16(b,10);learn=[]
        for (v,) in struct.iter_unpack('<H',tables['levelUp'][sid]):
            if v==65535:break
            learn.append([v>>9,v&511])
        abil=[i for i in b[22:24] if i];abil=list(dict.fromkeys(abil));bits=int.from_bytes(b[28:44],'little')
        evo=[list(struct.unpack_from('<HHH',tables['evolution'][sid],i*6)) for i in range(7) if U16(tables['evolution'][sid],i*6)]
        out['species'][str(sid)]={'id':sid,'name':current['species'][str(sid)]['name'],'types':list(dict.fromkeys(TYPES[t] for t in b[6:8])),'baseStats':dict(zip(STAT,b[:6])),'abilityIds':abil,'abilitySlots':{str(i):v for i,v in enumerate(abil)},'captureRate':b[8],'baseExpYield':b[9],'evYield':{k:(ev>>(2*i))&3 for i,k in enumerate(STAT)},'genderRatio':b[16],'eggCycles':b[17],'friendship':b[18],'growthRateHG':b[19],'eggGroups':[GROUPS[g] for g in b[20:22]],'levelUp':learn,'eggMoves':egg.get(sid,[]),'machines':[mid for i,mid in enumerate(tms) if bits&(1<<i)],'evolutionRecords':evo,'growthRateId':{0:2,1:5,2:6,3:4,4:3,5:1}[b[19]],'genderRate':{0:0,31:1,63:2,127:4,191:6,254:8,255:-1}[b[16]]}
        for aid in abil:out['abilities'][str(aid)]={'id':aid,'name':anames[aid],'slug':arows[aid]['identifier']}
    for mid in range(1,468):
        b=tables['moves'][mid];assert len(b)==16
        out['moves'][str(mid)]={'id':mid,'slug':mrows[mid]['identifier'],'name':mnames[mid],'type':TYPES[b[4]].lower(),'category':['Physical','Special','Status'][b[2]],'power':b[3],'accuracy':b[5] or True,'pp':b[6],'priority':struct.unpack_from('b',b,10)[0],'effectIdHG':U16(b,0),'effectChance':b[7],'rangeHG':U16(b,8)}
    out['experience']={str({0:2,1:5,2:6,3:4,4:3,5:1}[i]):{'growthRateHG':i,'thresholds':[v[0] for v in struct.iter_unpack('<I',tables['growth'][i])]} for i in range(6)}
    tc=(a.decomp/'src/battle/overlay_12_0224E4FC.c').read_text()
    tc=re.search(r'sTypeEffectiveness\[\]\[3\]\s*=\s*\{(.*?)\};',tc,re.S)[1]
    out['typeChart']={a:{b:1 for b in TYPES if b!='???'} for a in TYPES if a!='???'}
    for attack,defense,effect in re.findall(r'\{ TYPE_(\w+),\s+TYPE_(\w+),\s+TYPE_MUL_(\w+)',tc):
        if attack.title() in out['typeChart'] and defense.title() in out['typeChart']:out['typeChart'][attack.title()][defense.title()]={'NOT_EFFECTIVE':0.5,'SUPER_EFFECTIVE':2,'NO_EFFECT':0}[effect]
    out['profile']['typeChartSource']='pret/pokeheartgold src/battle/overlay_12_0224E4FC.c sTypeEffectiveness'
    changes={'levelUp':[],'eggMoves':[],'machines':[],'abilityIds':[],'types':[],'baseStats':[],'captureRate':[],'baseExpYield':[],'pp':[],'requiredNewMoves':[]}
    for sid,hg in out['species'].items():
        old=current['species'][sid]
        for f in ['levelUp','eggMoves','machines','captureRate','baseExpYield']:
            if old.get(f)!=hg[f]:changes[f].append(int(sid))
        if old.get('frlgAbilities')!=hg['abilityIds']:changes['abilityIds'].append({'id':int(sid),'old':old.get('frlgAbilities'),'hg':hg['abilityIds']})
        if old.get('types') and old['types']!=[x.lower() for x in hg['types']]:changes['types'].append(int(sid))
        orig={k:old['stats'][v] for k,v in zip(STAT,['hp','attack','defense','speed','specialAttack','specialDefense'])} if old.get('stats') else hg['baseStats']
        if orig!=hg['baseStats']:changes['baseStats'].append({'id':int(sid),'old':orig,'hg':hg['baseStats']})
    required=set(v for s in out['species'].values() for v in s['eggMoves']+s['machines']+[v for l,v in s['levelUp']])
    changes['requiredNewMoves']=[out['moves'][str(v)] for v in sorted(required) if str(v) not in current['moves']]
    for mid,hg in out['moves'].items():
        if mid in current['moves'] and hg['pp']!=current['moves'][mid]['pp']:changes['pp'].append({'id':int(mid),'name':hg['name'],'old':current['moves'][mid]['pp'],'hg':hg['pp']})
    changes['growthRates']=[{'id':int(sid),'old':current['species'][sid]['growthRateId'],'hg':s['growthRateId']} for sid,s in out['species'].items() if current['species'][sid]['growthRateId']!=s['growthRateId']]
    changes['growthThresholds']=[{'rate':int(i),'level':l,'old':current['experience'][i]['thresholds'][l],'hg':v} for i,e in out['experience'].items() for l,v in enumerate(e['thresholds']) if l<len(current['experience'][i]['thresholds']) and v!=current['experience'][i]['thresholds'][l]]
    changes['genderRatios']=[{'id':int(sid),'old':current['species'][sid]['genderRate'],'hg':s['genderRate']} for sid,s in out['species'].items() if current['species'][sid]['genderRate']!=s['genderRate']]
    changes['eggCycles']=[{'id':int(sid),'old':current['species'][sid]['eggCycles'],'hg':s['eggCycles']} for sid,s in out['species'].items() if current['species'][sid]['eggCycles']!=s['eggCycles']]
    out['profile']['counts']={'species':len(out['species']),'moves':len(out['moves']),'abilities':len(out['abilities']),'requiredNewMoves':len(changes['requiredNewMoves'])}
    a.output.mkdir(parents=True,exist_ok=True)
    (a.output/'hg-rules.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
    (a.output/'hg-differences.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(out['profile'],indent=2));print('Difference counts:',{k:len(v) for k,v in changes.items()})

if __name__=='__main__':main()
