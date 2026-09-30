const fs=require("fs"),vm=require("vm");const {mulberry32}=require("/home/user/SweeperSolver_2/bench/sandbox");
let m=Object.create(Math);m.seedrandom=function(s){return mulberry32(s)};
let ctx={console,performance,setTimeout,Math:m,document:{addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync("/home/user/SweeperSolver_2/sweeper.js","utf8"),ctx);
let gc={width:30,height:16,bombAmount:99};let cfg={isVirtualMode:true,virtualGameConfig:gc};
outer: for(let seed=1;seed<20;seed++){ctx.setWindowSeedRng();ctx.setSeed(seed);ctx.restartVirtualGame(gc);
for(let i=0;i<300;i++){let r=ctx.sweepPage(true,false,cfg); if(r.state!=="solving"&&r.state!=="start")break; if(r.solver==="3g"&&i>3){ ctx.sweepPage(false,true,cfg); break outer;} ctx.executeInteractions(r.interactions,true,true);}}
