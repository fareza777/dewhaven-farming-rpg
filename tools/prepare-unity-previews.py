from pathlib import Path
import json,copy
directory=Path(__file__).resolve().parent/'unity-requests'
base=json.loads((directory/'capture-title.json').read_text())
stages={
    'title': 'Application.runInBackground=true; game.UI.Title();',
    'bedroom': 'Application.runInBackground=true; game.Preferences.fontScale=1; Dewhaven.UIFactory.FontScale=1; game.NewGame("Robin","Amber","look-fieldkeeper",0); game.BeginDay(false);',
    'farm': 'game.UI.ClosePanel(); game.EnterArea("farm",new Vector2(63,46)); game.UI.ShowHud();',
    'town': 'game.UI.ClosePanel(); game.State.minute=550; game.EnterArea("village",new Vector2(58,32)); game.UI.ShowHud();',
    'seedhouse': 'game.UI.ClosePanel(); game.State.minute=550; game.EnterArea("market",new Vector2(10,12)); game.UI.ShowHud();',
    'shop': 'game.UI.ClosePanel(); game.State.minute=550; game.EnterArea("market",new Vector2(10,11.2f)); game.UI.ShowHud(); game.UI.Shop(game.World.Area.anchors.Find(x=>x.kind=="shop"));',
}
for name,setup in stages.items():
    value=copy.deepcopy(base)
    code=value['arguments']['csharpCode']
    code=code.replace('var camera=game.Camera;',setup+' var camera=game.Camera;').replace('captures/title.png','captures/'+name+'.png')
    value['arguments']['csharpCode']=code
    (directory/('stage-'+name+'.json')).write_text(json.dumps(value),encoding='utf-8')
stop={'name':'script-execute','arguments':{'csharpCode':'Dewhaven.Editor.EditorBridge.EnsureProject(); UnityEditor.EditorApplication.isPlaying=false;','isMethodBody':True}}
(directory/'stop.json').write_text(json.dumps(stop))
print('Prepared six dedicated-editor preview requests.')
