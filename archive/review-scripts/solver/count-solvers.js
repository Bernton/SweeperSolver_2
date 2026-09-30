const fs=require("fs");const {createSolver}=require("./bench/sandbox");
const vm=require("vm");
let src=fs.readFileSync(process.argv[2]||"sweeper.js","utf8");
let [w,h,b,n]=(process.argv[3]||"30,16,99,2000").split(",").map(Number);
let s=createSolver(src);
// hack: access context via closure: re-create manually
const sandbox=require("./bench/sandbox");
let ctx;{ // replicate createSolver to get context
 let sm=Object.create(Math); sm.seedrandom=function(seed){return sandbox.mulberry32(seed);};
 ctx={console,performance,setTimeout,Math:sm,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);}
let counts={}, wins=0;
for(let seed=1;seed<=n;seed++){
 let gc={width:w,height:h,bombAmount:b}; let config={isVirtualMode:true,virtualGameConfig:gc};
 ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
 while(true){ let r=ctx.sweepPage(true,false,config);
  if(r.state==="solved"){wins++;break;} if(r.state==="death")break;
  if(ctx.isGuessingSolver(r.solver)){ let unk=ctx.virtualGame.field.flat().filter(c=>c.isUnknown).length; let k=r.solver+(unk<=28?"(<=28)":"(>28)"); counts[k]=(counts[k]||0)+1;}
  ctx.executeInteractions(r.interactions,true,true);}
}
console.log(w,h,b,"games",n,"wins",wins,counts);
console.log(ctx.__stats);
