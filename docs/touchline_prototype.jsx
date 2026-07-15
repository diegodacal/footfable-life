import { useState, useEffect, useRef } from "react";

/* =====================================================================
   TOUCHLINE — playable vertical slice
   A first-person football career RPG. Pick a prospect, train week to week,
   earn selection on merit, play matches that also develop you, climb the
   status ladder, finish a season. In-memory mockup (no save between reloads).
   All numbers marked T.* are tunable placeholders.
   ===================================================================== */

const C = {
  ink: "#0E1A2B",
  panel: "#16273D",
  panel2: "#1E3555",
  line: "#294a70",
  chalk: "#EAF1F8",
  muted: "#8AA0B8",
  pitch: "#35C46B",
  pitchDim: "#1f7a45",
  flood: "#F5C518",
  red: "#FF6B6B",
};

const T = {
  BASE_TRAIN: 0.13,
  SECONDARY_W: 0.4,
  BASE_MATCH: 0.07,
  FRESH_RECOVER: 46,
  DECISION_CHANCE: 0.22,
  LOAN_WEEK: 12,
  INTENSITY: {
    Intensive: { gain:1.7, fresh:14, freshRest:18, injMatch:0.10, injRest:0.03 },
    Balanced:  { gain:1.0, fresh:30, freshRest:34, injMatch:0.015, injRest:0.004 },
    Recover:   { gain:0.35,fresh:46, freshRest:50, injMatch:0,     injRest:0 },
  },
};

const ATTRS = ["finishing","passing","control","pace","strength","stamina","composure","positioning"];
const ATTR_LABEL = { finishing:"Finishing", passing:"Passing", control:"Control", pace:"Pace", strength:"Strength", stamina:"Stamina", composure:"Composure", positioning:"Positioning" };
const PROGRAMS = { Technical:["finishing","passing","control"], Physical:["pace","strength","stamina"], Mental:["composure","positioning"] };

const POS = {
  ST: { label:"Striker", w:{finishing:5,pace:4,composure:4,control:3,strength:2,passing:1,positioning:1,stamina:1} },
  CM: { label:"Midfielder", w:{passing:5,stamina:4,composure:4,control:3,positioning:2,pace:1,strength:1,finishing:1} },
  CB: { label:"Centre-back", w:{strength:5,positioning:5,pace:4,composure:3,stamina:2,control:1,passing:1,finishing:1} },
};
const LADDER = ["Youth","Backup","Rotation","Regular","Star"];

const FIRST = ["Léo","Kaito","Diego","Amir","Tariq","Rui","Mateo","Jun","Bilal","Omar","Thabo","Nabil","Enzo","Sipho","Youssef","Hiro","Ivan","Karim","Paulo","Musa"];
const LAST = ["Marques","Tanaka","Herrera","Benali","El Amrani","Costa","Okafor","Silva","Ndlovu","Rahmani","Vidal","Sato","Diallo","Reyes","Bouchra","Mensah","Cruz","Haddad","Nakamura","Adeyemi"];
const CLUBS = ["Vela FC","Aurora City","Real Palma","Nórdico","Kaizen SC","Atlético Sur","Monsoon United","Cedar Rovers","Ibis Athletic","Sable Town","Delta Star","Verano CF","Granite FC","Halcón","Zephyr United"];

const rnd = (a,b)=>a+Math.random()*(b-a);
const ri = (a,b)=>Math.floor(rnd(a,b+1));
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const pick = arr => arr[ri(0,arr.length-1)];
const round1 = x => Math.round(x*10)/10;
const clone = o => JSON.parse(JSON.stringify(o));

function weightedAbility(attrs, pos){
  const w = POS[pos].w; let sum=0, tot=0;
  for(const k in w){ sum += (attrs[k]||0)*w[k]; tot += w[k]; }
  return sum/tot;
}
function ageFactor(age){ if(age<=19) return 1.45; if(age<=24) return 1.15; if(age<=29) return 1.0; if(age<=32) return 0.8; return 0.6; }
function headroom(cur, ceil){ return clamp((ceil-cur)/5, 0, 1); }
function bandFor(pot){ if(pot>=16.5) return "World-class potential"; if(pot>=14.5) return "Star potential"; if(pot>=12.5) return "Regular-starter potential"; if(pot>=10.5) return "Rotation potential"; return "Backup potential"; }

function makeProspect(pos){
  const attrs={}, pot={};
  const base = pos==="CB"? 7.2 : 7.6;
  ATTRS.forEach(k=>{
    const w = POS[pos].w[k]||1;
    const start = clamp(rnd(base-2, base+1.5) + (w>=4?1:0), 3, 12);
    attrs[k]=round1(start);
    pot[k]=round1(clamp(start + rnd(3, 9) + (w>=4?1.5:0), start, 20));
  });
  const potOverall = weightedAbility(pot,pos);
  return {
    name:`${pick(FIRST)} ${pick(LAST)}`, age:ri(16,17), pos, birthWeek:ri(2,24),
    attrs, pot, band:bandFor(potOverall),
    freshness:100, formHist:[], status:"Youth", onLoan:false, hasDebuted:false, injuredWeeks:0,
    squadCount:0, minutesHist:[],
    season:{apps:0,starts:0,minutes:0,goals:0,assists:0,ratings:[]},
  };
}

function newAgent(){ return { name:`${pick(FIRST)} ${pick(LAST)}`, reliability:round1(rnd(0.35,0.85)), trust:65 }; }

function makeGame(prospect){
  const yourWA = weightedAbility(prospect.attrs, prospect.pos);
  const rivals = [
    { name:pick(FIRST)+" "+pick(LAST), ability:round1(rnd(10.5,12)) },
    { name:pick(FIRST)+" "+pick(LAST), ability:round1(rnd(8,9.4)) },
  ];
  const clubStrength = round1(rnd(10.5, 12.5));
  const myClub = pick(CLUBS);
  const opps=[]; let m=0;
  for(let i=0; m<22; i++){
    if(i>0 && i%5===0){ opps.push({rest:true}); continue; } // a break every few weeks
    let c; do { c=pick(CLUBS); } while(c===myClub);
    opps.push({ opp:c, home:m%2===0, strength:round1(clamp(clubStrength+rnd(-2.5,2.5),8,14)) });
    m++;
  }
  // a display squad (teammates) with ages and light stats
  const squad=[];
  [["GK",1],["DEF",4],["MID",4],["FWD",3]].forEach(([lab,n])=>{
    for(let i=0;i<n;i++) squad.push({
      name:`${pick(FIRST)} ${pick(LAST)}`, pos:lab, age:ri(18,35),
      ability:round1(clamp(clubStrength+rnd(-2.2,2.2),6,18)),
      goals: lab==="FWD"?ri(1,11):lab==="MID"?ri(0,6):lab==="GK"?0:ri(0,2),
      apps: ri(6,22), avg: round1(rnd(6.1,7.5)),
    });
  });
  // league table: 11 other clubs, each with a stable season profile
  const others = CLUBS.filter(c=>c!==myClub).sort(()=>Math.random()-0.5).slice(0,11);
  const table = others.map(name=>{
    const wRate=rnd(0.15,0.7), dRate=rnd(0.1,0.3);
    return { name, wRate, dRate, gfpg:rnd(0.8,2.4), gapg:rnd(0.7,2.2) };
  });
  return {
    player:prospect, club:{name:myClub, strength:clubStrength},
    rivals, opps, week:0, squad, table,
    agent: newAgent(),
    coach:{ name:`${pick(FIRST)} ${pick(LAST)}` },
    training:{primary:"Technical", secondary:"Physical", intensity:"Balanced"},
    record:{w:0,d:0,l:0,gf:0,ga:0}, loanResolved:false, coachRequest:null,
    lastSummary:null,
  };
}

/* selection score on a ~1-20 comparable scale */
function selScore(wa, form, fresh){ return wa*0.6 + (form*2)*0.3 + (fresh/5)*0.1; }

function makeAdvice(g){
  const A=`${g.agent.name}, your agent,`;
  const scenarios=[
    ()=>{ const [a,b]=Object.keys(PROGRAMS).sort(()=>Math.random()-0.5).slice(0,2);
      const hr=x=>PROGRAMS[x].reduce((s,k)=>s+headroom(g.player.attrs[k],g.player.pot[k]),0);
      return { context:`${A} thinks you're neglecting part of your game and wants you to switch your training block.`,
        stake:"Developing the right areas now shapes the player you become — the wrong ones waste weeks.",
        optA:`Switch to ${a} training`, optB:`Stick with ${b} training`, better: hr(a)>=hr(b)?"A":"B",
        goodTxt:"You worked on exactly what you needed — a productive block.", badTxt:"Weeks spent on the wrong areas. Little to show for it." };
    },
    ()=>({ context:`${A} reckons you're overdoing it and should take it easy this week.`,
      stake:"Resting keeps you sharp for matches; extra work speeds development — but not if you're already running on empty.",
      optA:"Ease off and recover", optB:"Keep grinding in training", better: g.player.freshness<60?"A":"B",
      goodTxt:"Good shout — you felt the benefit.", badTxt:"With hindsight, the wrong call this week." }),
    ()=>({ context:`A boot brand wants you for a promo day. ${A} is keen for you to do it.`,
      stake:"It's good exposure and money, but a distraction if your head isn't fully on football.",
      optA:"Do the promo day", optB:"Turn it down, stay focused", better: g.player.freshness>65?"A":"B",
      goodTxt:"It went well and didn't cost you on the pitch.", badTxt:"A distraction you didn't need — it backfired." }),
    ()=>({ context:`A bigger club is sniffing around. ${A} wants to push for the move now.`,
      stake:"Move too early and you might not play; wait too long and the interest could fade.",
      optA:"Push for the transfer", optB:"Stay and keep proving yourself", better: LADDER.indexOf(g.player.status)>=3?"A":"B",
      goodTxt:"The right read on your career — this sets you up well.", badTxt:"That set your career back a step." }),
    ()=>({ context:`After a rough patch the press want a word. ${A} advises you to front up and speak to them.`,
      stake:"Handle it well and you win people over; handle it badly and the story follows you around.",
      optA:"Do the interview", optB:"Keep your head down", better: form(g)>6.4?"A":"B",
      goodTxt:"You came across well — it settled things down.", badTxt:"It came out wrong and made things worse." }),
  ];
  const s = pick(scenarios)();
  const recKey = Math.random()<g.agent.reliability ? s.better : (s.better==="A"?"B":"A");
  return { ...s, recKey, phase:"choose" };
}

