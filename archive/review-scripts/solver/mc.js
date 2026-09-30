const fs=require("fs");const vm=require("vm");const sandbox=require("./bench/sandbox");
let src=fs.readFileSync("instr2.js","utf8");
let [w,h,b,n]=process.argv[2].split(",").map(Number);
let sm=Object.create(Math); sm.seedrandom=function(seed){return sandbox.mulberry32(seed);};
let ctx={console,performance,setTimeout,Math:sm,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
for(let seed=1;seed<=n;seed++){
 let gc={width:w,height:h,bombAmount:b}; let config={isVirtualMode:true,virtualGameConfig:gc};
 ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
 while(true){ let r=ctx.sweepPage(true,false,config); if(r.state==="solved"||r.state==="death")break; ctx.executeInteractions(r.interactions,true,true);}
}
console.log(process.argv[2],"max log10 mergedCount",ctx.__maxMC.toFixed(1),"max border cells",ctx.__maxBorder);
