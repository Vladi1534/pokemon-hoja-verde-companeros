#!/usr/bin/env python3
"""Derive explicit engine semantics / transitions and legacy migration from native maps."""
import argparse, collections, csv, io, json, re
from pathlib import Path
from extract_leafgreen_maps import dump

SEMANTIC={'floor':0,'tall_grass':1,'water':2,'obstacle':3,'ledge':4,'warp':5,'ice':6,'forced_movement':7}
VECTORS={'down':(0,1),'up':(0,-1),'left':(-1,0),'right':(1,0)}
OPPOSITE={'down':'up','up':'down','left':'right','right':'left'}
SURF={0x10,0x11,0x12,0x13,0x15,0x1a,0x1b,0x50,0x51,0x52,0x53}

ALIASES={
 'pallet':'PalletTown','viridian':'ViridianCity','forest':'ViridianForest','pewter':'PewterCity',
 'moon':'MtMoon_1F','moon_b1':'MtMoon_B1F','moon_b2':'MtMoon_B2F','cerulean':'CeruleanCity',
 'cape':'Route25','vermilion':'VermilionCity','rocktunnel':'RockTunnel_1F','rocktunnel_b1':'RockTunnel_B1F',
 'lavender':'LavenderTown','celadon':'CeladonCity','saffron':'SaffronCity','fuchsia':'FuchsiaCity',
 'safari':'SafariZone_Center','sea20':'Route20','cinnabar':'CinnabarIsland',
 'victory':'VictoryRoad_1F','indigo':'IndigoPlateau_Exterior',
 'pallet_home':'PalletTown_PlayersHouse_1F','pallet_bedroom':'PalletTown_PlayersHouse_2F',
 'pallet_rival':'PalletTown_RivalsHouse','pallet_lab':'PalletTown_ProfessorOaksLab',
 'pewter_museum':'PewterCity_Museum_1F','bill_home':'Route25_SeaCottage',
 'ssanne':'SSAnne_1F_Corridor','ssanne_cabin':'SSAnne_CaptainsOffice','ssanne_rest':'SSAnne_1F_Room6',
 'ssanne_guest':'SSAnne_1F_Room1','ssanne_kitchen':'SSAnne_Kitchen','ssanne_deck':'SSAnne_Deck',
 'casino':'CeladonCity_GameCorner','rocket_b1':'RocketHideout_B1F','rocket_b2':'RocketHideout_B4F',
 'tower_1':'PokemonTower_1F','tower_2':'PokemonTower_6F','tower_3':'PokemonTower_7F',
 'silph_1':'SilphCo_1F','silph_2':'SilphCo_5F','silph_3':'SilphCo_11F',
 'safari_hut':'SafariZone_SecretHouse','mansion_1':'PokemonMansion_1F','mansion_2':'PokemonMansion_B1F',
 'indigo_arena':'PokemonLeague_LoreleisRoom','route5_daycare':'Route5_PokemonDayCare',
 'route16_house':'Route16_House','cinnabar_lab':'CinnabarIsland_PokemonLab_ExperimentRoom',
 'diglett':'DiglettsCave_B1F','oneisland':'OneIsland','fourisland':'FourIsland','ember':'MtEmber_Exterior',
 'fourisland_daycare':'FourIsland_PokemonDayCare','vermilion_fanclub':'VermilionCity_PokemonFanClub',
 'vermilion_boathouse':'VermilionCity_House2',
 'viridian_house':'ViridianCity_House','pewter_house':'PewterCity_House1',
 'cerulean_house':'CeruleanCity_House2','vermilion_house':'VermilionCity_House3',
 'lavender_house':'LavenderTown_VolunteerPokemonHouse','celadon_house':'CeladonCity_Condominiums_1F',
 'saffron_house':'SaffronCity_House','fuchsia_house':'FuchsiaCity_WardensHouse',
 'cinnabar_house':'CinnabarIsland_PokemonLab_Lounge',
 'indigo_house':'IndigoPlateau_PokemonCenter_1F','indigo_shop':'IndigoPlateau_PokemonCenter_1F',
 'celadon_shop':'CeladonCity_DepartmentStore_1F'
}
TOWNS={'viridian':'ViridianCity','pewter':'PewterCity','cerulean':'CeruleanCity','vermilion':'VermilionCity',
 'lavender':'LavenderTown','celadon':'CeladonCity','saffron':'SaffronCity','fuchsia':'FuchsiaCity',
 'cinnabar':'CinnabarIsland','indigo':'IndigoPlateau','oneisland':'OneIsland','fourisland':'FourIsland'}
