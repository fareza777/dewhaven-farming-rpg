using System;
using System.IO;
using static Dewhaven.UIFactory;
namespace Dewhaven
{
    public sealed partial class GameUI
    {
        private void ImportFile()
        {
            if(game.Playing&&!game.Save())return;
            game.Files.Pick(raw=>
            {
                if(raw=="cancel")return;if(raw.StartsWith("error:")){Toast(raw.Substring(6),6);return;}
                var preview=LegacyImporter.Preview(raw);
                if(!preview.Success){Toast(preview.Error,8);return;}
                ImportSlots(preview);
            });
        }
        private void ImportSlots(ImportPreview preview)
        {
            var p=Open("Import this homestead?");var s=preview.Candidate;
            Text(p,s.farmName+" Homestead",24,138,W-48,66,30,Ink,true);
            Text(p,s.playerName+" · Year "+s.year+" · "+CalendarService.Seasons[s.season]+" "+s.day+"\n"+s.gold.ToString("N0")+" gold · "+s.inventory.Count+" bag items",24,228,W-48,112,18,Muted);
            Text(p,"Choose a slot. The imported source file is kept separately.",24,362,W-48,80,18);
            for(int i=0;i<3;i++)
            {
                int slot=i;var existing=game.Saves.Load(slot,out _);
                Action commit=()=>
                {
                    try
                    {
                        if(!game.Saves.Import(slot,preview,out var error)){Toast(error,8);return;}game.Continue(slot);Toast("Homestead imported. Source and replaced files are archived.",5);
                    }
                    catch(IOException){Toast("The import could not be saved. Your current homestead is kept.",6);}
                    catch(UnauthorizedAccessException){Toast("Storage is unavailable. Your current homestead is kept.",6);}
                };
                Button(p,"Slot "+(i+1)+" · "+(existing?.farmName??"Empty"),24,466+i*62,W-48,52,()=>
                {if(game.Saves.HasSlot(slot))Confirm("Replace slot "+(slot+1)+"?","This slot will hold "+s.farmName+" Homestead. A separate copy of the replaced homestead is kept.",commit);else commit();},i==0);
            }
        }
        private void ExportFile()
        {
            if(game.State==null)return;if(!game.Save())return;
            game.Files.Export(game.State,value=>{if(value=="saved")Toast("Homestead exported.");else if(value.StartsWith("error:"))Toast(value.Substring(6),6);});
        }
    }
}
