const fs=require("fs");const vm=require("vm");const sandbox=require("./bench/sandbox");
let src=fs.readFileSync("sweeper.js","utf8");
let n=Number(process.argv[2]||1000);
let sm=Object.create(Math); sm.seedrandom=function(seed){return sandbox.mulberry32(seed);};
let ctx={console,performance,setTimeout,Math:sm,document:{addEventListener(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
let buckets={}; 
for(let seed=1;seed<=n;seed++){
 let gc={width:30,height:16,bombAmount:99}; let config={isVirtualMode:true,virtualGameConfig:gc};
 ctx.setWindowSeedRng(); ctx.setSeed(seed); ctx.restartVirtualGame(gc);
 while(true){ let field=ctx.virtualGame.field; 
  let pre=null;
  let unk=field.flat().filter(c=>c.isUnknown).length;
  let r=ctx.sweepPage(true,false,config);
  if(r.state==="solved"||r.state==="death")break;
  if(ctx.isGuessingSolver(r.solver) && unk>28 && unk<=80){
    let lw=ctx.sweep(field,99,false,false,true).analysis.logWeight; let cfg=Math.exp(lw);
    let ub = unk<=40?'29-40':unk<=60?'41-60':'61-80';
    let cb = cfg<=2000?'<=2k':cfg<=20000?'<=20k':cfg<=200000?'<=200k':'>200k';
    let k=ub+' '+cb; buckets[k]=(buckets[k]||0)+1;
    // death risk of guess
    let g=r.interactions[0].cell; let died=g.isBomb; if(died){buckets[k+' deaths']=(buckets[k+' deaths']||0)+1;}
  }
  ctx.executeInteractions(r.interactions,true,true);}
}
console.log(Object.fromEntries(Object.entries(buckets).sort()));