for old,new in TOWNS.items():
 ALIASES[old+'_center']=new+'_PokemonCenter_1F'
 ALIASES.setdefault(old+'_shop',new+'_Mart')
 ALIASES[old+'_gym']=new+'_Gym'
for n in range(1,26):ALIASES['route'+str(n)]='Route'+str(n)

NOTES={
 'route6':'El mapa actual mezcla Ruta6 y Paso Subterráneo. Restaurar también los tres mapas UndergroundPath_NorthEntrance/NorthSouthTunnel/SouthEntrance.',
 'route8':'Separar Ruta8 del Paso Subterráneo oeste-este y sus dos entradas.',
 'moon_b1':'Conservar solo el piso B1F; el paleontólogo y los fósiles pertenecen al B2F.',
 'rocket_b2':'El despacho de Giovanni está en B4F. Este ID actual no representa realmente B2F; añadir B2F/B3F/elevador originales.',
 'tower_2':'El espíritu de Marowak está en6F. Añadir2F/3F/4F/5F separados.',
 'silph_2':'La Tarjeta Llave corresponde a5F; reubicar el rival existente a7F. Restaurar los11pisos y elevador.',
 'silph_3':'Presidencia/Giovanni corresponden a11F.',
 'mansion_2':'Llave Secreta y laboratorio corresponden aB1F; añadir2F/3F.',
 'indigo_arena':'La sala única actual concentra toda la Liga. Restaurar Lorelei/Bruno/Agatha/Lance/Campeón/Salón de la Fama como6mapas.',
 'indigo_shop':'La tienda está dentro del Centro/Liga, no en edificio independiente. Fusionar NPC dependiente con indigo_center.',
 'indigo_house':'No hay casa independiente en Meseta Añil. Reubicar el NPC en el vestíbulo; no crear puerta ficticia.',
 'cinnabar_house':'No hay casa equivalente. Reubicar el vecino en el salón del laboratorio.',
 'ssanne':'El mapa actual mezcla pasillos/pisos. Rival pertenece al pasillo2F; añadir exterior, pasillos1F/2F/3F/B1F y camarotes.',
 'ssanne_rest':'La habitación nativa6contiene la señora que cura al equipo (SSAnne_1F_Room6_EventScript_Woman).',
 'ssanne_guest':'Habitación actual combina huéspedes de varias habitaciones; repartir por camarotes nativos.',
 'safari':'La Dentadura de Oro se encuentra enSafariZone_West, no enCenter. AñadirEast/North/West y acceso.',
 'ember':'Rubí corresponde aMtEmber_RubyPath_B5F; restaurar camino y pisos separados.',
 'celadon_shop':'La planta1Fes recepción. Dependientes reales están enplantas2F..5F; no trasladar todos alvestíbulo.',
 'cinnabar_lab':'La restauración de fósiles pertenece aExperimentRoom; añadirEntrada/Lounge/ResearchRoom.',
 'diglett':'Añadir entradas norte/sur separadas; B1F no tiene salidas exteriores directas.',
}

