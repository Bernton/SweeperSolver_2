const fs=require("fs"), vm=require("vm");
const {mulberry32}=require("/home/user/SweeperSolver_2/bench/sandbox");
const src='"use strict";\n'+fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js","utf8");
let sm=Object.create(Math); sm.seedrandom=function(s){return mulberry32(s);};
let ctx={console:{log(){},warn(){}}, performance, setTimeout, Math:sm, document:{addEventListener(){},removeEventListener(){}}, prompt:null};
ctx.window=ctx; vm.createContext(ctx);
try{vm.runInContext(src,ctx);}catch(e){console.log("load:",e.message)}
const board={width:30,height:16,bombAmount:99}; const config={isVirtualMode:true,virtualGameConfig:board};
for(let seed=1;seed<=50;seed++){ try{
  ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(board);
  while(true){ let r=ctx.sweepPage(true,true,config); if(r.state==="solved"||r.state==="death")break; ctx.executeInteractions(r.interactions,true,true);} }catch(e){console.log(seed,e.message);break;}}
console.log("done");