export default function Touchline(){
  const [screen,setScreen] = useState("start");   // start | hub | match | summary | seasonEnd
  const [game,setGame] = useState(null);
  const [match,setMatch] = useState(null);
  const [archive,setArchive] = useState([]);
  const [prospects,setProspects] = useState(()=>[makeProspect("ST"),makeProspect("CM"),makeProspect("CB")]);
  const [modal,setModal] = useState(null); // loan offer
  const [advice,setAdvice] = useState(null); // agent advice modal
  const [tab,setTab] = useState("home"); // home | squad | league | player | relationships
  const pending = useRef(null); // holds trained clone while a modal is open

  const form = g => { const h=g.player.formHist; return h.length? h.reduce((a,b)=>a+b,0)/h.length : 6.0; };
  const minutesShare = g => { const h=g.player.minutesHist.slice(-6); if(!h.length) return 0; return h.reduce((a,b)=>a+b,0)/(90*h.length); };

  /* ---------- start a career ---------- */
  function choose(p){ setGame(makeGame(p)); setTab("home"); setScreen("hub"); }

  /* ---------- coach request (occasional) ---------- */
  function maybeCoachRequest(g){
    if(g.week%4===2 && !g.coachRequest){
      const progs = Object.keys(PROGRAMS).filter(p=>p!==g.training.primary);
      return pick(progs);
    }
    return g.coachRequest;
  }

  /* ---------- advance the week ---------- */
  function advance(){
    const g = clone(game);
    const bday = g.week === g.player.birthWeek;
    if(bday) g.player.age++;
    g._bday = bday;
    const entry = g.opps[g.week];
    const isMatch = !entry.rest;
    const injuredComingIn = g.player.injuredWeeks>0;

    let intensity = g.training.intensity || "Balanced";
    if(injuredComingIn) intensity = "Recover"; // limited while recovering
    const IN = T.INTENSITY[intensity];
    const agentMult = g.agent ? (0.7 + 0.3*(clamp(g.agent.trust,0,100)/100)) : 0.7; // no agent (or distrusted) → slower growth
    const af = ageFactor(g.player.age);
    const deltas = {};
    const applyTrain = (list,w)=>list.forEach(k=>{
      const gain = T.BASE_TRAIN*af*headroom(g.player.attrs[k],g.player.pot[k])*w*IN.gain*agentMult;
      g.player.attrs[k]=round1(clamp(g.player.attrs[k]+gain,1,20));
      deltas[k]=(deltas[k]||0)+gain;
    });
    applyTrain(PROGRAMS[g.training.primary],1.0);
    applyTrain(PROGRAMS[g.training.secondary],T.SECONDARY_W);

    // freshness from training load
    g.player.freshness = clamp(g.player.freshness + (isMatch?IN.fresh:IN.freshRest), 0, 100);

    // injury roll
    let newInjury=false;
    if(!injuredComingIn){
      const p = isMatch?IN.injMatch:IN.injRest;
      if(Math.random()<p){ newInjury=true; g.player.injuredWeeks = ri(0,1); }
    } else {
      g.player.injuredWeeks = Math.max(0, g.player.injuredWeeks-1);
    }
    const injuredNow = injuredComingIn || newInjury;

    // loan offer (match weeks only, when not injured)
    if(isMatch && !injuredNow && g.agent && g.week>=T.LOAN_WEEK && !g.loanResolved && !g.player.onLoan &&
       ["Youth","Backup"].includes(g.player.status) && minutesShare(g)<0.15){
      pending.current = { g, deltas };
      setModal({type:"loan", club:pick(CLUBS.filter(c=>c!==g.club.name))});
      return;
    }

    // agent advice (a few times a season)
    if(g.agent && !injuredNow && g.week%5===3){
      pending.current = { g, deltas, isMatch, injuredNow, newInjury, intensity };
      setAdvice(makeAdvice(g));
      return;
    }

    if(isMatch) runMatch(g, deltas, injuredNow, newInjury);
    else finalizeRest(g, deltas, intensity, newInjury);
  }

  function continueWeek(){
    const { g, deltas, isMatch, injuredNow, newInjury, intensity } = pending.current;
    pending.current=null;
    if(isMatch) runMatch(g, deltas, injuredNow, newInjury);
    else finalizeRest(g, deltas, intensity, newInjury);
  }
  function chooseAdvice(key){
    const { g, deltas } = pending.current;
    const good = key===advice.better;
    if(good){
      Object.keys(POS[g.player.pos].w).filter(k=>POS[g.player.pos].w[k]>=3).forEach(k=>{
        g.player.attrs[k]=round1(clamp(g.player.attrs[k]+0.16,1,20)); deltas[k]=(deltas[k]||0)+0.16;
      });
    } else {
      g.player.freshness = clamp(g.player.freshness-7,0,100);
    }
    setAdvice(a=>({...a, phase:"feedback", good, followed:key===a.recKey, resultTxt: good? a.goodTxt : a.badTxt}));
  }
  function markAdvice(trustIt){
    const { g } = pending.current;
    if(g.agent) g.agent.trust = clamp(g.agent.trust + (trustIt? 8 : -10), 0, 100);
    setAdvice(null);
    continueWeek();
  }

  function finalizeRest(g, deltas, intensity, newInjury){
    const before=g.player.status;
    g.player.status = statusFor(g);
    g.coachRequest = maybeCoachRequest(g);
    g.lastSummary = {
      rest:true, intensity, newInjury, deltas, freshness:Math.round(g.player.freshness),
      statusChange: before!==g.player.status ? {from:before,to:g.player.status} : null,
      coachNote: restNote(intensity, newInjury), weekNo:g.week+1, birthday: !!g._bday, age:g.player.age,
    };
    g.week++;
    setGame(g);
    if(g.week>=g.opps.length) endSeason(g); else setScreen("summary");
  }
  function restNote(intensity, injured){
    if(injured) return "You picked up a knock in training — you'll need to manage it.";
    if(intensity==="Intensive") return "You drove yourself hard this week. Good gains, but you're carrying fatigue into the next match.";
    if(intensity==="Recover") return "A lighter week to freshen the legs. You'll be sharp for the next one.";
    return "A balanced week's work on the training ground.";
  }

  function acceptLoan(club){
    const { g, deltas } = pending.current;
    g.player.onLoan = true; g.club = {name:club, strength:round1(rnd(8.5,9.8))};
    g.opps = g.opps.map((o,i)=> (i>=g.week && !o.rest) ? {...o, strength:round1(clamp(o.strength-2.2,7,12))} : o);
    g.loanResolved = true;
    setModal(null); pending.current=null;
    runMatch(g, deltas, false, false);
  }
  function declineLoan(){
    const { g, deltas } = pending.current;
    g.loanResolved=true; setModal(null); pending.current=null;
    runMatch(g, deltas, false, false);
  }

  /* ---------- resolve selection + build match ---------- */
  function runMatch(g, trainDeltas, injuredNow, newInjury){
    const fx = g.opps[g.week];
    const wa = weightedAbility(g.player.attrs,g.player.pos);
    const f = form(g), fresh = g.player.freshness;
    const you = selScore(wa,f,fresh);
    const r1 = selScore(g.rivals[0].ability,6.5,88) + rnd(-0.6,0.6);
    const r2 = selScore(g.rivals[1].ability,6.5,88) + rnd(-0.6,0.6);

    let role, minutes;
    if(injuredNow){ role="Out (injured)"; minutes=0; }
    else if(g.player.onLoan){ role="Start"; minutes=ri(80,90); }
    else {
      const ranked = [["you",you],["r1",r1],["r2",r2]].sort((a,b)=>b[1]-a[1]);
      const myRank = ranked.findIndex(x=>x[0]==="you");
      const tired = fresh<45 && g.player.minutesHist.slice(-2).every(m=>m>=70);
      if(myRank===0 && !tired){ role="Start"; minutes=ri(82,90); }
      else if(myRank===0 && tired){ role="Substitute"; minutes=ri(18,30); }
      else if(myRank===1 && (you > r1-1.2 || you>r2)){ role="Substitute"; minutes=ri(12,28); }
      else if(you > Math.min(r1,r2)-2.0){ role="Bench (unused)"; minutes=0; }
      else { role="Left out of squad"; minutes=0; }
    }

    const inSquad = role!=="Left out of squad";
    if(inSquad) g.player.squadCount++;
    const debut = minutes>0 && !g.player.hasDebuted;

    let beats=[], res, ratingFinal=null;
    if(minutes>0){
      const { events, ratingBase } = performance(g.player, fx.strength, minutes, f, fresh);
      const yourGoals = events.filter(e=>e.goal).length;
      res = teamResult(g.club.strength, fx.strength, yourGoals);
      beats = buildBeats(events, res, g, fx, minutes, role, debut);
      ratingFinal = round1(clamp(ratingBase,1,10));
    } else {
      res = teamResult(g.club.strength, fx.strength, 0);
    }
    const tr = genTeamRatings(res);

    setMatch({
      fx, role, minutes, debut, beats, idx:0, rating:6.0, ratingFinal,
      shownEvents:[], oursHome:fx.home, injuredNow, newInjury,
      teamGoals:res.ours, oppGoals:res.theirs, decision:null, phase:"selection",
      trainDeltas, res, gameSnapshot:g, decisionAdj:0, teamRatings:tr,
    });
    setScreen("match");
  }

  function startPlay(){ setMatch(m=>({...m, phase:"playing", idx:0})); }
  function benchContinue(){
    const g=match.gameSnapshot;
    finalize(g, match.trainDeltas, { role:match.role, minutes:0, rating:null, ours:match.teamGoals, theirs:match.oppGoals, fx:match.fx, goals:0, assists:0, teamRatings:match.teamRatings, injuredNow:match.injuredNow, newInjury:match.newInjury });
    setMatch(null);
  }

  function genTeamRatings(res){
    const base = 6.3 + (res.ours-res.theirs)*0.22;
    const used=new Set(); const list=[];
    for(let i=0;i<5;i++){ let n; do{ n=pick(FIRST)+" "+pick(LAST); }while(used.has(n)); used.add(n); list.push({name:n, rating:round1(clamp(base+rnd(-1.3,1.8),4,9.6))}); }
    return list;
  }

  function performance(p, oppStrength, minutes, f, fresh){
    const wa = weightedAbility(p.attrs,p.pos);
    const roll = wa + (f-6)*0.6 + (fresh-70)/30 - (oppStrength-11)*0.5 + rnd(-2.4,2.4);
    const minFactor = minutes/90;
    const events=[]; let rating=6.0;
    const chanceScale = clamp((roll-6)/6, -0.6, 1) ;
    const add=(e,d)=>{ events.push({...e}); rating+=d; };
    // attacking output (position-weighted)
    const goalChance = (p.pos==="ST"?0.5:p.pos==="CM"?0.28:0.1) * (0.5+chanceScale) * minFactor;
    const assistChance = (p.pos==="CM"?0.45:p.pos==="ST"?0.3:0.18) * (0.5+chanceScale) * minFactor;
    if(Math.random()<goalChance){ add({t:"goal",goal:true,min:ri(20,88),txt:"buries it — goal!"},1.4); if(Math.random()<goalChance*0.5) add({t:"goal",goal:true,min:ri(20,88),txt:"again! a second goal"},1.3); }
    if(Math.random()<assistChance){ add({t:"assist",min:ri(15,85),txt:"threads the assist"},0.9); }
    // involvement
    const good = 1 + Math.round(clamp(chanceScale,0,1)*2 + minFactor);
    for(let i=0;i<good;i++){ if(Math.random()<0.6) add({t:"keypass",min:ri(10,88),txt: p.pos==="CB"?"crucial clearance":"sharp key pass"},0.25); }
    if(p.pos==="CB" || p.pos==="CM"){ if(Math.random()<0.7) add({t:"tackle",min:ri(10,88),txt:"wins a strong tackle"},0.3); }
    // mistakes
    const errChance = clamp(0.25 - chanceScale*0.15 + (oppStrength-11)*0.04, 0.05, 0.4)*minFactor;
    if(Math.random()<errChance) add({t:"error",min:ri(10,88),txt:"caught out — costly error"},-0.7);
    rating += (roll-7)*0.12;
    return { events, ratingBase: rating };
  }

  function teamResult(ours, theirs, yourGoals){
    let og = Math.max(yourGoals, Math.round(clamp(1.2 + (ours-theirs)/7 + rnd(-1.1,1.4),0,5)));
    let tg = Math.round(clamp(1.1 + (theirs-ours)/7 + rnd(-1.1,1.4),0,5));
    return { ours:og, theirs:tg };
  }

  function buildBeats(events, res, g, fx, minutes, role, debut){
    const entryMin = role==="Substitute" ? clamp(Math.round(90-minutes), 1, 86) : 0;
    const beats=[];
    if(role==="Substitute") beats.push({kind:"info", min:entryMin, txt: debut? `You come on in the ${entryMin}′ — senior debut!` : `You come on in the ${entryMin}′`});
    else if(role==="Start") beats.push({kind:"info", min:1, txt: debut? "You start — senior debut!" : "You're in the starting eleven"});
    events.forEach(e=>{
      const ev={kind:"you", ...e};
      if(role==="Substitute") ev.min = ri(entryMin+1, 90); // your involvement only after you're on
      beats.push(ev);
    });
    // team/opp goals not from you
    const yourGoals = events.filter(e=>e.goal).length;
    for(let i=0;i<res.ours-yourGoals;i++) beats.push({kind:"team",min:ri(5,90),txt:`${g.club.name} score`});
    for(let i=0;i<res.theirs;i++) beats.push({kind:"opp",min:ri(5,90),txt:`${fx.opp} score`});
    // rare high-stakes decision
    if(Math.random()<T.DECISION_CHANCE){
      const decs = [
        {q:"Penalty won. Step up and take it?",a:["Take it","Leave it to the senior man"],attr:"composure"},
        {q:"Half-chance on the edge — shoot or square it?",a:["Shoot","Square it"],attr:"finishing"},
        {q:"Last-ditch challenge, booking risk. Dive in?",a:["Go for it","Stay on your feet"],attr:"positioning"},
      ];
      const d = pick(decs);
      const lo = role==="Substitute" ? Math.min(entryMin+2, 87) : 55;
      beats.push({kind:"decision", min:ri(lo,88), ...d});
    }
    beats.sort((a,b)=> (a.min||0)-(b.min||0));
    return beats;
  }

  /* ---------- match feed animation ---------- */
  const timer = useRef(null);
  useEffect(()=>{
    if(!match || match.phase!=="playing" || match.decision) return;
    if(match.idx>=match.beats.length){ endFeed(); return; }
    timer.current = setTimeout(()=>{
      setMatch(m=>{
        if(!m) return m;
        const b = m.beats[m.idx];
        if(b.kind==="decision"){ return {...m, decision:b}; }
        const shown=[...m.shownEvents, b];
        let rating=m.rating;
        if(b.kind==="you"){ rating += ({goal:1.4,assist:0.9,keypass:0.25,tackle:0.3,error:-0.7})[b.t]||0; }
        return {...m, idx:m.idx+1, shownEvents:shown, rating:round1(clamp(rating,1,10))};
      });
    }, 640);
    return ()=> clearTimeout(timer.current);
  }, [match]);

  function resolveDecision(i){
    const d = match.decision; const val = match.gameSnapshot.player.attrs[d.attr];
    const success = i===0 ? Math.random() < clamp((val-4)/14,0.15,0.9) : Math.random()<0.5;
    setMatch(m=>{
      let dr=0, txt, tg=m.teamGoals;
      if(i===0 && d.attr!=="positioning"){ if(success){ dr=1.2; tg+=1; txt="✓ "+(d.attr==="composure"?"scores the penalty!":"scores!"); } else { dr=-0.6; txt="✗ effort saved"; } }
      else if(i===0){ if(success){ dr=0.4; txt="✓ wins the ball cleanly"; } else { dr=-0.9; txt="✗ booked for the challenge"; } }
      else { dr=0.1; txt="— plays it safe"; }
      const shown=[...m.shownEvents, {kind:"resolve", min:d.min, txt}];
      return {...m, decision:null, idx:m.idx+1, rating:round1(clamp(m.rating+dr,1,10)), teamGoals:tg, decisionAdj:(m.decisionAdj||0)+dr, shownEvents:shown};
    });
  }

  function skip(){
    clearTimeout(timer.current);
    setMatch(m=>{
      let rating=m.rating, tg=m.teamGoals; const shown=[...m.shownEvents];
      for(let i=m.idx;i<m.beats.length;i++){
        const b=m.beats[i];
        if(b.kind==="decision"){ shown.push({kind:"resolve",min:b.min,txt:"— left to a teammate"}); continue; }
        shown.push(b);
        if(b.kind==="you") rating += ({goal:1.4,assist:0.9,keypass:0.25,tackle:0.3,error:-0.7})[b.t]||0;
      }
      return {...m, idx:m.beats.length, rating:round1(clamp(rating,1,10)), teamGoals:tg, shownEvents:shown, decision:null};
    });
  }

  function endFeed(){
    setMatch(m=>{ if(m.phase==="done") return m; const fr=round1(clamp(m.ratingFinal+(m.decisionAdj||0),1,10)); return {...m, phase:"done", rating:fr, finalRating:fr}; });
  }
  useEffect(()=>{ if(match && match.idx>=match.beats.length && match.phase==="playing" && !match.decision) endFeed(); }, [match]);

  function afterMatch(){
    const g = match.gameSnapshot;
    const goals = match.shownEvents.filter(e=>e.kind==="you"&&e.goal).length
                + match.shownEvents.filter(e=>e.kind==="resolve"&&/scores/.test(e.txt)).length;
    const assists = match.shownEvents.filter(e=>e.kind==="you"&&e.t==="assist").length;
    finalize(g, match.trainDeltas, {
      role:match.role, minutes:match.minutes, rating: match.finalRating ?? match.ratingFinal,
      events:[], ours:match.teamGoals, theirs:match.oppGoals, fx:match.fx, goals, assists, teamRatings:match.teamRatings,
    });
    setMatch(null);
  }

  /* ---------- finalize the week ---------- */
  function finalize(g, trainDeltas, r){
    const played = r.minutes>0;
    const debut = played && !g.player.hasDebuted;
    if(played) g.player.hasDebuted = true;
    // match development
    const matchDeltas={};
    if(played){
      const posAttrs = Object.keys(POS[g.player.pos].w).filter(k=>POS[g.player.pos].w[k]>=3);
      const oppF = clamp(r.fx.strength/11,0.7,1.4);
      posAttrs.forEach(k=>{
        const gain=T.BASE_MATCH*(r.minutes/90)*oppF*headroom(g.player.attrs[k],g.player.pot[k]);
        g.player.attrs[k]=round1(clamp(g.player.attrs[k]+gain,1,20));
        trainDeltas[k]=(trainDeltas[k]||0)+gain;
      });
    }
    // freshness: match load only (training load already applied this week in advance)
    if(played) g.player.freshness = clamp(g.player.freshness - r.minutes*0.42, 0, 100);
    // form + stats
    if(r.rating!=null){ g.player.formHist=[...g.player.formHist, r.rating].slice(-5); g.player.season.ratings.push(r.rating); }
    g.player.minutesHist.push(r.minutes);
    g.player.season.minutes += r.minutes;
    if(r.minutes>0) g.player.season.apps++;
    if(r.role==="Start") g.player.season.starts++;
    g.player.season.goals += r.goals||0;
    g.player.season.assists += r.assists||0;
    // record
    if(r.ours>r.theirs) g.record.w++; else if(r.ours===r.theirs) g.record.d++; else g.record.l++;
    g.record.gf += r.ours; g.record.ga += r.theirs;
    // status ladder
    const before = g.player.status;
    g.player.status = statusFor(g);
    // coach request lifecycle
    g.coachRequest = maybeCoachRequest(g);

    g.lastSummary = {
      fx:r.fx, role:r.role, minutes:r.minutes, rating:r.rating,
      ours:r.ours, theirs:r.theirs, deltas:trainDeltas,
      statusChange: before!==g.player.status ? {from:before,to:g.player.status} : null,
      coachNote: coachNote(r), debut, teamRatings:r.teamRatings, weekNo:g.week+1,
      injured: !!r.injuredNow, newInjury: !!r.newInjury, birthday: !!g._bday, age:g.player.age,
    };
    g.week++;
    setGame(g);
    if(g.week>=g.opps.length){ endSeason(g); } else { setScreen("summary"); }
  }

  function statusFor(g){
    const ms = minutesShare(g);
    const wa = weightedAbility(g.player.attrs,g.player.pos);
    const topAbility = wa>=g.rivals[0].ability;
    const f = form(g);
    let s = g.player.status;
    if(g.player.squadCount>=1 && LADDER.indexOf(s)<1) s="Backup";
    if(ms>0.25 && LADDER.indexOf(s)<2) s="Rotation";
    if(ms>0.6 && wa>=g.rivals[1].ability) s="Regular";
    if(ms>0.8 && topAbility && f>7) s="Star";
    if(ms<0.1 && g.week>6 && LADDER.indexOf(s)>1) s="Backup";
    return s;
  }
  function coachNote(r){
    if(r.injuredNow) return "You're sidelined with an injury. Rest up and come back stronger.";
    if(r.rating==null) return r.role==="Left out of squad" ? "Not in the squad this week — keep pushing in training." : "Named on the bench but unused.";
    if(r.rating>=8) return "The gaffer singled you out afterwards. Big performance.";
    if(r.rating>=7) return "Solid shift. You're making the case for more minutes.";
    if(r.rating>=6) return "Steady enough. Nothing to worry the coach either way.";
    return "A quiet one. You'll want to bounce back next week.";
  }

  function endSeason(g){
    const s=g.player.season;
    const avg = s.ratings.length? round1(s.ratings.reduce((a,b)=>a+b,0)/s.ratings.length) : null;
    const entry = {
      name:g.player.name, pos:POS[g.player.pos].label, status:g.player.status,
      apps:s.apps, starts:s.starts, minutes:s.minutes, goals:s.goals, assists:s.assists,
      avg, onLoan:g.player.onLoan, band:g.player.band,
      record:g.record,
    };
    setArchive(a=>[entry, ...a]);
    setScreen("seasonEnd");
  }

  function newCareer(){
    setProspects([makeProspect("ST"),makeProspect("CM"),makeProspect("CB")]);
    setGame(null); setMatch(null); setScreen("start");
  }

  /* =================== RENDER =================== */
  return (
    <div style={{minHeight:"100vh", background:C.ink, color:C.chalk, fontFamily:"Inter, system-ui, sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
      *{box-sizing:border-box} button{font-family:inherit;cursor:pointer}
      @keyframes pop{0%{transform:scale(.8);opacity:0}100%{transform:scale(1);opacity:1}}
      .beat{animation:pop .25s ease}`}</style>
      <div style={{maxWidth:460, margin:"0 auto", padding:"18px 16px 40px"}}>
        {screen==="start" && <Start prospects={prospects} onChoose={choose} archive={archive}/>}
        {screen==="hub" && game && (
          <div style={{paddingBottom:70}}>
            {tab==="home" && <Hub game={game} setGame={setGame} advance={advance} form={form(game)} ms={minutesShare(game)}/>}
            {tab==="squad" && <SquadScreen game={game}/>}
            {tab==="league" && <LeagueScreen game={game}/>}
            {tab==="player" && <PlayerScreen game={game} form={form(game)}/>}
            {tab==="relationships" && <RelationshipsScreen game={game} setGame={setGame} form={form(game)}/>}
          </div>
        )}
        {screen==="match" && match && <Match m={match} game={game} skip={skip} resolveDecision={resolveDecision} afterMatch={afterMatch} startPlay={startPlay} benchContinue={benchContinue}/>}
        {screen==="summary" && game && <Summary game={game} cont={()=>{setTab("home"); setScreen("hub");}}/>}
        {screen==="seasonEnd" && game && <SeasonEnd game={game} entry={archive[0]} onNew={newCareer}/>}
      </div>
      {screen==="hub" && game && <BottomNav tab={tab} setTab={setTab}/>}
      {modal?.type==="loan" && <LoanModal club={modal.club} agentName={game?.agent?.name} onAccept={()=>acceptLoan(modal.club)} onDecline={declineLoan}/>}
      {advice && game && <AdviceModal advice={advice} onChoose={chooseAdvice} onMark={markAdvice}/>}
    </div>
  );
}

/* =================== small UI pieces =================== */
const disp = {fontFamily:"Oswald, sans-serif"};
function Eyebrow({children}){ return <div style={{...disp, letterSpacing:2, textTransform:"uppercase", fontSize:11, color:C.muted}}>{children}</div>; }
function Pill({children, color=C.pitch}){ return <span style={{...disp, fontSize:12, letterSpacing:1, textTransform:"uppercase", color:C.ink, background:color, padding:"3px 9px", borderRadius:999, fontWeight:600}}>{children}</span>; }
function Panel({children, style}){ return <div style={{background:C.panel, border:`1px solid ${C.line}`, borderRadius:14, padding:16, ...style}}>{children}</div>; }
function Btn({children, onClick, kind="primary", disabled}){
  const base={...disp, width:"100%", padding:"15px", border:"none", borderRadius:12, fontSize:17, letterSpacing:1, textTransform:"uppercase", fontWeight:600, opacity:disabled?0.5:1};
  const styles={ primary:{background:C.pitch, color:C.ink}, ghost:{background:"transparent", color:C.chalk, border:`1px solid ${C.line}`}, flood:{background:C.flood, color:C.ink} };
  return <button onClick={onClick} disabled={disabled} style={{...base, ...styles[kind]}}>{children}</button>;
}

function AttrGrid({attrs, deltas={}}){
  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
      {ATTRS.map(k=>{
        const v=attrs[k]; const d=deltas[k]||0;
        return (
          <div key={k} style={{display:"flex", alignItems:"center", justifyContent:"space-between", background:C.panel2, borderRadius:9, padding:"8px 10px"}}>
            <span style={{fontSize:12, color:C.muted}}>{ATTR_LABEL[k]}</span>
            <span style={{...disp, fontSize:18, fontWeight:600}}>
              {v.toFixed(1)}
              {d>0.01 && <span style={{color:C.pitch, fontSize:11, marginLeft:4}}>▲{d.toFixed(1)}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* =================== Screens =================== */
function Start({prospects, onChoose, archive}){
  return (
    <div>
      <div style={{...disp, fontSize:44, fontWeight:700, letterSpacing:3, lineHeight:1}}>TOUCH<span style={{color:C.pitch}}>LINE</span></div>
      <div style={{color:C.muted, marginTop:6, marginBottom:22}}>A career, one week at a time. Choose the young player whose story you'll live.</div>
      <Eyebrow>Choose your young player</Eyebrow>
      <div style={{display:"grid", gap:12, marginTop:10}}>
        {prospects.map((p,i)=>(
          <button key={i} onClick={()=>onChoose(p)} style={{textAlign:"left", background:C.panel, border:`1px solid ${C.line}`, borderRadius:14, padding:16}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
              <span style={{...disp, fontSize:22, fontWeight:600}}>{p.name}</span>
              <Pill>{POS[p.pos].label}</Pill>
            </div>
            <div style={{color:C.muted, fontSize:13, margin:"4px 0 12px"}}>Age {p.age} · {p.band}</div>
            <AttrGrid attrs={p.attrs}/>
          </button>
        ))}
      </div>
      {archive.length>0 && <div style={{marginTop:26}}><Eyebrow>Career archive</Eyebrow><ArchiveList archive={archive}/></div>}
    </div>
  );
}

function Hub({game, setGame, advance, form, ms}){
  const p=game.player;
  const N=game.opps.length;
  const thisWk=game.opps[game.week];
  const nextWk=game.opps[game.week+1];
  const last=game.lastSummary;
  const wa=weightedAbility(p.attrs,p.pos);
  const injured=p.injuredWeeks>0;
  const isRest=!!thisWk.rest;
  const intensity=game.training.intensity||"Balanced";

  const chance=(e)=>{
    if(!e) return {t:"Season ends", c:C.muted};
    if(e.rest) return {t:"Rest week", c:C.muted};
    if(injured) return {t:"Injured", c:C.red};
    if(p.onLoan) return {t:"Sure to start", c:C.pitch};
    const you=selScore(wa,form,p.freshness);
    const r1=selScore(game.rivals[0].ability,6.5,88), r2=selScore(game.rivals[1].ability,6.5,88);
    if(you>r1) return {t:"Likely to start", c:C.pitch};
    if(you>r2) return {t:"Could start", c:C.flood};
    if(you>Math.min(r1,r2)-2) return {t:"Likely a sub", c:C.muted};
    return {t:"Unlikely to play", c:C.muted};
  };
  const mUp=e=> e.home? game.club.name : e.opp;
  const mDn=e=> e.home? e.opp : game.club.name;

  const setProg=(slot,val)=>{ const g=clone(game); g.training[slot]=val; if(g.training.primary===g.training.secondary){ g.training.secondary=Object.keys(PROGRAMS).find(x=>x!==val); } setGame(g); };
  const setIntensity=v=>{ const g=clone(game); g.training.intensity=v; setGame(g); };
  const statusIdx=LADDER.indexOf(p.status);

  return (
    <div>
      {/* season week strip */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
        <div style={{...disp, fontSize:22, fontWeight:700, letterSpacing:1}}>Week {game.week+1}<span style={{color:C.muted, fontSize:14}}> / {N}</span></div>
        <span style={{fontSize:12, color:C.muted}}>{game.club.name} · {game.record.w}W {game.record.d}D {game.record.l}L</span>
      </div>
      <div style={{height:4, background:C.line, borderRadius:2, marginBottom:14, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${(game.week/N)*100}%`, background:C.pitch, transition:"width .3s"}}/>
      </div>

      {/* player header */}
      <Panel style={{padding:0, overflow:"hidden"}}>
        <div style={{padding:16, background:`linear-gradient(135deg, ${C.panel2}, ${C.panel})`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div>
              <div style={{...disp, fontSize:26, fontWeight:600, lineHeight:1}}>{p.name}</div>
              <div style={{color:C.muted, fontSize:13, marginTop:4}}>{POS[p.pos].label} · Age {p.age} · {game.club.name}{p.onLoan?" (loan)":""}</div>
            </div>
            <Pill color={statusIdx>=3?C.flood:C.pitch}>{p.status}</Pill>
          </div>
          <div style={{display:"flex", gap:4, marginTop:14}}>
            {LADDER.map((s,i)=>(
              <div key={s} style={{flex:1, textAlign:"center"}}>
                <div style={{height:4, borderRadius:2, background:i<=statusIdx?C.pitch:C.line}}/>
                <div style={{...disp, fontSize:9, letterSpacing:0.5, marginTop:4, color:i<=statusIdx?C.chalk:C.muted, textTransform:"uppercase"}}>{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex", borderTop:`1px solid ${C.line}`}}>
          {[["Form", form.toFixed(1)],["Readiness", Math.round(p.freshness)],["Minutes", p.season.minutes]].map(([l,v])=>(
            <div key={l} style={{flex:1, textAlign:"center", padding:"10px 0", borderRight:l!=="Minutes"?`1px solid ${C.line}`:"none"}}>
              <div style={{...disp, fontSize:22, fontWeight:600, color: l==="Form"?C.flood:C.chalk}}>{v}</div>
              <div style={{fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>
      </Panel>

      {injured && <div style={{marginTop:12, background:"#3a1622", border:`1px solid ${C.red}`, borderRadius:10, padding:"10px 12px", fontSize:13}}><b style={{color:C.red}}>Injured.</b> Training is limited to recovery until you're fit again.</div>}

      <div style={{margin:"16px 0 8px"}}><Eyebrow>Attributes</Eyebrow></div>
      <AttrGrid attrs={p.attrs}/>

      {/* three-week schedule */}
      <div style={{margin:"18px 0 8px"}}><Eyebrow>Your schedule</Eyebrow></div>
      {last && <TimelineRow tag="Last week"
        main={last.rest? "Rest week" : `${mUp(last.fx)} ${last.ours}–${last.theirs} ${mDn(last.fx)}`}
        sub={last.rest? `${last.intensity} training${last.newInjury?" · knock":""}` : last.role}
        chip={last.rest? (last.newInjury?"Injury":"Done") : (last.rating!=null? last.rating.toFixed(1) : (last.injured?"Injured":"—"))}
        chipColor={last.rest? (last.newInjury?C.red:C.muted) : (last.rating!=null?(last.rating>=7?C.pitch:last.rating>=5.5?C.flood:C.red):C.muted)} />}
      <TimelineRow tag="This week" highlight
        main={isRest? "Rest week — no fixture" : `${mUp(thisWk)} v ${mDn(thisWk)}`}
        sub={isRest? "Push training hard, or rest up" : (thisWk.home?"Home":"Away")}
        chip={chance(thisWk).t} chipColor={chance(thisWk).c} />
      <TimelineRow tag="Next week"
        main={!nextWk? "Season ends" : nextWk.rest? "Rest week" : `${mUp(nextWk)} v ${mDn(nextWk)}`}
        sub={nextWk&&!nextWk.rest? (nextWk.home?"Home":"Away"): ""}
        chip={chance(nextWk).t} chipColor={chance(nextWk).c} />

      {/* training focus */}
      <div style={{margin:"18px 0 8px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <Eyebrow>Training focus</Eyebrow>
        <span style={{fontSize:11, color:C.muted}}>70 / 30 split</span>
      </div>
      {game.coachRequest && !injured && <div style={{background:C.panel2, border:`1px dashed ${C.flood}`, borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:13}}>
        <b style={{color:C.flood}}>Coach request:</b> focus <b>{game.coachRequest}</b> this week. Set it as primary for a small boost and standing — or train your own way.
      </div>}
      <Panel>
        <ProgSelect label="Primary (70%)" value={game.training.primary} onChange={v=>setProg("primary",v)} accent={C.pitch}/>
        <div style={{height:10}}/>
        <ProgSelect label="Secondary (30%)" value={game.training.secondary} onChange={v=>setProg("secondary",v)} accent={C.muted} exclude={game.training.primary}/>
      </Panel>

      {/* training intensity */}
      <div style={{margin:"16px 0 8px"}}><Eyebrow>Training intensity</Eyebrow></div>
      {injured ? (
        <Panel><div style={{fontSize:13, color:C.muted}}>Limited to <b style={{color:C.chalk}}>recovery</b> while you heal.</div></Panel>
      ) : (
        <Panel>
          <div style={{display:"flex", gap:6}}>
            {["Intensive","Balanced","Recover"].map(v=>{
              const active=intensity===v;
              return <button key={v} onClick={()=>setIntensity(v)} style={{...disp, flex:1, padding:"11px 4px", borderRadius:9, fontSize:13, letterSpacing:0.5, textTransform:"uppercase", border:`1px solid ${active?C.pitch:C.line}`, background:active?C.pitch:"transparent", color:active?C.ink:C.chalk, fontWeight:600}}>{v}</button>;
            })}
          </div>
          <div style={{fontSize:11, color:C.muted, marginTop:8}}>
            {intensity==="Intensive" && (isRest? "Big gains. But it eats your recovery — you'll be less rested for the next match." : "Big gains, but real injury risk and a tired, less-sharp performance this week.")}
            {intensity==="Balanced" && "Steady gains, readiness maintained."}
            {intensity==="Recover" && "Minimal gains, readiness restored — ideal before a big match."}
          </div>
        </Panel>
      )}

      <div style={{marginTop:18}}><Btn onClick={advance}>{isRest? "Train through the week →" : "Advance to matchday →"}</Btn></div>
      <div style={{textAlign:"center", fontSize:11, color:C.muted, marginTop:10}}>Leave your plan as-is to advance quickly</div>
    </div>
  );
}

function TimelineRow({tag, main, sub, chip, chipColor, highlight}){
  return (
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"11px 13px", background: highlight?C.panel2:C.panel, border:`1px solid ${highlight?C.pitch:C.line}`, borderRadius:11, marginBottom:8}}>
      <div style={{minWidth:0}}>
        <div style={{...disp, fontSize:9, letterSpacing:1.5, color:C.muted, textTransform:"uppercase"}}>{tag}</div>
        <div style={{...disp, fontSize:16, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{main}</div>
        {sub && <div style={{fontSize:11, color:C.muted, marginTop:1}}>{sub}</div>}
      </div>
      {chip && <span style={{...disp, fontSize:13, letterSpacing:0.5, color:chipColor||C.muted, textTransform:"uppercase", textAlign:"right", flexShrink:0}}>{chip}</span>}
    </div>
  );
}

function ProgSelect({label, value, onChange, accent, exclude}){
  return (
    <div>
      <div style={{fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:6}}>{label}</div>
      <div style={{display:"flex", gap:6}}>
        {Object.keys(PROGRAMS).map(pr=>{
          const active=value===pr; const dis=exclude===pr;
          return <button key={pr} disabled={dis} onClick={()=>onChange(pr)} style={{...disp, flex:1, padding:"11px 4px", borderRadius:9, fontSize:14, letterSpacing:0.5, textTransform:"uppercase",
            border:`1px solid ${active?accent:C.line}`, background:active?accent:"transparent", color:active?C.ink:(dis?C.line:C.chalk), fontWeight:600, opacity:dis?0.4:1}}>{pr}</button>;
        })}
      </div>
      <div style={{fontSize:11, color:C.muted, marginTop:6}}>{PROGRAMS[value].map(a=>ATTR_LABEL[a]).join(" · ")}</div>
    </div>
  );
}

function Match({m, game, skip, resolveDecision, afterMatch, startPlay, benchContinue}){
  const ours = m.oursHome ? game.club.name : m.fx.opp;
  const theirs = m.oursHome ? m.fx.opp : game.club.name;

  if(m.phase==="selection"){
    const played = m.minutes>0;
    const roleLine = {"Start":"In the starting eleven","Substitute":"Named as a substitute","Bench (unused)":"On the bench — didn't play","Left out of squad":"Not in the squad","Out (injured)":"Out — injured"}[m.role];
    return (
      <div>
        <Eyebrow>Matchday · {m.fx.home? game.club.name : m.fx.opp} v {m.fx.home? m.fx.opp : game.club.name}</Eyebrow>
        {m.debut && (
          <div style={{marginTop:12, background:C.flood, color:C.ink, borderRadius:12, padding:"14px 16px", textAlign:"center"}}>
            <div style={{...disp, fontSize:22, fontWeight:700, letterSpacing:1}}>⚽ SENIOR DEBUT</div>
            <div style={{fontSize:13, fontWeight:500, marginTop:2}}>Your first minutes for the first team.</div>
          </div>
        )}
        {m.injuredNow && (
          <div style={{marginTop:12, background:C.red, color:C.ink, borderRadius:12, padding:"12px 16px", textAlign:"center"}}>
            <div style={{...disp, fontSize:18, fontWeight:700, letterSpacing:1}}>✚ INJURED</div>
            <div style={{fontSize:13, fontWeight:500, marginTop:2}}>{m.newInjury? "You picked up a knock in training." : "Still recovering — you sit this one out."}</div>
          </div>
        )}
        <Panel style={{marginTop:12, textAlign:"center", background:`linear-gradient(160deg, ${C.panel2}, ${C.panel})`}}>
          <div style={{...disp, fontSize:11, letterSpacing:2, color:C.muted, textTransform:"uppercase"}}>The coach names the team</div>
          <div style={{...disp, fontSize:28, fontWeight:700, margin:"10px 0", color: played?C.pitch:(m.injuredNow?C.red:C.muted)}}>{roleLine}</div>
          <div style={{fontSize:13, color:C.muted}}>{played? `You'll get around ${m.minutes} minutes.` : "You'll follow this one from the sidelines."}</div>
        </Panel>
        <div style={{marginTop:18}}>
          {played ? <Btn onClick={startPlay}>Kick off →</Btn> : <Btn kind="ghost" onClick={benchContinue}>See the result →</Btn>}
        </div>
      </div>
    );
  }

  const ringColor = m.rating>=7?C.pitch : m.rating>=5.5?C.flood : C.red;
  const ourScore = m.oursHome ? m.teamGoals : m.oppGoals;
  const theirScore = m.oursHome ? m.oppGoals : m.teamGoals;
  return (
    <div>
      <Eyebrow>Matchday · {m.role} · {m.minutes}'</Eyebrow>
      {/* scoreboard */}
      <Panel style={{marginTop:10, textAlign:"center", background:`linear-gradient(160deg, ${C.panel2}, ${C.panel})`}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:16}}>
          <div style={{flex:1, textAlign:"right", ...disp, fontSize:16}}>{ours}</div>
          <div style={{...disp, fontSize:40, fontWeight:700, letterSpacing:2}}>{ourScore}<span style={{color:C.muted}}>:</span>{theirScore}</div>
          <div style={{flex:1, textAlign:"left", ...disp, fontSize:16}}>{theirs}</div>
        </div>
      </Panel>

      {/* live rating ring */}
      <div style={{display:"flex", justifyContent:"center", margin:"20px 0"}}>
        <div style={{width:130, height:130, borderRadius:999, border:`6px solid ${ringColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 0 30px ${ringColor}44`}}>
          <div style={{...disp, fontSize:46, fontWeight:700, color:ringColor, lineHeight:1}}>{m.rating.toFixed(1)}</div>
          <div style={{fontSize:10, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginTop:2}}>Your rating</div>
        </div>
      </div>

      {/* feed */}
      <div style={{minHeight:120}}>
        {m.shownEvents.map((e,i)=>(
          <div key={i} className="beat" style={{display:"flex", gap:10, alignItems:"center", padding:"8px 4px", borderBottom:`1px solid ${C.panel2}`}}>
            <span style={{...disp, fontSize:14, color:C.muted, width:34}}>{e.min||"–"}'</span>
            <span style={{fontSize:14, color: e.kind==="opp"?C.red : e.goal?C.flood : e.t==="error"?C.red : e.kind==="info"?C.muted : C.chalk}}>
              {e.kind==="you" && <b style={{color:C.pitch}}>You </b>}
              {e.txt}
            </span>
          </div>
        ))}
      </div>

      {/* decision modal inline */}
      {m.decision && (
        <Panel style={{marginTop:12, border:`1px solid ${C.flood}`}}>
          <Eyebrow>{m.decision.min}' · Decision</Eyebrow>
          <div style={{...disp, fontSize:19, margin:"8px 0 14px"}}>{m.decision.q}</div>
          <div style={{display:"flex", gap:8}}>
            {m.decision.a.map((opt,i)=><button key={i} onClick={()=>resolveDecision(i)} style={{...disp, flex:1, padding:"13px 6px", borderRadius:10, border:"none", background:i===0?C.flood:C.panel2, color:i===0?C.ink:C.chalk, fontSize:14, letterSpacing:0.5, textTransform:"uppercase", fontWeight:600}}>{opt}</button>)}
          </div>
        </Panel>
      )}

      <div style={{marginTop:16}}>
        {m.phase==="playing" && !m.decision && <Btn kind="ghost" onClick={skip}>Skip to result</Btn>}
        {m.phase==="done" && <Btn onClick={afterMatch}>Continue →</Btn>}
      </div>
    </div>
  );
}

function Summary({game, cont}){
  const s=game.lastSummary; const p=game.player;
  const N=game.opps.length;
  const rc = s.rating==null? C.muted : s.rating>=7?C.pitch:s.rating>=5.5?C.flood:C.red;
  const wk = s.weekNo ?? game.week;
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4}}>
        <div style={{...disp, fontSize:26, fontWeight:700, letterSpacing:1}}>Week {wk}<span style={{color:C.muted, fontSize:15}}> / {N}</span></div>
        <span style={{fontSize:12, color:C.muted}}>{s.rest? "Rest week" : "Result"}</span>
      </div>
      <div style={{height:4, background:C.line, borderRadius:2, marginBottom:14, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${(wk/N)*100}%`, background:C.pitch}}/>
      </div>
      {s.debut && (
        <div style={{background:C.flood, color:C.ink, borderRadius:12, padding:"12px 16px", textAlign:"center", marginBottom:12}}>
          <span style={{...disp, fontSize:18, fontWeight:700, letterSpacing:1}}>⚽ You made your senior debut!</span>
        </div>
      )}
      {s.birthday && (
        <div style={{background:C.panel2, border:`1px solid ${C.flood}`, borderRadius:12, padding:"11px 16px", textAlign:"center", marginBottom:12}}>
          <span style={{...disp, fontSize:16, fontWeight:700, letterSpacing:1}}>🎂 Happy birthday — you turned {s.age}</span>
        </div>
      )}
      {s.newInjury && (
        <div style={{background:C.red, color:C.ink, borderRadius:12, padding:"12px 16px", textAlign:"center", marginBottom:12}}>
          <span style={{...disp, fontSize:16, fontWeight:700, letterSpacing:1}}>✚ You picked up a knock in training</span>
        </div>
      )}
      {s.rest ? (
        <Panel style={{textAlign:"center", background:`linear-gradient(160deg, ${C.panel2}, ${C.panel})`}}>
          <div style={{...disp, fontSize:11, letterSpacing:2, color:C.muted, textTransform:"uppercase"}}>No fixture this week</div>
          <div style={{...disp, fontSize:28, fontWeight:700, margin:"8px 0"}}>Rest week</div>
          <div style={{fontSize:13, color:C.muted}}>{s.intensity} training · readiness now {s.freshness}</div>
        </Panel>
      ) : (
        <Panel style={{textAlign:"center"}}>
          <div style={{...disp, fontSize:16, color:C.muted}}>{s.fx.home?game.club.name:s.fx.opp} v {s.fx.home?s.fx.opp:game.club.name}</div>
          <div style={{...disp, fontSize:40, fontWeight:700, letterSpacing:2, margin:"2px 0"}}>{s.ours}<span style={{color:C.muted}}>:</span>{s.theirs}</div>
          <div style={{fontSize:13, color:C.muted}}>{s.role} · {s.minutes}'</div>
          {s.rating!=null && <div style={{...disp, fontSize:34, fontWeight:700, color:rc, marginTop:6}}>{s.rating.toFixed(1)}<span style={{fontSize:14, color:C.muted}}> your rating</span></div>}
        </Panel>
      )}

      {s.statusChange && <div style={{background:C.panel2, border:`1px solid ${C.flood}`, borderRadius:10, padding:"12px", marginTop:12, textAlign:"center"}}>
        <span style={{...disp, textTransform:"uppercase", letterSpacing:1}}>Status: {s.statusChange.from} → <span style={{color:C.flood}}>{s.statusChange.to}</span></span>
      </div>}

      <div style={{margin:"16px 0 8px"}}><Eyebrow>Development this week</Eyebrow></div>
      {Object.keys(s.deltas).filter(k=>s.deltas[k]>0.01).length ?
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          {Object.keys(s.deltas).filter(k=>s.deltas[k]>0.01).sort((a,b)=>s.deltas[b]-s.deltas[a]).map(k=>(
            <div key={k} style={{display:"flex", justifyContent:"space-between", background:C.panel2, borderRadius:9, padding:"8px 10px"}}>
              <span style={{fontSize:12, color:C.muted}}>{ATTR_LABEL[k]}</span>
              <span style={{...disp, color:C.pitch}}>▲ {s.deltas[k].toFixed(2)}</span>
            </div>
          ))}
        </div> : <div style={{fontSize:13, color:C.muted}}>No notable gains — a lighter week.</div>}

      {s.teamRatings && (()=>{
        const all=[...s.teamRatings, ...(s.rating!=null?[{name:"You", rating:s.rating, you:true}]:[])].sort((a,b)=>b.rating-a.rating);
        const avg=round1(all.reduce((a,b)=>a+b.rating,0)/all.length);
        return (
          <div>
            <div style={{margin:"18px 0 8px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <Eyebrow>Player ratings</Eyebrow>
              <span style={{fontSize:11, color:C.muted}}>Team avg <b style={{color:C.chalk}}>{avg}</b></span>
            </div>
            <Panel style={{padding:8}}>
              {all.map((x,i)=>(
                <div key={i} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 8px", borderRadius:8, background: x.you? C.panel2 : "transparent"}}>
                  <span style={{fontSize:13, color: x.you?C.chalk:C.muted, fontWeight:x.you?600:400}}>
                    {i===0 && <span style={{color:C.flood, marginRight:5}}>★</span>}
                    {x.you? "You" : x.name}{i===0 && <span style={{fontSize:10, color:C.flood, marginLeft:6, letterSpacing:1}}>MOTM</span>}
                  </span>
                  <span style={{...disp, fontSize:17, color: x.rating>=7?C.pitch : x.rating>=5.5?(x.you?C.flood:C.chalk) : C.red}}>{x.rating.toFixed(1)}</span>
                </div>
              ))}
            </Panel>
            {s.rating==null && <div style={{fontSize:12, color:C.muted, marginTop:6}}>You didn't feature — this was the team without you.</div>}
          </div>
        );
      })()}

      <div style={{fontSize:14, color:C.muted, fontStyle:"italic", margin:"16px 0"}}>“{s.coachNote}”</div>
      <Btn onClick={cont}>Continue to Week {(s.weekNo??game.week)+1} →</Btn>
    </div>
  );
}

function SeasonEnd({game, entry, onNew}){
  const p=game.player;
  return (
    <div>
      <div style={{...disp, fontSize:34, fontWeight:700, letterSpacing:2}}>Season complete</div>
      <div style={{color:C.muted, marginBottom:18}}>{p.name} · {POS[p.pos].label}{p.onLoan?" · spent the season on loan":""}</div>
      <Panel>
        <div style={{textAlign:"center", marginBottom:14}}>
          <Pill color={LADDER.indexOf(p.status)>=3?C.flood:C.pitch}>Finished as {p.status}</Pill>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          {[["Apps",entry.apps],["Starts",entry.starts],["Minutes",entry.minutes],["Goals",entry.goals],["Assists",entry.assists],["Avg rating",entry.avg??"–"]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center", background:C.panel2, borderRadius:10, padding:"12px 4px"}}>
              <div style={{...disp, fontSize:26, fontWeight:700, color:l==="Avg rating"?C.flood:C.chalk}}>{v}</div>
              <div style={{fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>
      </Panel>
      <div style={{margin:"16px 0 8px"}}><Eyebrow>Saved to career archive</Eyebrow></div>
      <div style={{fontSize:13, color:C.muted, marginBottom:18}}>This career now lives in the archive on the start screen — the persistent world would carry {p.name} onward from here.</div>
      <Btn onClick={onNew}>Start a new career →</Btn>
    </div>
  );
}

function ArchiveList({archive}){
  return (
    <div style={{display:"grid", gap:8, marginTop:10}}>
      {archive.map((e,i)=>(
        <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:C.panel, border:`1px solid ${C.line}`, borderRadius:10, padding:"10px 12px"}}>
          <div>
            <div style={{...disp, fontSize:16}}>{e.name}</div>
            <div style={{fontSize:11, color:C.muted}}>{e.pos} · {e.apps} apps · {e.goals}G {e.assists}A</div>
          </div>
          <Pill color={LADDER.indexOf(e.status)>=3?C.flood:C.pitch}>{e.status}</Pill>
        </div>
      ))}
    </div>
  );
}

function BottomNav({tab, setTab}){
  const items=[["home","Home"],["squad","Team"],["league","League"],["player","Player"],["relationships","People"]];
  return (
    <div style={{position:"fixed", left:0, right:0, bottom:0, background:C.panel, borderTop:`1px solid ${C.line}`, zIndex:40}}>
      <div style={{maxWidth:460, margin:"0 auto", display:"flex"}}>
        {items.map(([k,label])=>{
          const active=tab===k;
          return (
            <button key={k} onClick={()=>setTab(k)} style={{flex:1, background:"transparent", border:"none", padding:"11px 2px 13px", display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
              <span style={{width:20, height:3, borderRadius:2, background:active?C.pitch:"transparent"}}/>
              <span style={{...disp, fontSize:12, letterSpacing:1, textTransform:"uppercase", color:active?C.chalk:C.muted, fontWeight:active?600:400}}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({title, right, children}){
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
        <Eyebrow>{title}</Eyebrow>{right && <span style={{fontSize:11, color:C.muted}}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

function SquadScreen({game}){
  const p=game.player;
  const you={ name:"You", pos:POS[p.pos].label.slice(0,3).toUpperCase(), age:p.age, ability:round1(weightedAbility(p.attrs,p.pos)), goals:p.season.goals, apps:p.season.apps, avg: p.season.ratings.length? round1(p.season.ratings.reduce((a,b)=>a+b,0)/p.season.ratings.length):null, you:true };
  const rows=[you, ...game.squad].sort((a,b)=> (b.ability)-(a.ability));
  return (
    <div>
      <div style={{...disp, fontSize:28, fontWeight:700, letterSpacing:1}}>{game.club.name}</div>
      <div style={{color:C.muted, fontSize:13, marginBottom:16}}>First-team squad · {game.record.w}W {game.record.d}D {game.record.l}L</div>
      <div style={{display:"flex", fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, padding:"0 12px 6px"}}>
        <span style={{flex:1}}>Player</span><span style={{width:30, textAlign:"center"}}>Age</span><span style={{width:36, textAlign:"center"}}>Abil</span><span style={{width:30, textAlign:"center"}}>Gls</span><span style={{width:30, textAlign:"center"}}>Aps</span><span style={{width:36, textAlign:"center"}}>Avg</span>
      </div>
      <Panel style={{padding:6}}>
        {rows.map((r,i)=>{
          const retiring = !r.you && r.age>=34;
          return (
          <div key={i} style={{display:"flex", alignItems:"center", padding:"9px 6px", borderRadius:8, background:r.you?C.panel2:"transparent"}}>
            <span style={{flex:1, minWidth:0}}>
              <span style={{fontSize:13, color:C.chalk, fontWeight:r.you?600:400}}>{r.name}</span>
              <span style={{fontSize:10, color:C.muted, marginLeft:6}}>{r.pos}</span>
              {retiring && <span style={{fontSize:9, color:C.flood, marginLeft:6, letterSpacing:0.5}}>RETIRING SOON</span>}
            </span>
            <span style={{...disp, width:30, textAlign:"center", fontSize:14, color: retiring?C.flood:C.chalk}}>{r.age}</span>
            <span style={{...disp, width:36, textAlign:"center", color:C.chalk}}>{r.ability.toFixed(1)}</span>
            <span style={{width:30, textAlign:"center", fontSize:13, color:C.muted}}>{r.goals}</span>
            <span style={{width:30, textAlign:"center", fontSize:13, color:C.muted}}>{r.apps}</span>
            <span style={{...disp, width:36, textAlign:"center", color: r.avg? (r.avg>=7?C.pitch:C.flood):C.muted}}>{r.avg? r.avg.toFixed(1):"–"}</span>
          </div>
        );})}
      </Panel>
      <div style={{fontSize:11, color:C.muted, marginTop:8}}>Older players near retirement are flagged. Your row is highlighted; teammate stats are illustrative in this prototype.</div>
    </div>
  );
}

function LeagueScreen({game}){
  const played = game.record.w+game.record.d+game.record.l;
  const mine={ name:game.club.name, pl:played, w:game.record.w, d:game.record.d, l:game.record.l, gf:game.record.gf, ga:game.record.ga, you:true };
  const others = game.table.map(c=>{
    const w=Math.round(played*c.wRate), d=Math.round(played*c.dRate);
    const l=Math.max(0, played-w-d);
    const gf=Math.round(played*c.gfpg), ga=Math.round(played*c.gapg);
    return { name:c.name, pl:played, w, d, l, gf, ga };
  });
  const rows=[mine,...others].map(r=>({ ...r, gd:r.gf-r.ga, pts:r.w*3+r.d }))
    .sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  const cell=(v,w,color,bold)=> <span style={{width:w, textAlign:"center", fontSize:12, color:color||C.muted, fontFamily:bold?"Oswald, sans-serif":"inherit"}}>{v}</span>;
  return (
    <div>
      <div style={{...disp, fontSize:28, fontWeight:700, letterSpacing:1}}>League table</div>
      <div style={{color:C.muted, fontSize:13, marginBottom:16}}>Top division · after {played} {played===1?"match":"matches"}</div>
      <div style={{display:"flex", fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, padding:"0 8px 6px"}}>
        <span style={{width:18}}>#</span><span style={{flex:1}}>Club</span>
        {["P","W","D","L","GF","GA","GD","Pts"].map((h,i)=><span key={h} style={{width:i>=4?26:20, textAlign:"center"}}>{h}</span>)}
      </div>
      <Panel style={{padding:6}}>
        {rows.map((r,i)=>(
          <div key={i} style={{display:"flex", alignItems:"center", padding:"8px 4px", borderRadius:8, background:r.you?C.panel2:"transparent"}}>
            <span style={{...disp, width:18, fontSize:12, color: i<3?C.pitch: i>=rows.length-3?C.red:C.muted}}>{i+1}</span>
            <span style={{flex:1, minWidth:0, fontSize:12, color:C.chalk, fontWeight:r.you?600:400, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.name}</span>
            {cell(r.pl,20)}{cell(r.w,20)}{cell(r.d,20)}{cell(r.l,20)}
            {cell(r.gf,26)}{cell(r.ga,26)}{cell((r.gd>0?"+":"")+r.gd,26)}{cell(r.pts,26,C.chalk,true)}
          </div>
        ))}
      </Panel>
      <div style={{fontSize:11, color:C.muted, marginTop:8}}>P W D L · goals for / against / difference · points. Rival clubs are lightly simulated.</div>
    </div>
  );
}

function stars(n){ // n out of 5, supports halves
  const full=Math.floor(n), half=n-full>=0.5;
  return "★".repeat(full)+(half?"⯨":"")+"☆".repeat(5-full-(half?1:0));
}
function PlayerScreen({game, form}){
  const p=game.player;
  const cur=weightedAbility(p.attrs,p.pos), pot=weightedAbility(p.pot,p.pos);
  const avg = p.season.ratings.length? round1(p.season.ratings.reduce((a,b)=>a+b,0)/p.season.ratings.length):null;
  return (
    <div>
      <div style={{...disp, fontSize:30, fontWeight:700, letterSpacing:1, lineHeight:1}}>{p.name}</div>
      <div style={{color:C.muted, fontSize:13, marginTop:4, marginBottom:14}}>{POS[p.pos].label} · {game.club.name}{p.onLoan?" (loan)":""}</div>

      <Section title="Overview">
        <Panel>
          <Row label="Age" value={`${p.age} · birthday in week ${p.birthWeek+1}`}/>
          <Row label="Status" value={p.status}/>
          <Row label="Current ability" value={`${cur.toFixed(1)}  ${stars(clamp(cur/4,0,5))}`}/>
          <Row label="Potential" value={`${p.band}  ${stars(clamp(pot/4,0,5))}`} last/>
        </Panel>
      </Section>

      <Section title="This season">
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
          {[["Apps",p.season.apps],["Starts",p.season.starts],["Minutes",p.season.minutes],["Goals",p.season.goals],["Assists",p.season.assists],["Avg",avg??"–"]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center", background:C.panel2, borderRadius:10, padding:"12px 4px"}}>
              <div style={{...disp, fontSize:24, fontWeight:700, color:l==="Avg"?C.flood:C.chalk}}>{v}</div>
              <div style={{fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Attributes"><AttrGrid attrs={p.attrs}/></Section>

      <Section title="Form & condition">
        <Panel>
          <Row label="Recent form" value={form.toFixed(1)}/>
          <Row label="Readiness" value={`${Math.round(p.freshness)} / 100`}/>
          <Row label="Fitness" value={p.injuredWeeks>0? "Injured" : "Fit"} last/>
        </Panel>
      </Section>

      <Section title="Sponsors">
        <Panel><div style={{fontSize:13, color:C.muted}}>No sponsorship deals yet — these arrive as your profile grows. <span style={{color:C.line}}>(system not built in this slice)</span></div></Panel>
      </Section>
    </div>
  );
}
function Row({label, value, last}){
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom: last?"none":`1px solid ${C.panel2}`}}>
      <span style={{fontSize:13, color:C.muted}}>{label}</span>
      <span style={{...disp, fontSize:15, color:C.chalk}}>{value}</span>
    </div>
  );
}

function RelationshipsScreen({game, setGame, form}){
  const p=game.player;
  const standing = clamp(Math.round((LADDER.indexOf(p.status)/4)*100),0,100);
  const partWays=()=>{ const g=clone(game); g.agent=null; setGame(g); };
  const signAgent=()=>{ const g=clone(game); g.agent=newAgent(); setGame(g); };

  return (
    <div>
      <div style={{...disp, fontSize:28, fontWeight:700, letterSpacing:1}}>People</div>
      <div style={{color:C.muted, fontSize:13, marginBottom:16}}>The relationships shaping your career.</div>

      {/* Agent */}
      {game.agent ? (
        <Panel style={{marginBottom:10}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div><div style={{...disp, fontSize:18, fontWeight:600}}>{game.agent.name}</div><div style={{fontSize:12, color:C.muted, marginTop:1}}>Your agent · advises on your whole career</div></div>
            <span style={{...disp, fontSize:12, letterSpacing:1, textTransform:"uppercase", color: game.agent.trust>=60?C.pitch: game.agent.trust<=35?C.red:C.flood}}>Trust {game.agent.trust}%</span>
          </div>
          <div style={{height:4, background:C.line, borderRadius:2, margin:"10px 0", overflow:"hidden"}}>
            <div style={{height:"100%", width:`${game.agent.trust}%`, background: game.agent.trust>=60?C.pitch: game.agent.trust<=35?C.red:C.flood}}/>
          </div>
          <div style={{fontSize:13, color:C.muted, marginBottom:12}}>Trust reflects <b style={{color:C.chalk}}>your own calls</b> on their past advice — the game never tells you if they're truly reliable. The more you trust them, the more they help your development; distrust them and their help fades.</div>
          <button onClick={partWays} style={{...disp, width:"100%", padding:"11px", borderRadius:9, border:`1px solid ${C.line}`, background:"transparent", color:C.chalk, textTransform:"uppercase", letterSpacing:1, fontSize:13}}>Part ways with agent</button>
        </Panel>
      ) : (
        <Panel style={{marginBottom:10, border:`1px solid ${C.red}`}}>
          <div style={{...disp, fontSize:18, fontWeight:600, color:C.red}}>No agent</div>
          <div style={{fontSize:13, color:C.muted, margin:"6px 0 12px"}}>Without an agent, your <b style={{color:C.chalk}}>development is much slower</b> and no one is working to move your career forward. You should sign one.</div>
          <button onClick={signAgent} style={{...disp, width:"100%", padding:"12px", borderRadius:9, border:"none", background:C.pitch, color:C.ink, textTransform:"uppercase", letterSpacing:1, fontSize:14, fontWeight:600}}>Sign an agent</button>
        </Panel>
      )}

      {/* Coach */}
      <Panel style={{marginBottom:10}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <div><div style={{...disp, fontSize:18, fontWeight:600}}>{game.coach.name}</div><div style={{fontSize:12, color:C.muted, marginTop:1}}>Coach at {game.club.name} · picks the team</div></div>
          <span style={{...disp, fontSize:12, letterSpacing:1, textTransform:"uppercase", color:standing>=60?C.pitch:C.muted}}>Standing {standing}%</span>
        </div>
        <div style={{fontSize:13, color:C.muted, marginTop:8}}>This standing is with <b style={{color:C.chalk}}>{game.coach.name}</b> personally — if they leave for another club, you'd start fresh with whoever replaces them. Right now you're {p.status.toLowerCase()}.</div>
      </Panel>

      {/* Board */}
      <Panel style={{marginBottom:10}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <div><div style={{...disp, fontSize:18, fontWeight:600}}>{game.club.name} board</div><div style={{fontSize:12, color:C.muted, marginTop:1}}>Club management · contracts & ambition</div></div>
          <span style={{...disp, fontSize:12, letterSpacing:1, textTransform:"uppercase", color:C.muted}}>Neutral</span>
        </div>
        <div style={{fontSize:13, color:C.muted, marginTop:8}}>Sets your contract and the club's ambition. Win them over and you gain a say.</div>
      </Panel>

      {/* Sponsors */}
      <Panel>
        <div style={{...disp, fontSize:18, fontWeight:600}}>Sponsors</div>
        <div style={{fontSize:13, color:C.muted, marginTop:6}}>No deals yet — your marketability grows with performances and profile.</div>
      </Panel>

      <div style={{fontSize:11, color:C.muted, marginTop:10}}>Managing sponsors and the agent-trust mechanic are designed but not yet built into this slice.</div>
    </div>
  );
}

function AdviceModal({advice, onChoose, onMark}){
  const a=advice;
  const OptBtn=({k,label})=>(
    <button onClick={()=>onChoose(k)} style={{...disp, width:"100%", padding:"13px", borderRadius:10, border:`1px solid ${a.recKey===k?C.flood:C.line}`, background:a.recKey===k?"rgba(245,197,24,0.12)":"transparent", color:C.chalk, fontSize:15, letterSpacing:0.5, marginBottom:8, textAlign:"left", position:"relative"}}>
      {label}
      {a.recKey===k && <span style={{...disp, fontSize:10, letterSpacing:1, color:C.flood, textTransform:"uppercase", position:"absolute", right:12, top:"50%", transform:"translateY(-50%)"}}>Agent's pick</span>}
    </button>
  );
  return (
    <div style={{position:"fixed", inset:0, background:"#0009", display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:50}}>
      <div style={{maxWidth:410, width:"100%", background:C.panel, border:`1px solid ${C.flood}`, borderRadius:16, padding:20}}>
        <Eyebrow>Your agent</Eyebrow>
        {a.phase==="choose" ? (
          <>
            <div style={{fontSize:15, color:C.chalk, margin:"8px 0 8px"}}>{a.context}</div>
            <div style={{fontSize:13, color:C.muted, marginBottom:16, fontStyle:"italic"}}>{a.stake} It's your call — and only you can judge whether their advice is any good.</div>
            <OptBtn k="A" label={a.optA}/>
            <OptBtn k="B" label={a.optB}/>
          </>
        ) : (
          <>
            <div style={{...disp, fontSize:20, fontWeight:600, margin:"8px 0 6px", color:a.good?C.pitch:C.red}}>{a.good? "It worked out" : "It didn't work out"}</div>
            <div style={{fontSize:14, color:C.muted, marginBottom:6}}>{a.resultTxt}</div>
            <div style={{fontSize:12, color:C.muted, marginBottom:16}}>{a.followed? "You followed your agent's advice." : "You went against your agent's advice."}</div>
            <div style={{...disp, fontSize:13, letterSpacing:1, textTransform:"uppercase", color:C.muted, marginBottom:8}}>Your read on their advice?</div>
            <div style={{display:"flex", gap:8}}>
              <button onClick={()=>onMark(false)} style={{...disp, flex:1, padding:"13px", borderRadius:10, border:`1px solid ${C.red}`, background:"transparent", color:C.red, textTransform:"uppercase", letterSpacing:1, fontSize:13, fontWeight:600}}>Distrust</button>
              <button onClick={()=>onMark(true)} style={{...disp, flex:1, padding:"13px", borderRadius:10, border:"none", background:C.pitch, color:C.ink, textTransform:"uppercase", letterSpacing:1, fontSize:13, fontWeight:600}}>Trust</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoanModal({club, agentName, onAccept, onDecline}){
  return (
    <div style={{position:"fixed", inset:0, background:"#0009", display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:50}}>
      <div style={{maxWidth:400, width:"100%", background:C.panel, border:`1px solid ${C.flood}`, borderRadius:16, padding:20}}>
        <Eyebrow>{agentName? `${agentName} · your agent` : "Your agent"}</Eyebrow>
        <div style={{...disp, fontSize:22, margin:"8px 0 10px"}}>A loan offer</div>
        <div style={{fontSize:14, color:C.muted, marginBottom:18}}>You're not getting minutes. <b style={{color:C.chalk}}>{club}</b> want you on loan for the rest of the season — a smaller club, but you'd start every week and develop through real football.</div>
        <div style={{display:"flex", gap:8}}>
          <button onClick={onDecline} style={{...disp, flex:1, padding:"13px", borderRadius:10, border:`1px solid ${C.line}`, background:"transparent", color:C.chalk, textTransform:"uppercase", letterSpacing:1}}>Stay & fight</button>
          <button onClick={onAccept} style={{...disp, flex:1, padding:"13px", borderRadius:10, border:"none", background:C.flood, color:C.ink, textTransform:"uppercase", letterSpacing:1, fontWeight:600}}>Take the loan</button>
        </div>
      </div>
    </div>
  );
}
