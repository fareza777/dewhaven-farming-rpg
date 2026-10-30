using System;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
namespace Dewhaven
{
    public sealed class NarrationPage { public string Text;public string[] Clips; }
    public static class NarrationCatalog
    {
        private static Dictionary<string,string> paths;
        public static JToken Entry(string key)=>string.IsNullOrEmpty(key)?null:ContentRegistry.Read("voiceover")["entries"].FirstOrDefault(e=>(string)e["key"]==key);
        public static bool Matches(string key,string text)=>Entry(key)?["text"]?.ToString()==text;
        public static string ClipPath(string id)
        {
            if(paths==null)paths=ContentRegistry.Read("voiceover")["entries"].SelectMany(e=>e["segments"]).GroupBy(s=>(string)s["id"]).ToDictionary(g=>g.Key,g=>(string)g.First()["path"]);
            return id!=null&&paths.TryGetValue(id,out var path)?path:null;
        }
        public static List<NarrationPage> Pages(string key,Func<string,bool> fits)
        {
            var result=new List<NarrationPage>();var entry=Entry(key);if(entry==null)return result;
            var clips=new List<string>();string current="";
            foreach(var segment in entry["segments"])
            {
                string text=(string)segment["text"],candidate=current.Length==0?text:current+" "+text;
                if(current.Length>0&&!fits(candidate)){result.Add(new NarrationPage{Text=current,Clips=clips.ToArray()});current="";clips.Clear();}
                current=current.Length==0?text:current+" "+text;clips.Add((string)segment["id"]);
            }
            if(current.Length>0)result.Add(new NarrationPage{Text=current,Clips=clips.ToArray()});return result;
        }
    }
}
