const fs=require("fs");const vm=require("vm");const sandbox=require("./bench/sandbox");
let src=fs.readFileSync("sweeper.js","utf8");
let [a,b]=process.argv[2].split(",").map(Number);
let sm=Object.create(Math); sm.seedrandom=function(seed){return sandbox.mulberry32(seed);};
let ctx={console,performance,setTimeout,Math:sm,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
let slow=[];
for(let seed=a;seed<=b;seed++){
 let gc={width:30,height:16,bombAmount:99}; let config={isVirtualMode:true,virtualGameConfig:gc};
 ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
 while(true){ let unk=ctx.virtualGame.field.flat().filter(c=>c.isUnknown).length; let t=performance.now(); let r=ctx.sweepPage(true,false,config); t=performance.now()-t;
  if(t>150) slow.push({seed,t:Math.round(t),solver:r.solver,unk});
  if(r.state==="solved"||r.state==="death")break; ctx.executeInteractions(r.interactions,true,true);}
}
console.log(JSON.stringify(slow));
