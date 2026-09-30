const fs=require("fs");const vm=require("vm");const sandbox=require("./bench/sandbox");
let src=fs.readFileSync("sweeper.js","utf8");
let sm=Object.create(Math); sm.seedrandom=function(seed){return sandbox.mulberry32(seed);};
let ctx={console,performance,setTimeout,Math:sm,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
let out={};
for(let seed=1;seed<=300;seed++){
 let gc={width:30,height:16,bombAmount:99}; let config={isVirtualMode:true,virtualGameConfig:gc};
 ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
 let steps=0, flagged=false, res='?';
 try{
 while(true){ let r=ctx.sweepPage(true,false,config); steps++;
  if(r.state==="solved"){res=flagged?'solved-after-wrongflag':'solved';break;} if(r.state==="death"){res=flagged?('death-after-wrongflag solver='+ctx.__last):'death';break;}
  ctx.__last=r.solver;
  if(steps===5 && !flagged){ // user misflags a safe unknown cell next to a digit
    let f=ctx.virtualGame.field.flat(); let c=f.find(c=>c.isUnknown&&!c.isBomb&&c.neighbors.some(n=>n.isDigit));
    if(c){c.isFlagged=true;c.isUnknown=false;flagged=true;}
  }
  if(r.interactions.length===0){res='stalled';break;}
  ctx.executeInteractions(r.interactions,true,true);}
 }catch(e){res='error: '+e.message; if(!ctx.__shown){ctx.__shown=1;console.log(seed,e.stack.split('\n').slice(0,8).join('\n'));}}
 out[res]=(out[res]||0)+1;
}
console.log(out);
