from pathlib import Path
import copy
import json

directory = Path(__file__).resolve().parent / 'unity-requests'
base = json.loads((directory / 'capture-title.json').read_text())

def request(name, code):
    value = {'name': 'script-execute', 'arguments': {'csharpCode': 'public static class DewhavenReviewCommand { public static object Run() { ' + code + ' } }', 'className': 'DewhavenReviewCommand', 'methodName': 'Run'}}
    (directory / (name + '.json')).write_text(json.dumps(value), encoding='utf-8')

request('short-phone', 'Dewhaven.Editor.EditorBridge.EnsureProject(); return Dewhaven.Editor.BuildProject.SetPortraitGameView(360,640);')
request('normal-phone', 'Dewhaven.Editor.EditorBridge.EnsureProject(); return Dewhaven.Editor.BuildProject.SetPortraitGameView();')
request('intro-background-check', '''
Dewhaven.Editor.EditorBridge.EnsureProject();
var game=Dewhaven.DewhavenGame.Instance;
game.NewGame("Preview","Amber","look-fieldkeeper",1);
if(game.Player.Input!=null)throw new System.Exception("Use a fresh player for the intro lifecycle check.");
var method=typeof(Dewhaven.DewhavenGame).GetMethod("OnApplicationPause",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance);
method.Invoke(game,new object[]{true});method.Invoke(game,new object[]{true});method.Invoke(game,new object[]{false});
if(game.Clock.IsPaused)throw new System.Exception("Intro background pause leaked.");
game.BeginDay(false);
return "First intro can background, save and resume before Player.Setup.";
''')

stages = {
    'dialogue-short': 'game.UI.ClosePanel(); game.Preferences.fontScale=1.35f; Dewhaven.UIFactory.FontScale=1.35f; game.Preferences.instantText=true; game.State.minute=550; game.EnterArea("market",new Vector2(10,11.2f)); game.UI.ShowHud(); game.UI.Conversation("mira");',
    'guide-short': 'game.UI.ClosePanel(); game.UI.Intro(3); typeof(Dewhaven.GameUI).GetMethod("Onboarding",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,null);',
    'looks-short': 'game.UI.Title(); typeof(Dewhaven.GameUI).GetMethod("AppearancePage",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,new object[]{"Robin","Amber"});',
}
for name, setup in stages.items():
    value = copy.deepcopy(base)
    code = value['arguments']['csharpCode'].replace('var camera=game.Camera;', setup + ' var camera=game.Camera;')
    code = code.replace('390,844', '360,640').replace('390f/844f', '360f/640f').replace('captures/title.png', 'captures/' + name + '.png')
    value['arguments']['csharpCode'] = code
    (directory / ('stage-' + name + '.json')).write_text(json.dumps(value), encoding='utf-8')
print('Prepared short portrait captures and first-intro lifecycle request.')
