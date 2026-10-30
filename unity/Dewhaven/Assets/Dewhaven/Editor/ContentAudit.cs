using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class ContentAudit
    {
        public static string Run()
        {
            EditorBridge.EnsureProject();var s=GameState.New("Survey","Valley","look-fieldkeeper");
            s.upgrades["bridge"]=1;s.upgrades["winch"]=1;s.upgrades["quarry"]=1;s.upgrades["upper-stair"]=1;
            var ids=ContentRegistry.Read("world")["exteriors"].Select(x=>(string)x["id"]).Concat(ContentRegistry.Interiors.Select(x=>(string)x["id"]))
                .Concat(ContentRegistry.Read("dungeons").SelectMany(x=>x["chambers"].Select(r=>(string)r["id"]))).Concat(Enumerable.Range(1,5).Select(i=>"mine-floor-"+i)).ToArray();
            foreach(var d in ContentRegistry.Read("dungeons"))for(int i=2;i<=4;i++)s.mechanisms[(string)d["id"]+":system-"+i]=1;
            var issues=new List<string>();int anchors=0;
            foreach(string id in ids)
            {
                try
                {
                    var a=RegionAuthoring.Create(id,s);var start=NavGrid.Nearest(a,new Vector2Int((int)a.entry.x,(int)a.entry.y));
                    var seen=new HashSet<Vector2Int>{start};var queue=new Queue<Vector2Int>();queue.Enqueue(start);
                    while(queue.Count>0)
                    {
                        var p=queue.Dequeue();foreach(var d in new[]{Vector2Int.up,Vector2Int.right,Vector2Int.down,Vector2Int.left})
                        {var n=p+d;if(a.Walkable(n.x,n.y)&&seen.Add(n))queue.Enqueue(n);}
                    }
                    foreach(var anchor in a.anchors)
                    {
                        anchors++;bool near=seen.Any(p=>Vector2.Distance(new Vector2(p.x+.5f,p.y+.5f),anchor.position)<=anchor.range);
                        if(!near)issues.Add(id+" / "+anchor.kind+":"+anchor.id+" unreachable at "+anchor.position);
                        if((anchor.kind=="door"||anchor.kind=="travel"||anchor.kind=="dungeon")&&!ids.Contains(anchor.target))issues.Add(id+" unknown destination "+anchor.target);
                    }
                }
                catch(Exception e){issues.Add(id+": "+e.Message);}
            }
            foreach(var q in QuestService.All)foreach(var r in q["requirements"])
                if(r["item"]!=null&&ContentRegistry.Items[(string)r["item"]]==null)issues.Add("Unknown quest item: "+(string)q["id"]);
            foreach(var scene in ContentRegistry.Read("bond-scenes"))if(!ids.Contains((string)scene["area"]))issues.Add("Unknown bond venue "+(string)scene["id"]);
            string json=JsonConvert.SerializeObject(new{areas=ids.Length,anchors,quests=QuestService.All.Count,bonds=ContentRegistry.Read("bond-scenes").Count(),issues},Formatting.Indented);
            File.WriteAllText("../../docs/unity/content-audit.json",json);return json;
        }
    }
}
