from pathlib import Path
import copy
import json

directory = Path(__file__).resolve().parent / 'unity-requests'
base = json.loads((directory / 'capture-title.json').read_text())
stages = {
    'bag': 'game.UI.ClosePanel(); game.UI.Bag();',
    'menu': 'game.UI.ClosePanel(); game.UI.Menu();',
    'town-map': 'game.UI.ClosePanel(); game.EnterArea("village",new Vector2(58,32)); game.UI.ShowHud(); typeof(Dewhaven.GameUI).GetMethod("Map",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.UI,null);',
    'watering': '''game.UI.ClosePanel(); game.EnterArea("farm",new Vector2(68.5f,43.3f)); game.UI.ShowHud();
game.State.selectedTool="hoe"; game.Act(); game.Player.Tool.Advance(1);
game.State.selectedTool="seed"; game.Act(); game.Player.Tool.Advance(1);
game.State.selectedTool="water"; game.Act(); game.Player.Tool.Advance(.5f);
typeof(Dewhaven.PlayerMotor).GetMethod("Draw",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.Player,new object[]{0f}); game.UI.UpdateHud();''',
}
for name, setup in stages.items():
    value = copy.deepcopy(base)
    value['arguments']['csharpCode'] = value['arguments']['csharpCode'].replace('var camera=game.Camera;', setup + ' var camera=game.Camera;').replace('captures/title.png', 'captures/' + name + '.png')
    (directory / ('stage-' + name + '.json')).write_text(json.dumps(value), encoding='utf-8')
print('Prepared native HUD, sandstone pages and watering captures.')
