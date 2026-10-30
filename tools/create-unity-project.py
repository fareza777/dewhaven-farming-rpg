"""Create an isolated project from the installed Unity 2D URP template.
Never writes to source projects or the shared MCP editor.
"""
from pathlib import Path
import json, shutil, tarfile

root = Path(__file__).resolve().parent.parent
project = root / 'unity/Dewhaven'
template = Path('C:/Program Files/Unity/Hub/Editor/6000.3.20f1/Editor/Data/Resources/PackageManager/ProjectTemplates/com.unity.template.2d-cross-platform-2d-6.1.2.tgz')
if (project / 'ProjectSettings/ProjectVersion.txt').exists():
    raise SystemExit('Project already exists; refusing to replace it.')
project.mkdir(parents=True, exist_ok=True)
with tarfile.open(template, 'r:gz') as archive:
    prefix = 'package/ProjectData~/'
    for member in archive.getmembers():
        if not member.name.startswith(prefix) or not member.isfile():
            continue
        relative = Path(member.name[len(prefix):])
        destination = (project / relative).resolve()
        if not destination.is_relative_to(project.resolve()):
            raise ValueError('Invalid template path')
        destination.parent.mkdir(parents=True, exist_ok=True)
        with archive.extractfile(member) as source, destination.open('wb') as target:
            shutil.copyfileobj(source, target)
(project / 'ProjectSettings/ProjectVersion.txt').write_text('m_EditorVersion: 6000.3.20f1\nm_EditorVersionWithRevision: 6000.3.20f1 (bcd65621d8ba)\n')
manifest = {
    'dependencies': {
        'com.unity.2d.sprite': '1.0.0',
        'com.unity.2d.tilemap': '1.0.0',
        'com.unity.inputsystem': '1.17.0',
        'com.unity.render-pipelines.universal': '17.3.0',
        'com.unity.ugui': '2.0.0',
        'com.unity.test-framework': '1.6.0',
        'com.unity.nuget.newtonsoft-json': '3.2.2',
        'com.ivanmurzak.unity.mcp': '0.93.4',
        **{f'com.unity.modules.{m}': '1.0.0' for m in ['androidjni','animation','audio','imageconversion','imgui','jsonserialize','particlesystem','physics2d','screencapture','tilemap','ui','uielements','unitywebrequest','unitywebrequestassetbundle','unitywebrequestaudio','unitywebrequesttexture']}
    },
    'scopedRegistries': [{'name':'OpenUPM','url':'https://package.openupm.com','scopes':['com.ivanmurzak','extensions.unity']}]
}
(project / 'Packages/manifest.json').write_text(json.dumps(manifest, indent=2))
settings = project / 'UserSettings'
settings.mkdir(exist_ok=True)
(settings / 'AI-Game-Developer-Config.json').write_text(json.dumps({
    'host':'http://127.0.0.1:8094','keepConnected':True,'KeepServerRunning':False,
    'ConnectionMode':'Custom','AuthOption':'none','TransportMethod':'streamableHttp',
    'LogLevel':3,'GenerateSkillFiles':False,'tools':[],'prompts':[],'resources':[]
}, indent=2))
for directory in ['Scripts/Core','Scripts/World','Scripts/Characters','Scripts/Presentation','Scripts/Simulation','Scripts/Persistence','Scripts/Residents','Scripts/Audio','Editor','Tests/EditMode','Scenes','Resources/Dewhaven/Art','Resources/Dewhaven/Content']:
    (project / 'Assets/Dewhaven' / directory).mkdir(parents=True, exist_ok=True)
(project / '.gitignore').write_text('/Library/\n/Temp/\n/Obj/\n/Logs/\n/UserSettings/\n/Builds/\n/.vs/\n*.csproj\n*.sln\n')
print(json.dumps({'project':str(project),'template':str(template),'mcp':'http://127.0.0.1:8094','isolated':True}))
