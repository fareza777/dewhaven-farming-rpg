using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Dewhaven
{
    public static class ArtBank
    {
        private static readonly Dictionary<string,Sprite> Sprites=new Dictionary<string,Sprite>();
        public static Material WorldMaterial { get; private set; }
        public static Texture2D Terrain { get; private set; }
        public static void Load()
        {
            if(Sprites.Count>0) return;
            var shader=Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            if(!shader) shader=Shader.Find("Sprites/Default");
            WorldMaterial=Resources.Load<Material>("Dewhaven/Art/WorldMaterial");
            if(!WorldMaterial)WorldMaterial=new Material(shader);
            foreach(var name in new[]{"actors","props","world","furnishings"})
            {
                var texture=Resources.Load<Texture2D>("Dewhaven/Art/Atlases/"+name);
                var json=Resources.Load<TextAsset>("Dewhaven/Art/Atlases/"+name);
                if(!texture || !json) throw new InvalidOperationException("Missing atlas "+name);
                var frames=(JObject)JObject.Parse(json.text)["frames"];
                foreach(var entry in frames.Properties())
                {
                    var f=entry.Value["frame"]; var src=entry.Value["sourceSize"]; var trim=entry.Value["spriteSourceSize"];
                    float w=(float)f["w"], h=(float)f["h"];
                    float foot=entry.Name.StartsWith("farmer/")?24:(float)trim["y"]+h;
                    var pivot=new Vector2(((float)src["w"]*.5f-(float)trim["x"])/w,((float)trim["y"]+h-foot)/h);
                    var sprite=Sprite.Create(texture,new Rect((float)f["x"],texture.height-(float)f["y"]-h,w,h),pivot,16,0,SpriteMeshType.FullRect);
                    sprite.name=entry.Name; Sprites[entry.Name]=sprite;
                }
            }
            Terrain=Resources.Load<Texture2D>("Dewhaven/Art/Atlases/terrain");
            var rabbit=Resources.Load<Texture2D>("Dewhaven/Art/Animals/rabbit");
            if(rabbit)
            {
                rabbit.filterMode=FilterMode.Point;string[] directions={"down","left","right","up"};
                for(int row=0;row<4;row++)for(int frame=0;frame<3;frame++)Sprites["rabbit/"+directions[row]+"/"+frame]=Sprite.Create(rabbit,new Rect(frame*16,rabbit.height-(row+1)*20,16,20),new Vector2(.5f,.1f),16,0,SpriteMeshType.FullRect);
            }
        }
        public static Sprite Get(string name)
        {
            Load(); return Sprites.TryGetValue(name,out var sprite)?sprite:null;
        }
        public static Sprite Item(string id)
        {
            if(id=="scarecrow")return IconArt.World("equipment/scarecrow");
            id=id.EndsWith("_seed")?id.Substring(0,id.Length-5):id;
            if(Sprites.TryGetValue("item:"+id,out var cached)) return cached;
            var texture=Resources.Load<Texture2D>("Dewhaven/Art/Items/"+id);
            if(!texture) return Get((string)ContentRegistry.Items[id]?["frame"]??"room/bin");
            var sprite=Sprite.Create(texture,new Rect(0,0,texture.width,texture.height),new Vector2(.5f,.5f),100);
            Sprites["item:"+id]=sprite; return sprite;
        }
        public static Sprite Painting(string name)
        {
            if(Sprites.TryGetValue("painting:"+name,out var sprite)) return sprite;
            var texture=Resources.Load<Texture2D>("Dewhaven/Art/Cinematics/"+name);
            if(!texture) return null;
            sprite=Sprite.Create(texture,new Rect(0,0,texture.width,texture.height),new Vector2(.5f,.5f),100);
            Sprites["painting:"+name]=sprite; return sprite;
        }
        public static Sprite Portrait(string id)
        {
            if(Sprites.TryGetValue("portrait:"+id,out var sprite))return sprite;
            var texture=Resources.Load<Texture2D>("Dewhaven/Art/Portraits/"+id);
            if(!texture)return null;
            sprite=Sprite.Create(texture,new Rect(0,0,texture.width,texture.height),new Vector2(.5f,.5f),100);
            Sprites["portrait:"+id]=sprite;return sprite;
        }
        public static Sprite Shape(string name)
        {
            if(Sprites.TryGetValue("shape:"+name,out var sprite)) return sprite;
            int size=64; var tex=new Texture2D(size,size,TextureFormat.RGBA32,false); tex.filterMode=FilterMode.Bilinear;
            var pixels=new Color[size*size];
            for(int y=0;y<size;y++) for(int x=0;x<size;x++)
            {
                float dx=(x-31.5f)/31.5f,dy=(y-31.5f)/31.5f;
                float radius=Mathf.Sqrt(dx*dx+dy*dy);
                float alpha=name=="ring"?Mathf.Clamp01((radius-.78f)*30)*Mathf.Clamp01((1-radius)*30):name=="shadow"?Mathf.Clamp01((1-radius)*2)*.5f:Mathf.Clamp01((1-radius)*16);
                pixels[y*size+x]=new Color(1,1,1,alpha);
            }
            tex.SetPixels(pixels);tex.Apply();sprite=Sprite.Create(tex,new Rect(0,0,size,size),new Vector2(.5f,.5f),64);
            Sprites["shape:"+name]=sprite;return sprite;
        }
        public static SpriteRenderer Actor(Transform parent,string name,Vector2 position,float scale=1)
        {
            var go=new GameObject(name);go.transform.SetParent(parent,false);go.transform.position=new Vector3(position.x,-position.y,0);go.transform.localScale=Vector3.one*scale;
            var r=go.AddComponent<SpriteRenderer>();r.sprite=Get(name);r.sharedMaterial=WorldMaterial;r.sortingOrder=Mathf.RoundToInt(position.y*20);return r;
        }
    }
}
