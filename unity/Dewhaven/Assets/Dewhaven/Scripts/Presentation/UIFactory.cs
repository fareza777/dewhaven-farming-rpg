using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
namespace Dewhaven
{
    public static class UIFactory
    {
        public static readonly Color Ivory=new Color32(244,239,229,255),Ink=new Color32(58,48,39,255),Bronze=new Color32(130,91,45,255),Muted=new Color32(91,75,58,255),Sand=new Color32(177,153,118,255);
        public static readonly Color ButtonFill=new Color32(225,206,174,255),PrimaryFill=new Color32(112,83,55,255);
        private static Sprite surface,rounded;
        public static TMP_FontAsset BodyFont,HeadingFont;
        public static float FontScale=1;
        public static Sprite Surface()
        {
            if(surface)return surface;
            var texture=new Texture2D(64,128,TextureFormat.RGBA32,false);texture.filterMode=FilterMode.Bilinear;texture.wrapMode=TextureWrapMode.Clamp;
            var colors=new Color[64*128];Color bottom=new Color32(204,181,144,255),top=new Color32(223,207,180,255);
            for(int y=0;y<128;y++)for(int x=0;x<64;x++)
            {
                Color color=Color.Lerp(bottom,top,y/127f);float grain=(((x*37+y*19)%17)/16f-.5f)*.009f;
                colors[y*64+x]=new Color(color.r+grain,color.g+grain,color.b+grain,1);
            }
            texture.SetPixels(colors);texture.Apply();surface=Sprite.Create(texture,new Rect(0,0,64,128),Vector2.one*.5f,100);return surface;
        }
        private static Sprite Rounded()
        {
            if(rounded)return rounded;
            var texture=new Texture2D(32,32,TextureFormat.RGBA32,false);texture.filterMode=FilterMode.Bilinear;
            var colors=new Color[1024];
            for(int y=0;y<32;y++)for(int x=0;x<32;x++)
            {
                float dx=Mathf.Max(Mathf.Abs(x-15.5f)-7.5f,0),dy=Mathf.Max(Mathf.Abs(y-15.5f)-7.5f,0);
                colors[y*32+x]=new Color(1,1,1,Mathf.Clamp01(8.5f-Mathf.Sqrt(dx*dx+dy*dy)));
            }
            texture.SetPixels(colors);texture.Apply();rounded=Sprite.Create(texture,new Rect(0,0,32,32),Vector2.one*.5f,100,0,SpriteMeshType.FullRect,new Vector4(10,10,10,10));return rounded;
        }
        public static void Fonts()
        {
            if(BodyFont)return;
            BodyFont=Resources.Load<TMP_FontAsset>("Dewhaven/Art/Fonts/Nunito");
            HeadingFont=Resources.Load<TMP_FontAsset>("Dewhaven/Art/Fonts/Fraunces");
            if(!BodyFont)BodyFont=TMP_FontAsset.CreateFontAsset(Resources.Load<Font>("Dewhaven/Art/Fonts/nunito-400"));
            if(!HeadingFont)HeadingFont=TMP_FontAsset.CreateFontAsset(Resources.Load<Font>("Dewhaven/Art/Fonts/fraunces-400"));
        }
        public static RectTransform Rect(Transform parent,string name,float x,float y,float width,float height)
        {
            var go=new GameObject(name,typeof(RectTransform));var r=(RectTransform)go.transform;r.SetParent(parent,false);r.anchorMin=r.anchorMax=new Vector2(0,1);r.pivot=new Vector2(0,1);r.anchoredPosition=new Vector2(x,-y);r.sizeDelta=new Vector2(width,height);return r;
        }
        public static RectTransform Fill(Transform parent,string name)
        {
            var r=Rect(parent,name,0,0,0,0);r.anchorMin=Vector2.zero;r.anchorMax=Vector2.one;r.offsetMin=r.offsetMax=Vector2.zero;return r;
        }
        public static Image Image(Transform parent,string name,float x,float y,float width,float height,Sprite sprite=null,Color? color=null)
        {
            var r=Rect(parent,name,x,y,width,height);var image=r.gameObject.AddComponent<Image>();image.sprite=sprite;image.color=IconArt.IsPainted(sprite)?Color.white:color??Color.white;image.raycastTarget=false;return image;
        }
        public static TextMeshProUGUI Text(Transform parent,string text,float x,float y,float width,float height,float size=16,Color? color=null,bool heading=false,TextAlignmentOptions align=TextAlignmentOptions.TopLeft)
        {
            Fonts();var r=Rect(parent,text.Length>35?text.Substring(0,35):text,x,y,width,height);var label=r.gameObject.AddComponent<TextMeshProUGUI>();
            label.font=heading?HeadingFont:BodyFont;label.text=text;label.fontSize=size*(heading?1:FontScale);label.color=color??Ink;label.alignment=align;label.enableAutoSizing=false;label.textWrappingMode=TextWrappingModes.Normal;label.overflowMode=TextOverflowModes.Overflow;label.richText=false;label.raycastTarget=false;label.margin=Vector4.zero;return label;
        }
        public static Button Button(Transform parent,string label,float x,float y,float width,float height,Action clicked,bool primary=false)
        {
            var image=Image(parent,label,x,y,width,height,Rounded(),primary?PrimaryFill:ButtonFill);image.type=UnityEngine.UI.Image.Type.Sliced;image.raycastTarget=true;
            var button=image.gameObject.AddComponent<Button>();button.targetGraphic=image;
            var colors=button.colors;colors.highlightedColor=primary?new Color(.8f,.8f,.8f):new Color(.92f,.88f,.81f);colors.pressedColor=new Color(.75f,.68f,.56f);colors.fadeDuration=.08f;button.colors=colors;
            if(!string.IsNullOrEmpty(label))Text(image.transform,label,6,0,width-12,height,16,primary?Ivory:Ink,false,TextAlignmentOptions.Center);
            button.onClick.AddListener(()=>{if(GameUI.AllowPress){if(clicked!=null)DewhavenGame.Instance?.Sound?.Play("ui");clicked?.Invoke();}});return button;
        }
        public static Button Icon(Transform parent,string icon,float x,float y,float size,Action clicked,Color? tint=null,bool circle=false)
        {
            var b=Button(parent,"",x,y,size,size,clicked);
            if(circle){var background=b.GetComponent<Image>();background.sprite=ArtBank.Shape("circle");background.type=UnityEngine.UI.Image.Type.Simple;background.color=new Color(.90f,.81f,.65f,.90f);}
            var sprite=IconArt.Get(icon);float padding=IconArt.IsPainted(sprite)?5:10;
            var art=Image(b.transform,icon,padding,padding,size-padding*2,size-padding*2,sprite,tint??Ink);art.preserveAspect=true;return b;
        }
        public static TMP_InputField Input(Transform parent,string initial,string placeholder,float x,float y,float width,int limit)
        {
            var bg=Image(parent,placeholder,x,y,width,52,Rounded(),ButtonFill);bg.type=UnityEngine.UI.Image.Type.Sliced;bg.raycastTarget=true;
            var field=bg.gameObject.AddComponent<TMP_InputField>();var viewport=Rect(bg.transform,"Text area",14,4,width-28,44);viewport.gameObject.AddComponent<RectMask2D>();
            var text=Text(viewport,"",0,0,width-28,44,18,Ink,false,TextAlignmentOptions.MidlineLeft);field.textViewport=viewport;field.textComponent=text;field.characterLimit=limit;
            var hint=Text(viewport,placeholder,0,0,width-28,44,18,Muted,false,TextAlignmentOptions.MidlineLeft);field.placeholder=hint;field.text=initial;field.lineType=TMP_InputField.LineType.SingleLine;return field;
        }
        public static Slider Slider(Transform parent,string label,float x,float y,float width,float min,float max,float value,Action<float> change)
        {
            Text(parent,label,x,y,width,28,16);
            var holder=Rect(parent,label+" slider",x,y+30,width,40);var slider=holder.gameObject.AddComponent<Slider>();slider.minValue=min;slider.maxValue=max;
            var bg=Image(holder,"Track",0,17,width,4,null,Sand);
            var fillArea=Rect(holder,"Fill area",0,17,width,4);var fill=Image(fillArea,"Fill",0,0,width,4,null,Bronze);fill.rectTransform.anchorMin=Vector2.zero;fill.rectTransform.anchorMax=Vector2.one;fill.rectTransform.offsetMin=fill.rectTransform.offsetMax=Vector2.zero;
            var handles=Rect(holder,"Handle area",0,8,width,24);var handle=Image(handles,"Handle",0,0,24,0,ArtBank.Shape("circle"),Ink);handle.raycastTarget=true;handle.rectTransform.pivot=Vector2.one*.5f;
            slider.fillRect=fill.rectTransform;slider.handleRect=handle.rectTransform;slider.targetGraphic=handle;slider.direction=UnityEngine.UI.Slider.Direction.LeftToRight;slider.value=value;slider.onValueChanged.AddListener(v=>change(v));return slider;
        }
    }
    public sealed class HeldAction : MonoBehaviour,IPointerDownHandler,IPointerUpHandler,IPointerExitHandler
    {
        public Action Action;
        private bool held;private float repeat;private string previous;
        public void Release(){held=false;repeat=0;previous=null;}
        public void OnPointerDown(PointerEventData e){if(!GameUI.AllowPress)return;held=true;repeat=0;previous=DewhavenGame.Instance.RepeatTarget();Action?.Invoke();}
        public void OnPointerUp(PointerEventData e){held=false;}
        public void OnPointerExit(PointerEventData e){held=false;}
        private void OnDisable(){held=false;}
        private void Update()
        {
            if(!held)return;var game=DewhavenGame.Instance;
            if(!game.Playing||game.Clock.IsPaused||game.Context()!=null){held=false;return;}
            repeat+=Time.unscaledDeltaTime;
            string target=game.RepeatTarget();
            if(repeat>.13f&&!game.Player.Tool.Busy&&target!=null&&target!=previous){repeat=0;previous=target;Action?.Invoke();}
        }
    }
}
