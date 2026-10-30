using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    public static class ContentRegistry
    {
        private static readonly Dictionary<string,JToken> Cache=new Dictionary<string,JToken>();
        public static JToken Read(string name)
        {
            if(Cache.TryGetValue(name,out var value)) return value;
            var asset=Resources.Load<TextAsset>("Dewhaven/Content/"+name);
            if(!asset) throw new InvalidOperationException("Missing bundled content: "+name);
            value=JToken.Parse(asset.text); Cache[name]=value; return value;
        }
        public static JObject Items => (JObject)Read("simulation")["items"];
        public static JObject Crops => (JObject)Read("simulation")["crops"];
        public static JArray Residents => (JArray)Read("residents");
        public static JArray Towns => (JArray)Read("towns");
        public static JArray Interiors => (JArray)Read("interiors");
        public static JArray Shops => (JArray)Read("shops");
        public static HashSet<string> AreaIds => new HashSet<string>(Read("world")["exteriors"].Select(x=>(string)x["id"]).Concat(Interiors.Select(x=>(string)x["id"]))
            .Concat(Read("dungeons").SelectMany(d=>d["chambers"].Select(x=>(string)x["id"]))).Concat(Enumerable.Range(1,5).Select(i=>"mine-floor-"+i)));
        public static JToken Find(JArray list,string id) => list.FirstOrDefault(x=>(string)x["id"]==id);
        public static string Text(JToken token) => token==null?"": token.Type==JTokenType.Object?(string)token["en"]??"":(string)token;
        public static string ItemName(string id) => Text(Items[id]?["name"]);
        public static int SellPrice(string id) => (int?)Items[id]?["sell"]??0;
    }
}
