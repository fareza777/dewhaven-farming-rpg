using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;
using static Dewhaven.UIFactory;
namespace Dewhaven
{
    public sealed partial class GameUI
    {
        private Image roadFade;
        public void PrepareRoadCrossing()
        {blockedUntil=Time.realtimeSinceStartup+.5f;foreach(var held in hud.GetComponentsInChildren<HeldAction>())held.Release();}
        public void RoadFade(float opacity)
        {
            if(!roadFade)roadFade=Image(toastRoot,"Road transition",0,0,W,H,null,new Color(.83f,.75f,.60f,0));
            roadFade.rectTransform.sizeDelta=new Vector2(W,H);roadFade.transform.SetAsLastSibling();roadFade.color=new Color(.83f,.75f,.60f,Mathf.Clamp01(opacity));roadFade.raycastTarget=opacity>0;roadFade.gameObject.SetActive(opacity>0);
        }
        public void Visitor(JToken person)
        {
            var lines=(JArray)person["dialogue"];int index=(game.State.day+game.State.minute/120)%lines.Count;
            Dialogue(person,(string)lines[index],new[]{"See you around"},_=>ClosePanel());
        }
        public void Landmark(WorldAnchor anchor)
        {Notice(anchor.label,(string)anchor.data?["description"]??"A quiet place along the valley road.");}
    }
}
