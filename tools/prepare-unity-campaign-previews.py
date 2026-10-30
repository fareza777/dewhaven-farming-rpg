from pathlib import Path
import json,copy
root=Path(__file__).resolve().parents[1]
d=root/'tools/unity-requests'
base=json.loads((d/'capture-title.json').read_text())
stages={
 'campaign-town':'''game.UI.ClosePanel(); typeof(Dewhaven.DewhavenGame).GetProperty("Saves").SetValue(game,new Dewhaven.SaveService(System.IO.Path.Combine(System.IO.Path.GetTempPath(),"Dewhaven-campaign-review"))); game.NewGame("Robin","Amber","look-fieldkeeper",0); game.BeginDay(false); game.State.minute=1100; game.State.totalDays=1; game.State.day=2; game.EnterArea("village",new Vector2(80,61)); game.UI.ShowHud();''',
 'campaign-quay':'''game.UI.ClosePanel(); game.EnterArea("aster-quay",new Vector2(94,75)); game.UI.ShowHud();''',
 'campaign-sunridge':'''game.UI.ClosePanel(); game.EnterArea("sunridge",new Vector2(92,76)); game.UI.ShowHud();''',
 'campaign-briar':'''game.UI.ClosePanel(); game.EnterArea("briar-hollow",new Vector2(82,84)); game.UI.ShowHud();''',
 'campaign-vault':'''game.UI.ClosePanel(); game.State.upgrades["winch"]=1;game.EnterArea("tide-vault-2",new Vector2(28,27));game.UI.ShowHud();''',
 'campaign-puzzle':'''game.UI.ClosePanel(); game.EnterArea("tide-vault-2",new Vector2(6,36));game.UI.Puzzle(game.World.Area.anchors.Find(a=>a.kind=="puzzle"));''',
 'campaign-bond':'''game.UI.ClosePanel();game.State.minute=600;game.EnterArea("market",new Vector2(10,11.2f));game.State.friends["mira"].points=150;game.UI.ShowHud();typeof(Dewhaven.GameUI).GetMethod("Bond",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,new object[]{"mira"});''',
 'campaign-calendar':'''game.UI.ClosePanel();typeof(Dewhaven.GameUI).GetMethod("Calendar",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,null);''',
 'campaign-rabbit':'''game.UI.ClosePanel();game.State.minute=600;game.EnterArea("ranch",new Vector2(11,11.2f));game.UI.Adoption(2);''',
 'campaign-map':'''game.UI.ClosePanel();game.EnterArea("village",new Vector2(80,61));typeof(Dewhaven.GameUI).GetMethod("Map",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,null);''',
}
for name,setup in stages.items():
    v=copy.deepcopy(base);v['arguments']['csharpCode']=v['arguments']['csharpCode'].replace('var camera=game.Camera;','game.Preferences.instantText=true; '+setup+' var camera=game.Camera;').replace('captures/title.png','captures/'+name+'.png')
    (d/('stage-'+name+'.json')).write_text(json.dumps(v),encoding='utf-8')
print('Prepared isolated native campaign captures; save slots are redirected to a temporary review folder.')
