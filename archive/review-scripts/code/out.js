const fs=require("fs"),vm=require("vm");const {mulberry32}=require("/home/user/SweeperSolver_2/bench/sandbox");
let m=Object.create(Math);m.seedrandom=function(s){return mulberry32(s)};
let ctx={console,performance,setTimeout,Math:m,document:{addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js","utf8"),ctx);
let gc={width:30,height:16,bombAmount:99};ctx.setWindowSeedRng();ctx.setSeed(5);ctx.restartVirtualGame(gc);
let cfg={isVirtualMode:true,virtualGameConfig:gc};
for(let i=0;i<200;i++){let r=ctx.sweepPage(true,false,cfg); if(ctx.isGuessingSolver(r.solver)&&r.state==="solving"&&i>0){ console.log("=== stuck output:"); ctx.sweepPage(false,true,cfg); break;} ctx.executeInteractions(r.interactions,true,true);}
// median bug
console.log(vm.runInContext("(function(){ let v=[5,1,3]; let s=v.slice(0).sort((a,b)=>a-b); let h=Math.floor(s.length/2); return v.length%2? v[h] : 0;})()",ctx));
// endgame budget null
vm.runInContext("console.log('null budget:', enumerateEndgameConfigurations(3,1,[],[[],[],[]],null))",ctx);
