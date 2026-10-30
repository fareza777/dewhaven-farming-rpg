using UnityEngine;
using System;
using System.Linq;
namespace Dewhaven
{
    public static class FarmEquipment
    {
        public static bool Place(GameState s,string item,PlotState plot,Vector2 position,out string message)
        {
            message="";
            if(s.area!="farm"||plot==null||!s.plots.Contains(plot)||Vector2.Distance(WorldView.PlotPosition(plot,s)+Vector2.one*.5f,position)>2){message="Stand beside a growing bed to use this.";return false;}
            if(item=="fertilizer")
            {
                if(plot.fertilizer){message="This bed is already enriched.";return false;}
                if(!InventoryRules.Remove(s,item)){message="No fertilizer in your bag.";return false;}
                plot.fertilizer=true;message="Enriched soil  ·  twice the growth on watered nights";return true;
            }
            if(item!="sprinkler"&&item!="scarecrow"){message="Choose farming equipment.";return false;}
            string key=item+":"+plot.id;
            if(s.equipment.ContainsKey(key)){message="This bed already has one.";return false;}
            if(s.equipment.Count>=16){message="Sixteen pieces are enough for this field.";return false;}
            if(!InventoryRules.Remove(s,item)){message="No "+ContentRegistry.ItemName(item)+" in your bag.";return false;}
            s.equipment[key]=plot.id;s.Count("deployed");Dawn(s);
            message=item=="sprinkler"?"Sprinkler placed  ·  waters nine nearby beds at dawn":"Scarecrow placed  ·  every fifth nearby harvest yields an extra crop";return true;
        }
        public static void Dawn(GameState s)
        {
            // Version-one farms purchased permanent irrigation for the entire field.
            if(s.upgrades.TryGetValue("sprinkler",out int legacy)&&legacy>0)
                foreach(var bed in s.plots)if(bed.tilled)bed.watered=true;
            if(s.equipment==null)return;
            foreach(var placed in s.equipment.Where(p=>p.Key.StartsWith("sprinkler:")))
            {
                var source=s.plots.FirstOrDefault(p=>p.id==placed.Value);if(source==null)continue;var centre=WorldView.PlotPosition(source,s);
                foreach(var p in s.plots)if(p.tilled&&Vector2.Distance(WorldView.PlotPosition(p,s),centre)<1.5f)p.watered=true;
            }
        }
        public static int Yield(GameState s,PlotState plot)
        {
            int n=s.stats.TryGetValue("harvested",out int count)?count:0;if((n+1)%5!=0||s.equipment==null)return 1;
            return s.equipment.Where(p=>p.Key.StartsWith("scarecrow:")).Any(p=>{var source=s.plots.FirstOrDefault(q=>q.id==p.Value);return source!=null&&Vector2.Distance(WorldView.PlotPosition(source,s),WorldView.PlotPosition(plot,s))<=6;})?2:1;
        }
    }
}
