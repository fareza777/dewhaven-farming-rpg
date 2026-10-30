import React from 'react';
import {AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, display, KeyMark, sans, SmallCaps} from '../design';

export const EndCard: React.FC = () => {
  const f=useCurrentFrame();const {width,height,fps}=useVideoConfig();const portrait=height>width;
  return <AbsoluteFill style={{backgroundColor:C.deep,color:C.ivory,fontFamily:sans,overflow:'hidden'}}>
    <CanvasImage src={staticFile('art/key-art.png')} premountFor={fps} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',objectPosition:portrait?'74% center':'center',scale:interpolate(f,[0,3*fps],[1.06,1],{extrapolateRight:'clamp'})}}/>
    <AbsoluteFill style={{background:portrait?'linear-gradient(0deg,rgba(6,24,20,.95),rgba(6,24,20,.1) 65%),linear-gradient(180deg,rgba(6,24,20,.7),transparent 35%)':'linear-gradient(90deg,rgba(6,24,20,.78),rgba(6,24,20,.15) 75%)'}}/>
    <div style={{position:'absolute',left:portrait?72:128,top:portrait?100:208,width:portrait?936:950,opacity:interpolate(f,[0,12],[0,1],{extrapolateRight:'clamp'}),translate:interpolate(f,[0,22],['0px 24px','0px 0px'],{extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>
      <KeyMark size={portrait?120:132}/>
      <SmallCaps style={{marginTop:26,fontSize:portrait?24:24}}>A VALLEY TO CALL HOME</SmallCaps>
      <div style={{fontFamily:display,fontSize:portrait?166:205,lineHeight:1.1,letterSpacing:-7,marginTop:20}}>Dewhaven</div>
      <div style={{fontFamily:display,fontSize:portrait?59:60,lineHeight:1.24,marginTop:portrait?18:28,color:C.ivory}}>A quiet life.<br/>A hidden adventure.</div>
    </div>
    {portrait&&<div style={{position:'absolute',left:72,bottom:150,right:72,display:'flex',gap:28,alignItems:'center'}}><CanvasImage src={staticFile('art/icon.png')} premountFor={fps} style={{width:146,height:146,borderRadius:28}}/><div style={{fontSize:30,lineHeight:1.5,color:C.ivory}}>Farming • Friendship • Discovery<br/><span style={{fontSize:25,color:C.mist}}>An original valley life adventure</span></div></div>}
    {!portrait&&<SmallCaps style={{position:'absolute',left:135,bottom:105,fontSize:22,color:C.ivory,letterSpacing:4,opacity:.85}}>FARMING · FRIENDSHIP · DISCOVERY</SmallCaps>}
    {Array.from({length:22},(_,i)=><div key={i} style={{position:'absolute',width:3+(i%3),height:3+(i%3),borderRadius:'50%',left:(i*193+87)%width,top:((i*271+72)%height)-f*(.25+i%4*.12),backgroundColor:C.gold,opacity:.12+(i%4)*.05}}/>)}
  </AbsoluteFill>;
};
