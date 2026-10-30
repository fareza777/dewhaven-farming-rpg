"""Sequential native MCP staging/capture; no parallel editor mutations."""
from pathlib import Path
import subprocess,shutil,json
root=Path(__file__).resolve().parents[1]
def call(name):
 output=root/'tools/.cache'/('review-'+name+'.json')
 result=subprocess.run(['node','tools/unity-mcp.mjs','call','tools/unity-requests/'+name+'.json',str(output)],cwd=root,capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stdout+result.stderr)
 return json.loads(output.read_text())
for area in ['village','aster-quay','sunridge','briar-hollow','saltwind-cliffs']:
 call('compact-stage-'+area);call('compact-capture-normal')
 shutil.copy2(root/'docs/unity/captures/compact-normal.png',root/'docs/unity/captures'/('compact-'+area+'-final.png'))
 print(area+' native capture saved',flush=True)
