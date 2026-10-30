using System;
using System.Collections.Generic;
using UnityEngine;
namespace Dewhaven
{
    public static class IconArt
    {
        private static readonly Dictionary<string,Sprite> Cache=new Dictionary<string,Sprite>();
        private static readonly Dictionary<string,Sprite> Painted=new Dictionary<string,Sprite>();
        private static readonly HashSet<string> Missing=new HashSet<string>();
        private static Texture2D texture;
        private static Color[] pixels;
        private static void Pixel(int x,int y,Color color)
        {if(x>=0&&y>=0&&x<64&&y<64)pixels[y*64+x]=color;}
        private static void Line(float x1,float y1,float x2,float y2,int weight=3,Color? color=null)
        {
            int steps=Mathf.CeilToInt(Vector2.Distance(new Vector2(x1,y1),new Vector2(x2,y2))*2);
            for(int i=0;i<=steps;i++){var p=Vector2.Lerp(new Vector2(x1,y1),new Vector2(x2,y2),steps==0?0:i/(float)steps);for(int y=-weight/2;y<=weight/2;y++)for(int x=-weight/2;x<=weight/2;x++)if(x*x+y*y<=weight*weight*.36f)Pixel(Mathf.RoundToInt(p.x)+x,Mathf.RoundToInt(p.y)+y,color??Color.white);}
        }
        private static void Circle(float cx,float cy,float radius,int weight=3)
        {for(int i=0;i<100;i++){float t=i*Mathf.PI*2/100,u=(i+1)*Mathf.PI*2/100;Line(cx+Mathf.Cos(t)*radius,cy+Mathf.Sin(t)*radius,cx+Mathf.Cos(u)*radius,cy+Mathf.Sin(u)*radius,weight);}}
        public static bool IsPainted(Sprite sprite)=>sprite&&sprite.name.StartsWith("hud:");
        public static Sprite Get(string name)
        {
            if(Painted.TryGetValue(name,out var sprite))return sprite;
            if(!Missing.Contains(name))
            {
                var image=Resources.Load<Texture2D>("Dewhaven/Art/Hud/"+name);
                if(image)
                {
                    sprite=Sprite.Create(image,new Rect(0,0,image.width,image.height),Vector2.one*.5f,Mathf.Max(image.width,image.height));
                    sprite.name="hud:"+name;Painted[name]=sprite;return sprite;
                }
                Missing.Add(name);
            }
            return Glyph(name);
        }
        public static Sprite Glyph(string name)
        {
            if(Cache.TryGetValue(name,out var sprite))return sprite;
            pixels=new Color[64*64];texture=new Texture2D(64,64,TextureFormat.RGBA32,false);texture.filterMode=FilterMode.Bilinear;
            switch(name)
            {
                case "hoe":Line(18,12,44,49,4);Line(31,49,52,44,7);break;
                case "water":Line(14,18,40,18);Line(14,18,14,37);Line(14,37,40,37);Line(40,37,40,18);Line(40,25,54,39);Line(48,36,58,41);Circle(19,42,9,3);Line(53,28,53,23,2);Line(59,25,59,20,2);break;
                case "seed":Line(18,13,46,13);Line(18,13,14,44);Line(14,44,48,44);Line(48,44,46,13);Line(20,50,44,50);Line(32,22,32,36,2);Line(32,30,25,35,3);Line(32,33,40,39,3);break;
                case "axe":Line(18,12,41,48,4);Line(31,45,49,56,8);Line(49,56,55,39,6);Line(55,39,39,37,4);break;
                case "pick":Line(20,12,42,48,4);Line(23,46,47,52,5);Line(23,46,14,36,3);Line(47,52,55,43,3);break;
                case "rod":Line(16,12,44,51,3);Line(44,51,53,28,2);Circle(53,24,3,2);break;
                case "bag":Line(16,14,48,14);Line(16,14,13,44);Line(13,44,51,44);Line(51,44,48,14);Line(23,44,25,53);Line(25,53,39,53);Line(39,53,41,44);Line(22,27,42,27,2);break;
                case "map":Line(10,14,25,20);Line(25,20,39,14);Line(39,14,54,20);Line(54,20,54,50);Line(54,50,39,44);Line(39,44,25,50);Line(25,50,10,44);Line(10,44,10,14);Line(25,20,25,50,2);Line(39,14,39,44,2);break;
                case "journal":Line(17,12,49,12);Line(49,12,49,52);Line(49,52,17,52);Line(17,52,17,12);Line(23,12,23,52,2);Line(29,40,41,40,2);Line(29,31,41,31,2);break;
                case "menu":for(int y=20;y<=44;y+=12)Line(16,y,48,y,3);break;
                case "close":Line(19,19,45,45);Line(19,45,45,19);break;
                case "back":Line(46,32,17,32);Line(17,32,30,45);Line(17,32,30,19);break;
                case "coin":Circle(32,32,22,3);Circle(32,32,16,2);Line(32,20,32,44,3);Line(26,40,38,40,2);Line(26,25,38,25,2);break;
                case "settings":Circle(32,32,11);for(int i=0;i<8;i++){float t=i*Mathf.PI/4;Line(32+Mathf.Cos(t)*19,32+Mathf.Sin(t)*19,32+Mathf.Cos(t)*25,32+Mathf.Sin(t)*25,5);}break;
                case "share":Circle(16,32,5);Circle(45,48,5);Circle(45,16,5);Line(21,35,40,45,2);Line(21,29,40,19,2);break;
                case "heart":Line(32,16,13,35,4);Circle(22,40,10,4);Circle(42,40,10,4);Line(51,35,32,16,4);break;
                case "talk":Line(11,23,11,49);Line(11,49,53,49);Line(53,49,53,23);Line(53,23,27,23);Line(27,23,17,13);Line(17,13,17,23);Line(21,37,43,37,2);break;
                case "door":Line(18,12,18,52);Line(18,52,46,52);Line(46,52,46,12);Line(18,12,46,12);Circle(39,31,2);break;
                case "sun":Circle(32,32,12);for(int i=0;i<8;i++){float t=i*Mathf.PI/4;Line(32+Mathf.Cos(t)*19,32+Mathf.Sin(t)*19,32+Mathf.Cos(t)*25,32+Mathf.Sin(t)*25,2);}break;
                default:Line(21,16,21,39);Line(21,39,27,39);Line(27,39,27,48);Line(27,48,33,48);Line(33,48,33,40);Line(33,40,39,40);Line(39,40,39,46);Line(39,46,45,46);Line(45,46,45,25);Line(45,25,37,16);Line(37,16,21,16);break;
            }
            texture.SetPixels(pixels);texture.Apply();sprite=Sprite.Create(texture,new Rect(0,0,64,64),new Vector2(.5f,.5f),64);sprite.name=name;Cache[name]=sprite;return sprite;
        }
        public static Sprite World(string name)
        {
            if(Cache.TryGetValue("world:"+name,out var sprite))return sprite;
            var tex=new Texture2D(16,16,TextureFormat.RGBA32,false);tex.filterMode=FilterMode.Point;var colors=new Color[256];
            for(int y=0;y<16;y++)for(int x=0;x<16;x++)
            {
                Color c=Color.clear;
                if(name=="fence"&&((x==2||x==3||x==12||x==13)&&y<13 || (y==5||y==6||y==10||y==11)))c=(x+y)%3==0?new Color(.57f,.36f,.21f):new Color(.70f,.47f,.29f);
                if(name=="window")c=x<2||x>13||y<2||y>13||x==7||x==8||y==7?new Color(.41f,.29f,.20f):new Color(.73f,.83f,.79f);
                if(name=="soil")c=y==0||y==15||x==0||x==15?new Color(.68f,.50f,.30f):y%4==1?new Color(.54f,.36f,.23f):new Color(.62f,.43f,.27f);
                if(name=="equipment/sprinkler")
                {if(x>5&&x<10&&y<8||y>5&&y<9&&x>2&&x<13)c=new Color(.65f,.48f,.27f);if(y==9&&x>3&&x<12)c=new Color(.64f,.86f,.92f);}
                if(name=="equipment/scarecrow")
                {if(x==7&&y<12||y==9&&x>1&&x<14)c=new Color(.49f,.32f,.18f);if(y>6&&y<12&&x>4&&x<11)c=new Color(.61f,.42f,.26f);if(y>12&&x>4&&x<11||y==12&&x>2&&x<13)c=new Color(.84f,.68f,.34f);}
                if(name.StartsWith("mechanism/"))
                {
                    Color brass=new Color(.75f,.54f,.28f),edge=new Color(.27f,.26f,.25f),shine=new Color(.94f,.78f,.46f);
                    float r=Mathf.Sqrt((x-7.5f)*(x-7.5f)+(y-8)*(y-8));
                    if(y<3&&x>2&&x<13)c=edge;
                    if(name.EndsWith("lever")){if(x>5&&x<10&&y<11)c=brass;if(y>9&&y<13&&x>6&&x<15)c=shine;}
                    else if(name.EndsWith("vent")||name.EndsWith("shutter")){if(x>1&&x<14&&y>3&&y<15)c=y%3==0?edge:brass;}
                    else if(name.EndsWith("reflector")){if(x==7&&y<9)c=brass;if(y>6&&y<14&&x>3&&x<13)c=x+y%3>10?new Color(.67f,.82f,.84f):shine;}
                    else {if(r<6.5f&&r>3.5f)c=brass;if(r<1.8f||Math.Abs(x-7)<1&&r<5||Math.Abs(y-8)<1&&r<5)c=shine;if(name.EndsWith("gear")&&r>5&&r<7.7f&&(x%4<2||y%4<2))c=edge;}
                }
                colors[y*16+x]=c;
            }
            tex.SetPixels(colors);tex.Apply();sprite=Sprite.Create(tex,new Rect(0,0,16,16),new Vector2(.5f,0),16);Cache["world:"+name]=sprite;return sprite;
        }
    }
}
