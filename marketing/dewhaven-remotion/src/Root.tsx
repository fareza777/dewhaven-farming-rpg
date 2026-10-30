import React from 'react';
import {Composition, Folder, Still} from 'remotion';
import {Campaign} from './Campaign';
import {AppIcon, CampaignBoard, FeatureGraphic, StoreScreenshot} from './StoreAssets';
import {Opening} from './scenes/Opening';
import {Secret} from './scenes/Secret';
import {Grow} from './scenes/Grow';
import {Towns} from './scenes/Towns';
import {Quiet} from './scenes/Quiet';
import {Companions} from './scenes/Companions';
import {Paths} from './scenes/Paths';
import {Discovery} from './scenes/Discovery';
import {Home} from './scenes/Home';
import {EndCard} from './scenes/EndCard';

export const RemotionRoot: React.FC = () => <>
  <Composition id="Dewhaven-Landscape" component={Campaign} durationInFrames={900} fps={30} width={1920} height={1080}/>
  <Composition id="Dewhaven-Vertical" component={Campaign} durationInFrames={900} fps={30} width={1080} height={1920}/>
  <Folder name="Play-Store">
    <Still id="App-Icon-512" component={AppIcon} width={512} height={512}/>
    <Still id="App-Icon-1024" component={AppIcon} width={1024} height={1024}/>
    <Still id="Feature-Graphic" component={FeatureGraphic} width={1024} height={500}/>
    <Still id="Banner-Master" component={FeatureGraphic} width={2048} height={1000}/>
    <Still id="Banner-YouTube" component={FeatureGraphic} width={1920} height={1080}/>
    <Still id="Screenshot-01" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:0}}/>
    <Still id="Screenshot-02" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:1}}/>
    <Still id="Screenshot-03" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:2}}/>
    <Still id="Screenshot-04" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:3}}/>
    <Still id="Screenshot-05" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:4}}/>
    <Still id="Screenshot-06" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:5}}/>
    <Still id="Screenshot-07" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:6}}/>
    <Still id="Screenshot-08" component={StoreScreenshot} width={1080} height={1920} defaultProps={{index:7}}/>
    <Still id="Collection-Overview" component={CampaignBoard} width={1440} height={1410}/>
  </Folder>
  <Folder name="Editable-Scenes">
    <Composition id="Opening-Hook" component={Opening} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="The-Secret" component={Secret} width={1920} height={1080} fps={30} durationInFrames={60}/>
    <Composition id="Grow-A-Life" component={Grow} width={1920} height={1080} fps={30} durationInFrames={105}/>
    <Composition id="Four-Towns" component={Towns} width={1920} height={1080} fps={30} durationInFrames={105}/>
    <Composition id="Find-Your-Quiet" component={Quiet} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="Little-Friends" component={Companions} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="Woodland-Paths" component={Paths} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="Hidden-Vault" component={Discovery} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="Homecoming" component={Home} width={1920} height={1080} fps={30} durationInFrames={90}/>
    <Composition id="End-Card" component={EndCard} width={1920} height={1080} fps={30} durationInFrames={90}/>
  </Folder>
</>;
