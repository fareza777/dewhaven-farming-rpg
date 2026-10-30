import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const csharpCode=fs.readFileSync(path.join(import.meta.dirname,'CaptureCampaign.cs'),'utf8');
fs.writeFileSync(path.join(import.meta.dirname,'native-capture-request.json'),JSON.stringify({name:'script-execute',arguments:{csharpCode,className:'DewhavenCampaignCapture',methodName:process.argv.includes('--farm')?'RunFarm':'Run'}},null,2));