def tile_meta(m,x,y,pairs):return pairs[m['tilesetPair']]['metatiles'][m['blocks'][y][x]&1023]
def cell(m,x,y,pairs):
 if not(0<=x<m['width'] and 0<=y<m['height']):return None
 b=m['blocks'][y][x];t=tile_meta(m,x,y,pairs)
 return {'x':x,'y':y,'metatile':b&1023,'collision':(b>>10)&3,'elevation':b>>12,
         'behavior':t['behavior'],'behaviorName':t['behaviorName'],'terrain':t['terrain'],
         'encounterType':t['encounterType'],'layerType':t['layerType'],'surf':t['behavior'] in SURF}
def can_stand(c):return c is not None and c['collision']==0

def classify(c,is_warp):
 b=c['behavior']
 if is_warp or b in range(0x60,0x70) or b==0x71:return 'warp'
 if 0x38<=b<=0x3b:return 'ledge'
 if c['surf']:return 'water'
 if c['collision']:return 'obstacle'
 if b==0x02 or c['terrain']==1:return 'tall_grass'
 if b==0x23 or b in [0x26,0x27]:return 'ice'
 if 0x40<=b<=0x58:return 'forced_movement'
 return 'floor'

def contacts(m,e,pairs):
 c=cell(m,e['x'],e['y'],pairs);out=[]
 for side,(dx,dy) in VECTORS.items():
  cc=cell(m,e['x']+dx,e['y']+dy,pairs)
  if can_stand(cc):
   out.append({**{k:cc[k] for k in ['x','y','elevation','collision']},'side':side,
               'facing':OPPOSITE[side],'requiresSurf':cc['surf']})
 preferred=next((o for o in out if o['side']=='down' and not o['requiresSurf']),None)
 if preferred is None:preferred=next((o for o in out if not o['requiresSurf']),out[0] if out else None)
 return c,out,preferred

