"""Author native exterior layouts; preserve content IDs and saved farm coordinates."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content'
world=json.loads((CONTENT/'world.json').read_text(encoding='utf-8-sig'))
layouts={}
def area(key,size,entry,roads,water=(),groves=(),clearings=(),homes=(),props=(),fishing=(),dungeon=None):
    layouts[key]=dict(size=size,entry=entry,roads=roads,water=water,groves=groves,clearings=clearings,homes=homes,props=props,fishing=fishing)
    if dungeon: layouts[key]['dungeon']=dungeon
def p(frame,x,y,solid=False,scale=1,id=None,resource=None):
    return dict(frame=frame,position=[x,y],solid=solid,scale=scale,id=id,resource=resource)
def grove(x,y,rx,ry,frame='tree_03',spacing=3.4):return [x,y,rx,ry,frame,spacing]

area('farm',[104,80],[58,55],[
 [[49,40],[52,39],[58,39],[69,39],[80,40]],
 [[58,39],[57,47],[58,54],[64,59],[64,68],[64,77.2]],
 [[2.8,58],[12,58],[23,55],[36,57],[47,54],[58,54]],
 [[64,59],[77,57],[88,58],[94,58],[101.2,58]],
 [[88,58],[90,61],[90,63]]],
 water=[{'ellipse':[93,68,8,6]}],
 groves=[grove(15,17,12,11),grove(31,31,8,13),grove(14,72,11,6),grove(43,70,10,6),grove(89,22,10,11),grove(90,44,8,7),grove(79,71,6,6,'tree_31')],
 clearings=[[52,40,8,4,0],[79,40,6,4,0],[26,55,8,5,0]],
 homes=[['farmhouse','house_05',52,36],['barn','house_19',80,38]],
 props=[p('room/bin',54.7,39,True,1,'shipping'),p('room/table',49,39,True,1,'workbench'),p('room/well',60,44,True,1,'farm-well'),p('room/logpile',46,37,True),p('room/table',25,52,True,.85),p('room/stool',24,53.5),p('room/flowers',27,52),p('room/bin',84,55,True,.8),p('room/wildflowers-b',84,63,False,1.4)],
 fishing=[['farm-pond',90,63]])
area('forest',[80,68],[45,37],[
 [[2.8,38],[13,38],[25,36],[36,39],[45,37],[56,33],[66,28],[77.2,28]],
 [[42,2.8],[42,11],[46,21],[45,37]],
 [[45,37],[54,43],[65,54],[77.2,54]],
 [[31,29],[32,32],[38,35],[45,37]],
 [[16,35],[17,29],[18,26]],
 [[46,21],[52,20],[55,20]]],
 water=[{'ellipse':[15,19,9,6]},{'stream':[[57,4],[60,18],[57,30],[61,43],[58,55],[61,66]],'width':4}],
 groves=[grove(12,9,10,6),grove(31,10,8,7),grove(17,53,14,9),grove(36,56,11,8),grove(69,10,8,7,'tree_15'),grove(71,39,6,7),grove(51,59,6,5)],
 clearings=[[34,31,8,5,0],[45,37,7,5,0],[67,17,5,4,0]],
 homes=[['ranger-house','house_15',31,27]],
 props=[p('room/well',28,31,True,.9),p('room/table',39,31,True,.8),p('room/stool',38,32.5),p('room/stump',18,33,True),p('room/wildflowers-b',40,41,False,1.3)],
 fishing=[['woodland-pool',18,26]])
layouts['forest']['upgradeRoads']=[[[55,20],[59,20],[64,18],[68,17]]]
layouts['forest']['groves'] += [grove(50,26,5,6),grove(38,46,6,5)]
area('lake',[78,68],[23,31],[
 [[2.8,27],[13,27],[23,31],[27,39],[29,48],[38,55],[52,59],[52,65.2]],
 [[2.8,51],[15,51],[23,49],[29,48]],
 [[24,24],[23,27],[23,31]],
 [[27,35],[32,35],[38,35]],
 [[52,59],[58,55],[58,46]],
 [[23,43],[27,43]]],
 water=[{'ellipse':[48,28,19,20]},{'ellipse':[64,35,11,16]}],
 groves=[grove(12,12,10,8),grove(19,61,13,5),grove(70,60,5,5,'tree_15'),grove(71,10,4,5),grove(13,39,7,4)],
 clearings=[[24,27,7,5,0],[24,44,6,4,0]],homes=[['lake-house','house_02',24,22]],
 props=[p('room/table',23,43,True,1,'lakeside-table'),p('room/stool',21.6,44.5),p('room/stool',24.4,44.5),p('room/wildflowers-a',29,27,False,1.3),p('room/lamp',35,36.7,False,.8),p('room/bin',56,54,True,.8)],
 fishing=[['lake-pier',38,35],['south-pier',58,46]])
area('cedar-downs',[68,60],[33,32],[
 [[65.2,32],[54,32],[43,29],[33,32],[32,43],[34,51],[34,57.2]],
 [[33,32],[24,29],[20,25]],[[33,32],[37,36],[42,37]]],
 water=[{'ellipse':[13,19,8,5]}],
 groves=[grove(13,8,9,4),grove(51,12,13,7,'tree_31',4),grove(12,45,8,9,'tree_31',4),grove(51,49,11,7,'tree_31',4),grove(31,14,8,7,'tree_31',4)],
 clearings=[[36,35,8,5,0]],
 props=[p('room/table',36,34,True,1.1),p('room/stool',34.5,35.5),p('room/stool',37.5,35.5),p('room/bin',39,32,True,.8),p('room/flowers',31,38),p('room/wildflowers-b',27,32,False,1.5)],fishing=[['orchard-pool',20,25]])
area('reedwater-marsh',[70,64],[32,33],[
 [[30,2.8],[30,12],[35,22],[32,33],[43,40],[56,43],[67.2,43]],
 [[32,33],[24,35],[19,37]],[[56,43],[59,35],[61,27]]],
 water=[{'ellipse':[18,23,12,8]},{'ellipse':[49,20,12,10]},{'ellipse':[31,50,13,9]},{'ellipse':[59,55,10,6]},{'ellipse':[14,37,5,5]},{'ellipse':[59,27,7,5]}],
 groves=[grove(11,9,6,5,'tree_15',4),grove(13,54,7,5,'tree_15',4),grove(64,9,4,5,'tree_15',4),grove(43,9,5,4,'tree_15',4)],
 clearings=[[43,37,5,4,0]],props=[p('room/table',43,35,True,.85),p('room/stool',42,36.5),p('room/bin',61,39,True,.8)],
 fishing=[['reedwater-bend',19,37],['reedwater-east',61,27]])
area('copperleaf-pass',[66,60],[31,46],[
 [[31,57.2],[31,47],[26,37],[29,28],[30,21],[30,17.2]],
 [[31,47],[44,44],[54,40],[63.2,40]],[[26,37],[20,34],[19,31]]],
 water=[{'ellipse':[13,31,6,5]}],
 groves=[grove(12,12,8,7,'tree_15'),grove(51,16,9,10,'tree_15'),grove(12,49,7,7,'tree_15'),grove(51,52,9,4,'tree_15')],
 clearings=[[30,22,8,6,6]],props=[p('room/logpile',23,24,True,1.1),p('room/bin',37,25,True),p('rock_21',21,39,True,1.5),p('rock_21',39,34,True,1.8)],
 fishing=[['quarry-pool',19,31]],dungeon=['mine-floor-1',30,15])
area('saltwind-cliffs',[64,58],[24,30],[
 [[2.8,34],[13,34],[24,30],[33,25],[43,22],[43,17.2]],
 [[24,30],[24,35],[22,41]],[[33,25],[34,32],[36,35]]],
 water=[{'rect':[0,48,64,10]},{'ellipse':[13,49,18,7]},{'ellipse':[49,51,18,7]}],
 groves=[grove(14,12,9,8,'tree_15',4.2),grove(55,31,5,8,'rock_21',3.2)],
 clearings=[[43,22,8,6,6],[35,33,5,4,0]],
 props=[p('room/table',35,31,True,.85),p('room/stool',34,32.5),p('rock_21',25,39,True,1.5),p('room/wildflowers-b',29,34,False,1.4),p('room/bin',17,36,True,.9)],
 fishing=[['tide-pier',22,41]],dungeon=['tide-vault-1',43,15])
area('ember-trail',[64,60],[28,31],[
 [[25,2.8],[25,12],[20,22],[28,33],[41,33],[44,24],[44,17.2]],
 [[28,33],[23,37],[18,38]]],
 water=[{'ellipse':[14,41,7,5]}],
 groves=[grove(10,12,6,8,'tree_15',4),grove(50,47,8,8,'rock_36',3.3),grove(10,54,6,3,'tree_15'),grove(36,10,5,4,'rock_36',3.5)],
 clearings=[[44,22,8,6,6],[28,32,7,5,0]],
 props=[p('rock_36',32,25,True,1.8),p('rock_36',22,45,True,1.6),p('room/logpile',18,28,True,1.1),p('room/logpile',52,28,True,1.1),p('room/bin',32,36,True,.9)],
 dungeon=['ember-vault-1',44,15])
area('observatory-rise',[64,72],[29,52],[
 [[31,69.2],[31,60],[21,52],[25,43],[42,36],[47,28],[38,22],[38,17.2]]],
 water=[{'ellipse':[12,33,6,7]}],
 groves=[grove(12,62,7,5,'tree_15',4),grove(53,55,6,9,'tree_15'),grove(12,15,7,8,'rock_21',3.6),grove(54,13,5,8,'rock_21',3.5),grove(12,44,5,5,'rock_21',3.2)],
 clearings=[[38,22,8,6,6],[46,31,5,4,0]],
 props=[p('room/table',49,31,True,.85),p('room/stool',48,32.5),p('rock_21',29,48,True,1.5),p('rock_21',38,43,True,1.6),p('room/wildflowers-a',25,58,False,1.3)],
 dungeon=['sky-vault-1',38,15])

for key in ['forest','lake','reedwater-marsh','copperleaf-pass','saltwind-cliffs','ember-trail']:
    for g in layouts[key]['groves']:
        if g[4]=='tree_15':g[4]='tree_31' if key in ['saltwind-cliffs','ember-trail'] else 'tree_03'
offsets={'farm':{'village':64,'forest':58,'lake':58},'forest':{'farm':28,'village':54,'cedar-downs':38,'copperleaf-pass':42},'lake':{'farm':27,'village':51,'reedwater-marsh':52},'cedar-downs':{'forest':32,'sunridge':34},'reedwater-marsh':{'lake':30,'aster-quay':43},'copperleaf-pass':{'forest':31,'briar-hollow':40},'saltwind-cliffs':{'aster-quay':34},'ember-trail':{'sunridge':25},'observatory-rise':{'briar-hollow':31}}
for d in world['exteriors']:
    if d['id'] in layouts:d['size']=layouts[d['id']]['size']
for link in world['passages']:
    for key,other in [('a','b'),('b','a')]:
        if link[key] in offsets:link[key+'Offset']=offsets[link[key]][link[other]]
world['landscapeRevision']=2
towns=json.loads((CONTENT/'towns.json').read_text(encoding='utf-8-sig'))
streets={
'village':[
 [[36,0],[36,10],[34,22],[37,31],[37,38],[34,48],[35,58],[40,65],[56,65],[56,72]],
 [[0,38],[9,38],[19,36],[29,38],[37,38],[45,36],[54,38],[72,38]],
 [[10,17],[19,19],[24,17],[35,20],[47,17],[58,19],[61,17]],
 [[9,38],[10,33],[18,34],[24,33],[32,35],[37,38]],
 [[61,33],[62,38]],
 [[10,51],[20,53],[24,51],[35,52],[47,51],[58,53],[61,51]],
 [[10,51],[8,58],[10,66],[22,67],[24,66],[35,65],[47,66],[56,65]]],
'aster-quay':[
 [[20,0],[20,10],[19,20],[22,30],[26,38],[22,46],[20,51]],
 [[75,36],[66,36],[56,35],[45,37],[36,38],[27,38]],
 [[12,17],[23,19],[28,17],[40,19],[47,17],[59,19],[68,17]],
 [[12,33],[18,35],[28,33],[41,35],[59,33]],
 [[12,48],[25,49],[28,48],[40,50],[47,48],[59,48]],
 [[59,33],[64,26],[68,17]],
 [[0,48],[11,48],[20,51],[35,50],[50,52],[68,50]],
 [[59,48],[62,41],[66,36]]],
'sunridge':[
 [[34,0],[34,10],[31,22],[30,36],[34,44],[39,52],[42,62],[54,64],[54,68]],
 [[30,36],[44,37],[55,36],[68,36]],
 [[10,17],[21,19],[24,17],[34,18],[45,19],[51,17]],
 [[10,17],[10,24],[10,33],[21,35],[30,36]],
 [[42,33],[49,35],[57,33]],
 [[57,49],[49,51],[38,49],[24,49]],
 [[24,49],[22,54],[24,60],[18,64]],
 [[10,62],[18,64],[28,62],[42,62]]],
'briar-hollow':[
 [[0,24],[10,24],[18,24],[18,33],[26,38],[31,38],[35,46],[34,56],[43,63],[59,66]],
 [[52,0],[52,9],[50,18],[39,20],[30,18],[24,17],[21,21],[18,24]],
 [[50,18],[59,17]],
 [[12,33],[19,35],[31,38],[38,35],[46,33]],
 [[0,50],[11,50],[18,52],[28,51],[35,49],[46,51]]]
}
for town in towns:
    town['roads']=streets[town['id']]
    town['bridges']=[]
sites=json.loads((CONTENT/'worksites.json').read_text(encoding='utf-8-sig'))
positions={'flowers-0':[35,37],'flowers-1':[36,35],'flowers-2':[41,26], 'branch-0':[26,28],'branch-1':[43,37],'branch-2':[50,30], 'descent-0':[28,61],'descent-1':[23,49],'descent-2':[40,38], 'survey-0':[27,57],'survey-1':[32,42],'survey-2':[45,29], 'bracket-0':[15,35],'bracket-1':[31,27],'bracket-2':[42,23], 'trail-0':[20,36],'trail-1':[33,40],'trail-2':[50,41],'trail-3':[64,52], 'boardwalk-0':[33,20],'boardwalk-1':[45,40], 'quarry-drain':[23,36]}
for site in sites:
    if site['id'] in positions:site['position']=positions[site['id']]
    if site['frame'].startswith('room/pebbles'):site['frame']='rock_21'
for filename,data in [('world.json',world),('landscapes.json',layouts),('worksites.json',sites),('towns.json',towns)]:
    (CONTENT/filename).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Authored',len(layouts),'landscapes;',len(world['passages']),'reciprocal connections;',len(positions),'relocated worksites.')
