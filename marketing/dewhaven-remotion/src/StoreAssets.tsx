import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile, useVideoConfig} from 'remotion';
import {C, display, KeyMark, sans, SmallCaps} from './design';

export const screenshotCopy = [
  {capture:'01-farm',eyebrow:'A VALLEY TO CALL HOME',headline:'Your farm.\nYour fresh start.'},
  {capture:'02-village',eyebrow:'FOUR TOWNS TO DISCOVER',headline:'Little towns.\nA world of stories.'},
  {capture:'03-lake',eyebrow:'LIFE AT YOUR OWN PACE',headline:'One more cast.\nOne quieter moment.'},
  {capture:'04-barn',eyebrow:'CARE FOR YOUR LITTLE WORLD',headline:'Small friends.\nA place to belong.'},
  {capture:'05-sunridge',eyebrow:'WANDER A LITTLE FURTHER',headline:'Take the\nscenic route.'},
  {capture:'06-forest',eyebrow:'BEYOND YOUR FARM GATE',headline:'Leave the road.\nFind your own story.'},
  {capture:'07-vault',eyebrow:'THE VALLEY HAS ITS SECRETS',headline:'A quiet valley.\nA hidden mystery.'},
  {capture:'09-journal',eyebrow:'A STORY THAT BECOMES YOURS',headline:'Every day writes\na new chapter.'},
];

export const StoreScreenshot: React.FC<{index:number}> = ({index}) => {
  const copy=screenshotCopy[index];
  return <AbsoluteFill style={{backgroundColor:C.deep,color:C.ivory,fontFamily:sans,overflow:'hidden'}}>
    <div style={{position:'absolute',left:0,top:300,width:1080,height:1620}}><CanvasImage src={staticFile(`stills/${copy.capture}.png`)} style={{width:1080,height:1620,imageRendering:'pixelated'}}/></div>
    <div style={{position:'absolute',top:0,left:0,width:1080,height:300,background:`linear-gradient(120deg,${C.deep},${C.pine})`,borderBottom:`3px solid ${C.gold}`}}/>
    <div style={{position:'absolute',left:68,top:38,display:'flex',alignItems:'center',gap:20}}><KeyMark size={48}/><SmallCaps style={{fontSize:18,letterSpacing:3.5}}>{copy.eyebrow}</SmallCaps></div>
    <div style={{position:'absolute',right:68,top:38,fontSize:18,color:C.mist,letterSpacing:3}}>{String(index+1).padStart(2,'0')} / 08</div>
    <div style={{position:'absolute',left:68,top:99,right:60,fontFamily:display,fontSize:index===4?91:index===2||index===5?79:84,lineHeight:1.04,letterSpacing:-2.5,whiteSpace:'pre-line'}}>{copy.headline}</div>
  </AbsoluteFill>;
};

export const FeatureGraphic: React.FC = () => {
  const {width,height}=useVideoConfig();const s=width/1024;const tall=height/width>.55;
  return <AbsoluteFill style={{backgroundColor:C.pine,color:C.ivory,fontFamily:sans}}>
    <CanvasImage src={staticFile('art/key-art.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(5,27,24,.42),rgba(5,27,24,0) 75%)'}}/>
    <div style={{position:'absolute',left:72*s,top:(tall?height*.26:height*.22),width:550*s}}>
      <KeyMark size={68*s}/>
      <SmallCaps style={{fontSize:11*s,letterSpacing:3.5*s,marginTop:15*s}}>A VALLEY TO CALL HOME</SmallCaps>
      <div style={{fontFamily:display,fontSize:79*s,lineHeight:1.15,letterSpacing:-3*s,marginTop:8*s}}>Dewhaven</div>
      <div style={{fontFamily:display,fontSize:25*s,lineHeight:1.24,marginTop:10*s}}>A quiet life.<br/>A hidden adventure.</div>
    </div>
  </AbsoluteFill>;
};

export const AppIcon: React.FC = () => <AbsoluteFill><CanvasImage src={staticFile('art/icon.png')} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;

export const CampaignBoard: React.FC = () => <AbsoluteFill style={{backgroundColor:'#e9e0ce',fontFamily:sans,padding:60,color:C.ink}}>
  <div style={{display:'flex',alignItems:'center',gap:28,height:185}}><CanvasImage src={staticFile('art/icon.png')} style={{width:160,height:160,borderRadius:30}}/><div><SmallCaps style={{color:'#6d795f',fontSize:20}}>DEWHAVEN · ENGLISH STORE COLLECTION</SmallCaps><div style={{fontFamily:display,fontSize:61,letterSpacing:-2,marginTop:12}}>A quiet life. A hidden adventure.</div><div style={{fontSize:21,marginTop:12,color:'#657264'}}>Native gameplay · Original key art · No face portraits</div></div></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:28,marginTop:30}}>
    {screenshotCopy.map((_,i)=><CanvasImage key={i} src={staticFile(`exports/${String(i+1).padStart(2,'0')}.png`)} style={{width:309,height:549.333,boxShadow:'0 9px 30px #2037281c'}}/>)}
  </div>
</AbsoluteFill>;