def kind_for_building(name):
 for fragment,kind in [('PokemonCenter','center'),('Mart','shop'),('DepartmentStore','department_store'),('Gym','gym'),
                        ('Museum','museum'),('ProfessorOaksLab','oak_lab'),('PokemonLab','lab'),('GameCorner','casino'),
                        ('PokemonTower','tower'),('SilphCo','silph'),('PokemonMansion','mansion'),('PokemonFanClub','fanclub'),
                        ('SeaCottage','bill_house'),('PokemonDayCare','daycare'),('SafariZone_Entrance','safari_gate'),
                        ('House','house'),('Entrance','gate')]:
  if fragment in name:return kind
 return 'entrance'

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--native',type=Path,required=True);ap.add_argument('--current',type=Path,required=True)
 ap.add_argument('--decomp',type=Path,required=True);args=ap.parse_args();p=args.native
 idx=json.loads((p/'index.json').read_text());maps={i['id']:json.loads((p/f'maps/{i["id"]}.json').read_text()) for i in idx['maps']}
 names={m['name']:m for m in maps.values()};pairs={i['id']:json.loads((p/i['file']).read_text()) for i in idx['tilesets']}
 old=json.loads(args.current.read_text())['maps'];aliases=[];reverse=collections.defaultdict(list)
 for oldid,m in old.items():
  name=ALIASES[oldid];target=names[name]
  status='adaptation' if oldid in ['indigo_shop','indigo_house','cinnabar_house','ssanne_guest','vermilion_boathouse'] else 'story_equivalent'
  a={'legacyId':oldid,'legacyName':m['name'],'nativeId':target['id'],'nativeName':name,'status':status,
     'legacySize':[m['w'],m['h']],'nativeSize':[target['width'],target['height']],
     'note':NOTES.get(oldid,'Conservar ID lógico; sustituir dimensiones, bloques y transiciones por los nativos.')}
  aliases.append(a);reverse[target['id']].append(oldid)
 dump(p/'legacy-map-correspondence.json',{'maps':aliases},True)
 stream=io.StringIO();wr=csv.DictWriter(stream,fieldnames=['legacyId','nativeId','nativeName','status','legacySize','nativeSize','note']);wr.writeheader()
 for a in aliases:wr.writerow({k:a[k] for k in wr.fieldnames})
 (p/'legacy-map-correspondence.csv').write_text(stream.getvalue())

 runtime={};doors=[];allwarps=[];scripts=collections.defaultdict(list);unreachable=[];semantic_counts=collections.Counter()
 for m in maps.values():
  warp_xy={(e['x'],e['y']) for e in m['events']['warps']};sem=[];grid=[];coll=[];elev=[];beh=[];enc=[]
  inside=m['mapTypeSymbol'] in ['MAP_TYPE_INDOOR','MAP_TYPE_SECRET_BASE'];cave=m['mapTypeSymbol']=='MAP_TYPE_UNDERGROUND'
  for y in range(m['height']):
   sr=[];gr=[];cr=[];er=[];br=[];en=[]
   for x in range(m['width']):
    c=cell(m,x,y,pairs);s=classify(c,(x,y) in warp_xy);semantic_counts[s]+=1
    sr.append(SEMANTIC[s]);cr.append(c['collision']);er.append(c['elevation']);br.append(c['behavior']);en.append(c['encounterType'])
    gr.append({'water':3,'tall_grass':4,'obstacle':7 if inside else 2,'ledge':6 if cave else 1,'warp':8}.get(s,9 if inside else 6 if cave else 0))
   sem.append(sr);grid.append(gr);coll.append(cr);elev.append(er);beh.append(br);enc.append(en)
  warps=[]
  for e in m['events']['warps']:
   c,cc,pref=contacts(m,e,pairs)
   door=c['behavior']==0x69;arrow=c['behavior'] in [0x62,0x63,0x64,0x65]
   allowed={0x62:'right',0x63:'left',0x64:'up',0x65:'down'}.get(c['behavior'])
   t=maps.get(e['destination']['id']);arrival=None;dest_cc=[]
   if t and e['destinationWarp']<len(t['events']['warps']):
    dw=t['events']['warps'][e['destinationWarp']];dc,dest_cc,dpref=contacts(t,dw,pairs)
    if can_stand(dc):arrival={k:dc[k] for k in ['x','y','elevation']}
    elif dpref:arrival={k:dpref[k] for k in ['x','y','elevation']}
   w={'id':f'{m["id"]}:warp:{e["index"]}','index':e['index'],'x':e['x'],'y':e['y'],
      'sourceCell':c,'trigger':'approach' if door else 'step','entryDirection':'up' if door else allowed,
      'contacts':cc,'preferredContact':pref,'destinationId':e['destination']['id'],'destinationName':t['name'] if t else None,
      'destinationWarp':e['destinationWarp'],'dynamic':e['dynamic'],'arrival':arrival,'arrivalContacts':dest_cc,
      'requiresTransitionCooldown':True,
      'activeWarpBehaviorByDefault':c['behavior'] in range(0x60,0x70) or c['behavior']==0x71}
   if not w['activeWarpBehaviorByDefault']:
    w['activationNote']='Warp registrado pero casilla sin comportamiento de warp; puede ser un ancla de llegada, vestigio sin uso o requerir una modificación de mapa por historia. No convertir automáticamente en puerta abierta.'
   if door:w['contacts']=[q for q in cc if q['facing']=='up']
   if not cc:unreachable.append({'map':m['id'],'warp':e['index'],'cell':c})
   warps.append(w);allwarps.append({'mapId':m['id'],'mapName':m['name'],**w})
   if t and (m['bank']==3 or m['name']=='SSAnne_Exterior') and t['mapTypeSymbol'] in ['MAP_TYPE_INDOOR','MAP_TYPE_UNDERGROUND']:
    doors.append({'mapId':m['id'],'mapName':m['name'],'nativeWarp':e['index'],'door':{'x':e['x'],'y':e['y']},
                  'kind':kind_for_building(t['name']),'targetId':t['id'],'targetName':t['name'],
                  'legacyTargetIds':reverse[t['id']],'contact':pref,'bounds':None,
                  'boundsNote':'ROM almacena el edificio como metatiles, no un objeto con rectángulo. Anclar cualquier modelo HG a la puerta y respetar colisión original.'})
  connections=[]
  for cn in m['connections']:
   t=maps.get(cn['destination']['id']);cc=[]
   if t and cn['direction'] in VECTORS:
    direc=cn['direction'];horizontal=direc in ['up','down'];length=m['width'] if horizontal else m['height']
    for k in range(length):
     if horizontal:sx,sy=k,(0 if direc=='up' else m['height']-1);tx,ty=k-cn['offset'],(t['height']-1 if direc=='up' else 0)
     else:sx,sy=(0 if direc=='left' else m['width']-1),k;tx,ty=(t['width']-1 if direc=='left' else 0),k-cn['offset']
     sc,tc=cell(m,sx,sy,pairs),cell(t,tx,ty,pairs)
     if can_stand(sc) and can_stand(tc):cc.append({'from':[sx,sy],'to':[tx,ty],'requiresSurf':sc['surf'] or tc['surf'],'fromElevation':sc['elevation'],'toElevation':tc['elevation']})
   connections.append({**cn,'contacts':cc})
  events=m['events']
  for event_type in ['objects','coordinates','background']:
   for e in events[event_type]:
    symbol=e.get('symbols',{}).get('script')
    if symbol and symbol not in ['0x0','0']:
     scripts[symbol].append({'mapId':m['id'],'mapName':m['name'],'type':event_type,'index':e['index'],'x':e['x'],'y':e['y'],
                            'localId':e.get('localId'),'flag':e.get('symbols',{}).get('flag')})
  kanto=(m['bank']==1 and m['number']<=95) or (m['bank']==3 and (m['number']<=11 or 19<=m['number']<=44)) or 4<=m['bank']<=30
  runtime[m['id']]={'id':m['id'],'sourceName':m['name'],'symbol':m['symbol'],'legacyIds':reverse[m['id']],
    'w':m['width'],'h':m['height'],'inside':inside,'cave':cave,'kanto':kanto,'tilesetPair':m['tilesetPair'],
    'blocks':m['blocks'],'collision':coll,'elevation':elev,'behavior':beh,'encounterType':enc,'semantic':sem,'suggestedGrid':grid,
    'warps':warps,'connections':connections,'events':events,'border':m['border']}
 dump(p/'runtime-world.json',{'schema':'leafgreen-native-runtime/v1','semanticCodes':SEMANTIC,'maps':runtime})
 dump(p/'door-anchors.json',{'entrances':doors},True);dump(p/'warp-contacts.json',{'warps':allwarps})
 dump(p/'events-by-script.json',dict(sorted(scripts.items())),True)
 missing=[{'nativeId':m['id'],'nativeName':m['sourceName'],'w':m['w'],'h':m['h'],'kanto':m['kanto']} for m in runtime.values() if not m['legacyIds']]
 dump(p/'missing-map-scenarios.json',{'missingFromLegacyCount':len(missing),'kantoMissingCount':sum(m['kanto'] for m in missing),'maps':missing},True)
 dump(p/'integration-validation.json',{'legacyMaps':len(old),'mappedLegacyMaps':len(aliases),'uniqueNativeMapMatches':len({a['nativeId'] for a in aliases}),
   'kantoMaps':sum(m['kanto'] for m in runtime.values()),'doorAnchors':len(doors),'semantics':semantic_counts,
   'warpsWithoutAdjacentTraversableCell':unreachable,'note':'Static contacts ignore NPCs/flags/puzzles; resolve these in story state, never overwrite native collision.'},True)
 print(json.dumps({'mappedLegacyMaps':len(aliases),'kantoMaps':sum(m['kanto'] for m in runtime.values()),'doors':len(doors),
                   'runtimeBytes':(p/'runtime-world.json').stat().st_size,'warpsWithoutAdjacentCell':len(unreachable)},indent=2))

if __name__=='__main__':main()
