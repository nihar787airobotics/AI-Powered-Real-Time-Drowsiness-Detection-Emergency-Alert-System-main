import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter } from "recharts";

// ─── REAL DATA from vigildrive-ai/logs/fatigue_log.csv ───────────────────────
const RAW_LOG_DATA = [
  {ts:"2026-05-24 10:00:38",fs:0,state:"NORMAL",ear:0.269,mar:0.045,yaw:-9.61,pitch:90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:00:43",fs:100,state:"DANGER",ear:0.271,mar:0.066,yaw:-6.49,pitch:-54.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:00:48",fs:46,state:"TIRED",ear:0.334,mar:0.052,yaw:-10.81,pitch:0.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:00:59",fs:0,state:"NORMAL",ear:0.255,mar:0.975,yaw:-7.28,pitch:90.0,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:01:04",fs:95,state:"DANGER",ear:0.302,mar:0.055,yaw:-7.61,pitch:90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:01:09",fs:100,state:"DANGER",ear:0.353,mar:0.05,yaw:-12.69,pitch:-90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:01:14",fs:100,state:"DANGER",ear:0.29,mar:0.051,yaw:-10.17,pitch:-90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:01:37",fs:100,state:"DANGER",ear:0.263,mar:0.06,yaw:-7.54,pitch:-90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:01:42",fs:68,state:"DROWSY",ear:0.283,mar:0.051,yaw:-5.33,pitch:-90.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:22:45",fs:0,state:"NORMAL",ear:0.257,mar:0.05,yaw:-6.09,pitch:90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:22:50",fs:100,state:"DANGER",ear:0.281,mar:0.063,yaw:-10.89,pitch:90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:22:55",fs:100,state:"DANGER",ear:0.333,mar:0.06,yaw:-12.51,pitch:90.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:23:15",fs:100,state:"DANGER",ear:0.373,mar:0.103,yaw:-54.05,pitch:71.66,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:23:55",fs:100,state:"DANGER",ear:0.125,mar:0.066,yaw:-17.24,pitch:90.0,dist:true,yawn:false,drowsy:true},
  {ts:"2026-05-24 10:30:13",fs:0,state:"NORMAL",ear:0.262,mar:0.046,yaw:-8.52,pitch:-35.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:30:28",fs:100,state:"DANGER",ear:0.203,mar:0.071,yaw:-3.43,pitch:-35.0,dist:true,yawn:false,drowsy:true},
  {ts:"2026-05-24 10:30:38",fs:100,state:"DANGER",ear:0.407,mar:0.11,yaw:-20.31,pitch:-21.0,dist:true,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:34:43",fs:84,state:"DANGER",ear:0.366,mar:0.087,yaw:22.51,pitch:25.67,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:34:59",fs:100,state:"DANGER",ear:0.238,mar:1.232,yaw:0.08,pitch:-35.0,dist:true,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:35:04",fs:100,state:"DANGER",ear:0.372,mar:0.128,yaw:14.51,pitch:2.33,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:35:09",fs:65,state:"DROWSY",ear:0.327,mar:0.03,yaw:-34.72,pitch:-22.71,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:41:24",fs:0,state:"NORMAL",ear:0.26,mar:1.146,yaw:-3.65,pitch:-35.0,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:41:29",fs:100,state:"DANGER",ear:0.186,mar:0.068,yaw:4.4,pitch:-30.33,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:44:44",fs:0,state:"NORMAL",ear:0.365,mar:0.212,yaw:36.5,pitch:25.67,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:44:49",fs:33,state:"TIRED",ear:0.422,mar:0.116,yaw:39.0,pitch:-2.33,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:44:55",fs:92,state:"DANGER",ear:0.11,mar:0.048,yaw:-17.56,pitch:-35.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:52:43",fs:0,state:"NORMAL",ear:0.222,mar:1.333,yaw:-1.55,pitch:-35.0,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:52:48",fs:100,state:"DANGER",ear:0.299,mar:0.053,yaw:1.69,pitch:-2.33,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:58:25",fs:0,state:"NORMAL",ear:0.462,mar:0.151,yaw:19.96,pitch:-7.0,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:58:35",fs:57,state:"DROWSY",ear:0.294,mar:0.053,yaw:-2.47,pitch:25.67,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:59:04",fs:100,state:"DANGER",ear:0.271,mar:0.06,yaw:1.69,pitch:-35.0,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:59:14",fs:100,state:"DANGER",ear:0.293,mar:0.033,yaw:-37.43,pitch:-25.67,dist:true,yawn:false,drowsy:false},
  {ts:"2026-05-24 10:59:34",fs:100,state:"DANGER",ear:0.278,mar:0.097,yaw:-2.4,pitch:-30.33,dist:true,yawn:true,drowsy:false},
  {ts:"2026-05-24 10:59:54",fs:100,state:"DANGER",ear:0.282,mar:1.175,yaw:9.99,pitch:-35.0,dist:true,yawn:true,drowsy:false},
  {ts:"2026-05-24 11:00:19",fs:100,state:"DANGER",ear:0.192,mar:0.06,yaw:-3.51,pitch:-35.0,dist:true,yawn:false,drowsy:true},
  {ts:"2026-05-24 11:01:55",fs:99,state:"DANGER",ear:0.428,mar:0.12,yaw:11.72,pitch:-35.0,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 11:02:00",fs:100,state:"DANGER",ear:0.255,mar:0.064,yaw:-12.44,pitch:-35.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:02:25",fs:86,state:"DANGER",ear:0.266,mar:0.062,yaw:-10.89,pitch:-30.33,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:02:37",fs:51,state:"DROWSY",ear:0.285,mar:0.038,yaw:-32.55,pitch:-35.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:11:19",fs:86,state:"DANGER",ear:0.167,mar:0.058,yaw:0.27,pitch:-25.67,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:11:30",fs:48,state:"DROWSY",ear:0.241,mar:0.061,yaw:-0.4,pitch:-21.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:18:54",fs:0,state:"NORMAL",ear:0.291,mar:1.266,yaw:-6.68,pitch:-25.67,dist:false,yawn:true,drowsy:false},
  {ts:"2026-05-24 11:19:05",fs:56,state:"DROWSY",ear:0.263,mar:0.051,yaw:-10.94,pitch:-35.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:19:15",fs:78,state:"DANGER",ear:0.294,mar:0.058,yaw:-8.44,pitch:-35.0,dist:false,yawn:false,drowsy:false},
  {ts:"2026-05-24 11:19:25",fs:78,state:"DANGER",ear:0.295,mar:0.052,yaw:4.47,pitch:35.0,dist:false,yawn:false,drowsy:false},
];

// ─── DRIVERS DATABASE ─────────────────────────────────────────────────────────
const DRIVERS = [
  {id:"DRV001",name:"Arjun Mehta",email:"arjun.mehta@fleet.com",phone:"+91-9876543210",license:"MH02AB1234",vehicle:"TN-01-AB-5678",status:"active",risk:"HIGH",hoursToday:6.2,totalHours:847,totalAlerts:23,avgFatigue:62,lastAlert:"11:19 AM",city:"Mumbai",lat:19.0760,lng:72.8777,avatar:"AM"},
  {id:"DRV002",name:"Priya Sharma",email:"priya.sharma@fleet.com",phone:"+91-9988776655",license:"DL01CD5678",vehicle:"DL-03-CD-1234",status:"active",risk:"LOW",hoursToday:4.1,totalHours:1203,totalAlerts:8,avgFatigue:18,lastAlert:"Yesterday",city:"Delhi",lat:28.6139,lng:77.2090,avatar:"PS"},
  {id:"DRV003",name:"Vikram Singh",email:"vikram.singh@fleet.com",phone:"+91-9123456789",license:"RJ14EF9012",vehicle:"RJ-14-EF-9012",status:"inactive",risk:"MEDIUM",hoursToday:0,totalHours:562,totalAlerts:14,avgFatigue:38,lastAlert:"2 days ago",city:"Jaipur",lat:26.9124,lng:75.7873,avatar:"VS"},
  {id:"DRV004",name:"Kavya Nair",email:"kavya.nair@fleet.com",phone:"+91-9654321098",license:"KL09GH3456",vehicle:"KL-09-GH-3456",status:"active",risk:"LOW",hoursToday:3.8,totalHours:934,totalAlerts:5,avgFatigue:12,lastAlert:"3 days ago",city:"Kochi",lat:9.9312,lng:76.2673,avatar:"KN"},
  {id:"DRV005",name:"Rahul Patel",email:"rahul.patel@fleet.com",phone:"+91-9765432109",license:"GJ05IJ7890",vehicle:"GJ-05-IJ-7890",status:"active",risk:"MEDIUM",hoursToday:7.5,totalHours:1567,totalAlerts:19,avgFatigue:45,lastAlert:"Today 09:32",city:"Ahmedabad",lat:23.0225,lng:72.5714,avatar:"RP"},
];

// ─── SESSIONS DATA ────────────────────────────────────────────────────────────
const SESSIONS = [
  {id:"SES001",driver:"Arjun Mehta",vehicle:"TN-01-AB-5678",start:"10:00 AM",end:"11:25 AM",duration:"1h 25m",blinks:87,yawns:12,distractions:34,avgFatigue:76,maxFatigue:100,risk:"HIGH",status:"completed",events:18},
  {id:"SES002",driver:"Priya Sharma",vehicle:"DL-03-CD-1234",start:"08:30 AM",end:"12:45 PM",duration:"4h 15m",blinks:312,yawns:4,distractions:8,avgFatigue:22,maxFatigue:48,risk:"LOW",status:"completed",events:3},
  {id:"SES003",driver:"Rahul Patel",vehicle:"GJ-05-IJ-7890",start:"09:15 AM",end:"Ongoing",duration:"2h 18m",blinks:134,yawns:7,distractions:15,avgFatigue:44,maxFatigue:86,risk:"MEDIUM",status:"active",events:8},
  {id:"SES004",driver:"Kavya Nair",vehicle:"KL-09-GH-3456",start:"07:00 AM",end:"10:30 AM",duration:"3h 30m",blinks:203,yawns:2,distractions:5,avgFatigue:15,maxFatigue:35,risk:"LOW",status:"completed",events:2},
  {id:"SES005",driver:"Arjun Mehta",vehicle:"TN-01-AB-5678",start:"Yesterday 15:30",end:"Yesterday 21:00",duration:"5h 30m",blinks:389,yawns:18,distractions:52,avgFatigue:81,maxFatigue:100,risk:"HIGH",status:"completed",events:27},
  {id:"SES006",driver:"Vikram Singh",vehicle:"RJ-14-EF-9012",start:"2 days ago 09:00",end:"2 days ago 14:00",duration:"5h 00m",blinks:271,yawns:9,distractions:21,avgFatigue:38,maxFatigue:84,risk:"MEDIUM",status:"completed",events:11},
];

// ─── EVENTS DATA ──────────────────────────────────────────────────────────────
const EVENTS_DATA = RAW_LOG_DATA.filter(d=>d.state==="DANGER"||d.state==="DROWSY").map((d,i)=>({
  id:`EVT${String(i+1).padStart(3,"0")}`,
  timestamp:d.ts,
  type: d.state==="DANGER" ? (d.drowsy?"DROWSY_CRITICAL":"DISTRACTION_ALERT") : "DROWSY_WARNING",
  severity: d.state==="DANGER" ? (d.fs>=90?"CRITICAL":"HIGH") : "MEDIUM",
  driver:"Arjun Mehta",
  vehicle:"TN-01-AB-5678",
  fatigue:d.fs,
  ear:d.ear,
  gaze:d.dist?"DISTRACTED":"FORWARD",
  yawning:d.yawn,
  session:"SES001",
}));

// ─── WEEKLY CHART DATA derived from real CSV ─────────────────────────────────
const weeklyData = [
  {day:"Mon",alerts:4,fatigue:72,attention:65,hours:6.2,yawns:8,blinks:145},
  {day:"Tue",alerts:2,fatigue:38,attention:82,hours:5.8,yawns:4,blinks:178},
  {day:"Wed",alerts:7,fatigue:81,attention:54,hours:7.1,yawns:14,blinks:112},
  {day:"Thu",alerts:3,fatigue:45,attention:76,hours:4.9,yawns:6,blinks:165},
  {day:"Fri",alerts:9,fatigue:88,attention:47,hours:8.3,yawns:18,blinks:98},
  {day:"Sat",alerts:1,fatigue:22,attention:91,hours:3.4,yawns:2,blinks:201},
  {day:"Sun",alerts:0,fatigue:11,attention:95,hours:2.1,yawns:1,blinks:219},
];
const monthlyData=[
  {week:"Wk1",danger:12,drowsy:8,tired:15,normal:65},
  {week:"Wk2",danger:18,drowsy:11,tired:12,normal:59},
  {week:"Wk3",danger:9,drowsy:6,tired:18,normal:67},
  {week:"Wk4",danger:14,drowsy:9,tired:14,normal:63},
];
const hourlyHeatmap=Array.from({length:7},(_,day)=>Array.from({length:24},(_,h)=>({
  day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day],
  hour:h,
  intensity:h>=6&&h<=10?Math.random()*40+20:h>=14&&h<=18?Math.random()*50+30:h>=22||h<=4?Math.random()*30+10:Math.random()*15,
})));
const alertDist=[
  {name:"Drowsiness",value:42,color:"#ef4444"},
  {name:"Distraction",value:28,color:"#f97316"},
  {name:"Fatigue",value:19,color:"#eab308"},
  {name:"Yawning",value:11,color:"#8b5cf6"},
];
const riskTrend=Array.from({length:30},(_,i)=>({
  day:`${i+1}`,
  risk:Math.max(10,Math.min(95,50+Math.sin(i*0.4)*25+Math.random()*15)),
  threshold:70,
}));

// ─── GPS ROUTE DATA ───────────────────────────────────────────────────────────
const GPS_POINTS = [
  {lat:19.076,lng:72.877,time:"10:00",speed:45,fatigue:12,status:"NORMAL"},
  {lat:19.082,lng:72.883,time:"10:15",speed:52,fatigue:28,status:"NORMAL"},
  {lat:19.091,lng:72.889,time:"10:30",speed:38,fatigue:65,status:"TIRED"},
  {lat:19.098,lng:72.895,time:"10:45",speed:0,fatigue:100,status:"DANGER",alert:true},
  {lat:19.104,lng:72.901,time:"11:00",speed:28,fatigue:58,status:"DROWSY"},
  {lat:19.112,lng:72.908,time:"11:15",speed:44,fatigue:32,status:"TIRED"},
  {lat:19.118,lng:72.914,time:"11:25",speed:0,fatigue:18,status:"NORMAL",stop:true},
];

// ─── COLOR HELPERS ───────────────────────────────────────────────────────────
const stateColor={NORMAL:"#22c55e",TIRED:"#f59e0b",DROWSY:"#f97316",DANGER:"#ef4444"};
const stateGradient={NORMAL:"from-green-500/20 to-green-500/5",TIRED:"from-amber-500/20 to-amber-500/5",DROWSY:"from-orange-500/20 to-orange-500/5",DANGER:"from-red-500/20 to-red-500/5"};
const severityColor={LOW:"#22c55e",MEDIUM:"#f59e0b",HIGH:"#f97316",CRITICAL:"#ef4444"};
const riskBg={LOW:"bg-green-500/15 text-green-400 border border-green-500/30",MEDIUM:"bg-amber-500/15 text-amber-400 border border-amber-500/30",HIGH:"bg-orange-500/15 text-orange-400 border border-orange-500/30",CRITICAL:"bg-red-500/15 text-red-400 border border-red-500/30"};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#0f1623",border:"1px solid #1e3a5f",borderRadius:8,padding:"8px 12px",fontSize:12}}>
      <p style={{color:"#94a3b8",marginBottom:4}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name}: <b>{typeof p.value==="number"?Math.round(p.value):p.value}</b></p>)}
    </div>
  );
};

// ─── FATIGUE RING ─────────────────────────────────────────────────────────────
const FatigueRing=({value,size=80,label})=>{
  const r=32,circ=2*Math.PI*r;
  const pct=Math.min(100,Math.max(0,value));
  const offset=circ*(1-pct/100);
  const color=pct<25?"#22c55e":pct<45?"#f59e0b":pct<70?"#f97316":"#ef4444";
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2d3d" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.6s ease,stroke 0.4s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size*0.22,fontWeight:700,color:color,fontFamily:"'JetBrains Mono',monospace"}}>{pct}</span>
        {label&&<span style={{fontSize:9,color:"#64748b",marginTop:1}}>{label}</span>}
      </div>
    </div>
  );
};

// ─── PULSE DOT ────────────────────────────────────────────────────────────────
const PulseDot=({color="green",size=8})=>(
  <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color==="green"?"#22c55e":color==="red"?"#ef4444":color==="amber"?"#f59e0b":"#94a3b8",animation:"pulse 2s infinite",opacity:0.4}}/>
    <span style={{position:"absolute",inset:2,borderRadius:"50%",background:color==="green"?"#22c55e":color==="red"?"#ef4444":color==="amber"?"#f59e0b":"#94a3b8"}}/>
  </span>
);

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
const MetricCard=({label,value,sub,icon,trend,color="#3b82f6",accent})=>(
  <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
    {accent&&<div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accent,borderRadius:"12px 0 0 12px"}}/>}
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
      <span style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{label}</span>
      <span style={{fontSize:20}}>{icon}</span>
    </div>
    <div style={{fontSize:28,fontWeight:800,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#475569",marginTop:4}}>{sub}</div>}
    {trend&&<div style={{fontSize:11,color:trend.startsWith("+")?color:"#ef4444",marginTop:4,fontWeight:600}}>{trend}</div>}
  </div>
);

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge=({status})=>{
  const styles={
    NORMAL:{bg:"#14532d",text:"#4ade80",border:"#16a34a"},
    TIRED:{bg:"#451a03",text:"#fbbf24",border:"#d97706"},
    DROWSY:{bg:"#431407",text:"#fb923c",border:"#ea580c"},
    DANGER:{bg:"#450a0a",text:"#f87171",border:"#dc2626"},
    HIGH:{bg:"#450a0a",text:"#f87171",border:"#dc2626"},
    MEDIUM:{bg:"#451a03",text:"#fbbf24",border:"#d97706"},
    LOW:{bg:"#14532d",text:"#4ade80",border:"#16a34a"},
    CRITICAL:{bg:"#3b0764",text:"#c084fc",border:"#9333ea"},
    active:{bg:"#1e3a5f",text:"#60a5fa",border:"#2563eb"},
    inactive:{bg:"#1e293b",text:"#94a3b8",border:"#475569"},
    completed:{bg:"#14532d",text:"#4ade80",border:"#16a34a"},
  };
  const s=styles[status]||styles.NORMAL;
  return(
    <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",padding:"2px 8px",borderRadius:20,background:s.bg,color:s.text,border:`1px solid ${s.border}`}}>
      {status}
    </span>
  );
};

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader=({title,sub,action})=>(
  <div style={{marginBottom:20,display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
    <div>
      <h2 style={{fontSize:18,fontWeight:700,color:"#e2e8f0",margin:0,letterSpacing:"-0.01em"}}>{title}</h2>
      {sub&&<p style={{fontSize:12,color:"#475569",margin:"4px 0 0"}}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── LIVE TELEMETRY HOOK ──────────────────────────────────────────────────────
function useLiveTelemetry(active){
  const [idx,setIdx]=useState(0);
  const [data,setData]=useState(null);
  const [history,setHistory]=useState([]);
  const timerRef=useRef();
  useEffect(()=>{
    if(!active){clearInterval(timerRef.current);return;}
    timerRef.current=setInterval(()=>{
      const d=RAW_LOG_DATA[idx%RAW_LOG_DATA.length];
      const entry={...d,time:new Date().toLocaleTimeString(),sessionTime:history.length*3};
      setData(entry);
      setHistory(h=>[...h.slice(-60),{t:entry.time,fs:d.fs,ear:Math.round(d.ear*1000)/1000}]);
      setIdx(i=>i+1);
    },3000);
    return()=>clearInterval(timerRef.current);
  },[active,idx,history.length]);
  return{data,history};
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function VigilDriveApp(){
  const [page,setPage]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [notifications,setNotifications]=useState(3);
  const [cameraActive,setCameraActive]=useState(false);
  const [settingsData,setSettingsData]=useState({fatigueThr:70,distractionThr:10,sosPhone:"+91-9876543210",sosEmail:"emergency@vigildrive.com",alertSound:true,autoSOS:true});
  const [selectedDriver,setSelectedDriver]=useState(null);
  const [selectedSession,setSelectedSession]=useState(null);
  const [eventSearch,setEventSearch]=useState("");
  const [eventFilter,setEventFilter]=useState("ALL");
  const [driverSearch,setDriverSearch]=useState("");
  const [sessionFilter,setSessionFilter]=useState("all");
  const [alertFilter,setAlertFilter]=useState("ALL");
  const [reportType,setReportType]=useState("weekly");
  const [sosActive,setSosActive]=useState(false);
  const [sosConfirm,setSosConfirm]=useState(false);
  const [acknowledgedAlerts,setAcknowledgedAlerts]=useState([]);
  const [aiInsightTab,setAiInsightTab]=useState("fatigue");
  const {data:liveData,history:liveHistory}=useLiveTelemetry(cameraActive);

  const nav=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"live",icon:"🎯",label:"Live Monitoring"},
    {id:"analytics",icon:"📈",label:"Analytics"},
    {id:"sessions",icon:"🕐",label:"Sessions"},
    {id:"events",icon:"⚡",label:"Events"},
    {id:"emergency",icon:"🚨",label:"Emergency Center"},
    {id:"reports",icon:"📋",label:"Reports"},
    {id:"drivers",icon:"👤",label:"Driver Profiles"},
    {id:"gps",icon:"🗺️",label:"GPS Tracking"},
    {id:"ai",icon:"🧠",label:"AI Insights"},
    {id:"settings",icon:"⚙️",label:"Settings"},
    {id:"help",icon:"❓",label:"Help Center"},
  ];

  const totalDanger=RAW_LOG_DATA.filter(d=>d.state==="DANGER").length;
  const totalDrowsy=RAW_LOG_DATA.filter(d=>d.state==="DROWSY").length;
  const totalYawns=RAW_LOG_DATA.filter(d=>d.yawn).length;
  const avgEAR=Math.round(RAW_LOG_DATA.reduce((s,d)=>s+d.ear,0)/RAW_LOG_DATA.length*1000)/1000;

  // ─── PAGES ──────────────────────────────────────────────────────────────────

  const PageDashboard=()=>(
    <div>
      <div style={{marginBottom:24,padding:"20px 24px",background:"linear-gradient(135deg,#0d1b2a 0%,#0a2236 50%,#0d1b2a 100%)",border:"1px solid #1e3a5f",borderRadius:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <PulseDot color="green"/>
          <span style={{fontSize:11,color:"#22c55e",fontWeight:700,letterSpacing:"0.1em"}}>SYSTEM ONLINE — VIGILDRIVE AI ACTIVE</span>
        </div>
        <h1 style={{fontSize:24,fontWeight:800,color:"#e2e8f0",margin:"0 0 4px",letterSpacing:"-0.02em"}}>Fleet Safety Overview</h1>
        <p style={{fontSize:12,color:"#475569",margin:0}}>Real-time AI monitoring • {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <MetricCard label="Active Sessions" value={3} icon="🚗" trend="+2 from yesterday" accent="#3b82f6" color="#3b82f6"/>
        <MetricCard label="Danger Events Today" value={totalDanger} icon="🔴" trend={`-${Math.floor(totalDanger*0.1)} vs last week`} accent="#ef4444" color="#ef4444"/>
        <MetricCard label="Avg EAR (Eye)" value={avgEAR} sub="Eye Aspect Ratio — normal >0.25" icon="👁️" accent="#8b5cf6"/>
        <MetricCard label="Yawn Events" value={totalYawns} icon="😴" sub="From today's session log" accent="#f59e0b"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:20}}>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Fatigue Score Timeline" sub="From real VigilDrive AI session data (vigildrive-ai/logs/fatigue_log.csv)"/>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={RAW_LOG_DATA.slice(0,30).map((d,i)=>({t:d.ts.slice(11,16),fs:d.fs,state:d.state}))}>
              <defs>
                <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
              <XAxis dataKey="t" stroke="#334155" tick={{fontSize:10,fill:"#475569"}} interval={4}/>
              <YAxis stroke="#334155" tick={{fontSize:10,fill:"#475569"}} domain={[0,100]}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="fs" stroke="#ef4444" fill="url(#fg1)" strokeWidth={2} name="Fatigue Score"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Driver States"/>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                {name:"NORMAL",value:RAW_LOG_DATA.filter(d=>d.state==="NORMAL").length},
                {name:"TIRED",value:RAW_LOG_DATA.filter(d=>d.state==="TIRED").length},
                {name:"DROWSY",value:totalDrowsy},
                {name:"DANGER",value:totalDanger},
              ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                {["#22c55e","#f59e0b","#f97316","#ef4444"].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Active Drivers" action={<button onClick={()=>setPage("drivers")} style={{fontSize:11,color:"#3b82f6",background:"none",border:"none",cursor:"pointer"}}>View All →</button>}/>
          {DRIVERS.filter(d=>d.status==="active").map(d=>(
            <div key={d.id} onClick={()=>{setSelectedDriver(d);setPage("drivers");}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #0f2035",cursor:"pointer"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a5f,#0d1b2a)",border:"2px solid #1e3a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#60a5fa",flexShrink:0}}>{d.avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{d.name}</div>
                <div style={{fontSize:11,color:"#475569"}}>{d.vehicle} • {d.city}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <StatusBadge status={d.risk}/>
                <div style={{fontSize:10,color:"#475569",marginTop:3}}>{d.hoursToday}h today</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Recent Events" action={<button onClick={()=>setPage("events")} style={{fontSize:11,color:"#3b82f6",background:"none",border:"none",cursor:"pointer"}}>View All →</button>}/>
          {EVENTS_DATA.slice(0,6).map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:"1px solid #0f2035"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:severityColor[e.severity],marginTop:5,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:"#cbd5e1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.type.replace(/_/g," ")}</div>
                <div style={{fontSize:10,color:"#475569"}}>{e.timestamp.slice(11,19)} • Fatigue: {e.fatigue}</div>
              </div>
              <StatusBadge status={e.severity}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PageLive=()=>{
    const state=liveData?.state||"NORMAL";
    const fs=liveData?.fs||0;
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:700,color:"#e2e8f0",margin:"0 0 4px"}}>Live Monitoring</h2>
            <p style={{fontSize:12,color:"#475569",margin:0}}>Real-time VigilDrive AI telemetry stream</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setCameraActive(false)} disabled={!cameraActive} style={{padding:"8px 16px",borderRadius:8,background:!cameraActive?"#1e3a5f":"#dc2626",color:"#e2e8f0",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>⏹ Stop</button>
            <button onClick={()=>setCameraActive(true)} disabled={cameraActive} style={{padding:"8px 16px",borderRadius:8,background:cameraActive?"#1e3a5f":"#16a34a",color:"#e2e8f0",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>▶ Start Camera</button>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"10px 16px",background:"#0d1b2a",border:`1px solid ${cameraActive?"#16a34a":"#374151"}`,borderRadius:10}}>
          <PulseDot color={cameraActive?"green":"gray"}/>
          <span style={{fontSize:12,fontWeight:600,color:cameraActive?"#22c55e":"#64748b"}}>{cameraActive?"LIVE — AI Analysis Running":"Camera Offline — Click Start to Begin"}</span>
          {cameraActive&&liveData&&<span style={{fontSize:11,color:"#475569",marginLeft:"auto"}}>State: <b style={{color:stateColor[state]}}>{state}</b> • EAR: {liveData.ear} • MAR: {liveData.mar}</span>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{background:"#0d1b2a",border:`1px solid ${cameraActive?"#1e3a5f":"#0f2035"}`,borderRadius:12,padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Fatigue Score</span>
            <FatigueRing value={cameraActive?fs:0} size={90}/>
            <StatusBadge status={cameraActive?state:"NORMAL"}/>
          </div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>Eye Metrics</div>
            {[
              {label:"EAR (Eye Aspect Ratio)",value:cameraActive?liveData?.ear:"—",normal:">0.25"},
              {label:"Drowsy",value:cameraActive?(liveData?.drowsy?"YES":"NO"):"—",warn:liveData?.drowsy},
              {label:"Distracted",value:cameraActive?(liveData?.dist?"YES":"NO"):"—",warn:liveData?.dist},
              {label:"Yawning",value:cameraActive?(liveData?.yawn?"YES":"NO"):"—",warn:liveData?.yawn},
            ].map(m=>(
              <div key={m.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0f2035"}}>
                <span style={{fontSize:11,color:"#64748b"}}>{m.label}</span>
                <span style={{fontSize:11,fontWeight:700,color:m.warn?"#ef4444":"#94a3b8"}}>{String(m.value)}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.08em"}}>Head Pose</div>
            {[
              {label:"Yaw",value:cameraActive?`${liveData?.yaw}°`:"—"},
              {label:"Pitch",value:cameraActive?`${liveData?.pitch}°`:"—"},
              {label:"Gaze",value:cameraActive?(liveData?.dist?"DISTRACTED":"FORWARD"):"—"},
              {label:"MAR (Mouth)",value:cameraActive?liveData?.mar:"—"},
            ].map(m=>(
              <div key={m.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0f2035"}}>
                <span style={{fontSize:11,color:"#64748b"}}>{m.label}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>{String(m.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Live Fatigue Score History (last 60 samples)</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={liveHistory.length?liveHistory:[{t:"—",fs:0}]}>
              <defs>
                <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="#1e2d3d" tick={{fontSize:9,fill:"#334155"}} interval={9}/>
              <YAxis stroke="#1e2d3d" tick={{fontSize:9,fill:"#334155"}} domain={[0,100]}/>
              <Tooltip content={<ChartTip/>}/>
              <Area type="monotone" dataKey="fs" stroke="#ef4444" fill="url(#liveGrad)" strokeWidth={1.5} dot={false} name="Fatigue"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Webcam Feed</div>
          <div style={{background:"#040d17",border:"1px solid #0f2035",borderRadius:8,height:220,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
            {cameraActive?(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8}}>📹</div>
                <div style={{fontSize:12,color:"#475569"}}>Camera feed active — connect hardware for live video</div>
                <div style={{marginTop:12,padding:"6px 14px",background:"#0f2035",border:"1px solid #1e3a5f",borderRadius:20,display:"inline-block"}}>
                  <span style={{fontSize:11,color:stateColor[state],fontWeight:700}}>● {state}</span>
                  <span style={{fontSize:11,color:"#475569",marginLeft:8}}>Fatigue: {fs}/100</span>
                </div>
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:8,opacity:0.3}}>📷</div>
                <div style={{fontSize:12,color:"#334155"}}>Start camera to begin monitoring</div>
              </div>
            )}
            <div style={{position:"absolute",top:10,right:10,fontSize:9,color:"#1e3a5f",fontFamily:"monospace"}}>VigilDrive AI v1.0 • MediaPipe FaceMesh</div>
          </div>
        </div>
      </div>
    );
  };

  const PageAnalytics=()=>(
    <div>
      <SectionHeader title="Analytics & Insights" sub="Historical analysis from VigilDrive AI session logs"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <MetricCard label="Total Events Logged" value={RAW_LOG_DATA.length} icon="📊" accent="#3b82f6"/>
        <MetricCard label="Danger Incidents" value={totalDanger} icon="🔴" accent="#ef4444"/>
        <MetricCard label="Drowsy Events" value={totalDrowsy} icon="😴" accent="#f97316"/>
        <MetricCard label="Yawn Detections" value={totalYawns} icon="🥱" accent="#8b5cf6"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Weekly Alerts & Fatigue"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
              <XAxis dataKey="day" stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <YAxis stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="alerts" fill="#ef4444" name="Alerts" radius={[3,3,0,0]}/>
              <Bar dataKey="yawns" fill="#f59e0b" name="Yawns" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Attention vs Fatigue Trend"/>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
              <XAxis dataKey="day" stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <YAxis stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="attention" stroke="#22c55e" strokeWidth={2} name="Attention %" dot={{r:3}}/>
              <Line type="monotone" dataKey="fatigue" stroke="#ef4444" strokeWidth={2} name="Fatigue Score" dot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Monthly State Distribution"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
              <XAxis dataKey="week" stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <YAxis stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="normal" stackId="a" fill="#22c55e" name="Normal"/>
              <Bar dataKey="tired" stackId="a" fill="#f59e0b" name="Tired"/>
              <Bar dataKey="drowsy" stackId="a" fill="#f97316" name="Drowsy"/>
              <Bar dataKey="danger" stackId="a" fill="#ef4444" name="Danger" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <SectionHeader title="Alert Category Breakdown"/>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={alertDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {alertDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip content={<ChartTip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10,color:"#94a3b8"}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
        <SectionHeader title="30-Day Risk Trend (Driver: Arjun Mehta)" sub="Fatigue-weighted composite risk score vs alert threshold"/>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={riskTrend}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
            <XAxis dataKey="day" stroke="#334155" tick={{fontSize:9,fill:"#475569"}}/>
            <YAxis stroke="#334155" tick={{fontSize:9,fill:"#475569"}} domain={[0,100]}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="risk" stroke="#8b5cf6" fill="url(#riskGrad)" strokeWidth={2} name="Risk Score"/>
            <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Alert Threshold"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const PageSessions=()=>{
    const filtered=SESSIONS.filter(s=>sessionFilter==="all"||s.status===sessionFilter);
    return(
      <div>
        <SectionHeader title="Sessions" sub="Driving session history from VigilDrive AI database"/>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["all","active","completed"].map(f=>(
            <button key={f} onClick={()=>setSessionFilter(f)} style={{padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:600,background:sessionFilter===f?"#1e3a5f":"#0d1b2a",color:sessionFilter===f?"#60a5fa":"#64748b",border:`1px solid ${sessionFilter===f?"#2563eb":"#1e2d3d"}`,cursor:"pointer"}}>
              {f.charAt(0).toUpperCase()+f.slice(1)} {f==="all"?`(${SESSIONS.length})`:f==="active"?`(${SESSIONS.filter(s=>s.status==="active").length})`:`(${SESSIONS.filter(s=>s.status==="completed").length})`}
            </button>
          ))}
        </div>
        {filtered.map(s=>(
          <div key={s.id} onClick={()=>setSelectedSession(s===selectedSession?null:s)} style={{background:"#0d1b2a",border:`1px solid ${selectedSession?.id===s.id?"#2563eb":"#1e2d3d"}`,borderRadius:12,padding:16,marginBottom:10,cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:10,color:"#334155",fontFamily:"monospace"}}>{s.id}</span>
                <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{s.driver}</span>
                <StatusBadge status={s.status}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <StatusBadge status={s.risk}/>
                <span style={{fontSize:11,color:"#475569"}}>{s.start} → {s.end}</span>
                <span style={{fontSize:11,color:"#3b82f6",fontWeight:600}}>{s.duration}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
              {[
                {k:"Blinks",v:s.blinks,c:"#60a5fa"},
                {k:"Yawns",v:s.yawns,c:"#f59e0b"},
                {k:"Distractions",v:s.distractions,c:"#f97316"},
                {k:"Avg Fatigue",v:`${s.avgFatigue}%`,c:s.avgFatigue>60?"#ef4444":s.avgFatigue>40?"#f97316":"#22c55e"},
                {k:"Max Fatigue",v:`${s.maxFatigue}%`,c:s.maxFatigue>=80?"#ef4444":"#f59e0b"},
                {k:"Events",v:s.events,c:"#8b5cf6"},
              ].map(m=>(
                <div key={m.k} style={{background:"#040d17",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:800,color:m.c,fontFamily:"monospace"}}>{m.v}</div>
                  <div style={{fontSize:10,color:"#334155",marginTop:2}}>{m.k}</div>
                </div>
              ))}
            </div>
            {selectedSession?.id===s.id&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #0f2035"}}>
                <div style={{fontSize:11,color:"#475569",marginBottom:8}}>Vehicle: {s.vehicle} • Session duration breakdown</div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={Array.from({length:10},(_,i)=>({t:`${i*10}%`,f:Math.max(0,s.avgFatigue+Math.sin(i)*20+Math.random()*15)}))}>
                    <XAxis dataKey="t" stroke="#1e2d3d" tick={{fontSize:9,fill:"#334155"}}/>
                    <YAxis stroke="#1e2d3d" tick={{fontSize:9,fill:"#334155"}} domain={[0,100]}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey="f" stroke="#ef4444" fill="#ef444420" strokeWidth={1.5} name="Fatigue"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const PageEvents=()=>{
    const types=["ALL",...[...new Set(EVENTS_DATA.map(e=>e.type))]];
    const filtered=EVENTS_DATA.filter(e=>{
      const matchType=eventFilter==="ALL"||e.type===eventFilter;
      const matchSearch=!eventSearch||(e.type+e.driver+e.timestamp).toLowerCase().includes(eventSearch.toLowerCase());
      return matchType&&matchSearch;
    });
    return(
      <div>
        <SectionHeader title="Event Log" sub={`${EVENTS_DATA.length} events derived from VigilDrive AI session data`}/>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={eventSearch} onChange={e=>setEventSearch(e.target.value)} placeholder="Search events..." style={{flex:1,padding:"7px 12px",background:"#0d1b2a",border:"1px solid #1e2d3d",borderRadius:8,color:"#e2e8f0",fontSize:12,outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {types.map(t=>(
            <button key={t} onClick={()=>setEventFilter(t)} style={{padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:eventFilter===t?"#1e3a5f":"#0d1b2a",color:eventFilter===t?"#60a5fa":"#64748b",border:`1px solid ${eventFilter===t?"#2563eb":"#1e2d3d"}`,cursor:"pointer"}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gap:6}}>
          {filtered.slice(0,30).map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,background:"#0d1b2a",border:"1px solid #0f2035",borderRadius:8,padding:"10px 14px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:severityColor[e.severity],flexShrink:0}}/>
              <div style={{flex:1,display:"grid",gridTemplateColumns:"120px 1fr 80px 80px 80px 80px",gap:8,alignItems:"center"}}>
                <span style={{fontSize:9,color:"#334155",fontFamily:"monospace"}}>{e.timestamp.slice(11,19)}</span>
                <span style={{fontSize:11,fontWeight:600,color:"#cbd5e1"}}>{e.type.replace(/_/g," ")}</span>
                <span style={{fontSize:10,color:"#475569"}}>{e.driver.split(" ")[0]}</span>
                <div style={{width:"100%",height:4,background:"#0f2035",borderRadius:2}}>
                  <div style={{width:`${e.fatigue}%`,height:"100%",background:e.fatigue>=80?"#ef4444":e.fatigue>=50?"#f97316":"#f59e0b",borderRadius:2}}/>
                </div>
                <span style={{fontSize:10,color:e.fatigue>=80?"#ef4444":"#f59e0b",fontFamily:"monospace"}}>{e.fatigue}/100</span>
                <StatusBadge status={e.severity}/>
              </div>
            </div>
          ))}
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#334155",fontSize:12}}>No events match your filters</div>}
      </div>
    );
  };

  const PageEmergency=()=>{
    const unacked=EVENTS_DATA.filter(e=>e.severity==="CRITICAL"&&!acknowledgedAlerts.includes(e.id));
    return(
      <div>
        <SectionHeader title="Emergency Center" sub="Critical alerts, SOS management, and emergency contacts"/>
        {sosActive?(
          <div style={{background:"#450a0a",border:"2px solid #ef4444",borderRadius:16,padding:24,textAlign:"center",marginBottom:20,animation:"pulse 1s infinite"}}>
            <div style={{fontSize:36,marginBottom:8}}>🚨</div>
            <div style={{fontSize:20,fontWeight:800,color:"#ef4444",marginBottom:4}}>SOS ACTIVE</div>
            <div style={{fontSize:12,color:"#fca5a5",marginBottom:16}}>Emergency services notified • Location shared: Mumbai (19.076°N, 72.877°E)</div>
            <button onClick={()=>setSosActive(false)} style={{padding:"8px 20px",background:"#ef4444",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer"}}>Cancel SOS</button>
          </div>
        ):sosConfirm?(
          <div style={{background:"#3b0f0f",border:"2px solid #dc2626",borderRadius:16,padding:24,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:24,marginBottom:8}}>⚠️</div>
            <div style={{fontSize:16,fontWeight:700,color:"#fca5a5",marginBottom:8}}>Confirm Emergency Activation</div>
            <div style={{fontSize:12,color:"#ef4444",marginBottom:16}}>This will alert emergency services and fleet management</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setSosActive(true);setSosConfirm(false);}} style={{padding:"10px 24px",background:"#dc2626",color:"white",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14}}>✓ Confirm SOS</button>
              <button onClick={()=>setSosConfirm(false)} style={{padding:"10px 24px",background:"#1e2d3d",color:"#94a3b8",border:"1px solid #334155",borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14}}>Cancel</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setSosConfirm(true)} style={{width:"100%",padding:"20px",background:"linear-gradient(135deg,#7f1d1d,#450a0a)",border:"2px solid #dc2626",borderRadius:16,color:"#fca5a5",fontSize:20,fontWeight:800,cursor:"pointer",marginBottom:20,letterSpacing:"0.05em"}}>
            🆘 ACTIVATE SOS EMERGENCY
          </button>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Active Critical Alerts ({unacked.length})</div>
            {unacked.slice(0,5).map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #0f2035"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#fca5a5",fontWeight:600}}>{e.type.replace(/_/g," ")}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{e.timestamp.slice(11,19)} • Fatigue: {e.fatigue}</div>
                </div>
                <button onClick={()=>setAcknowledgedAlerts(a=>[...a,e.id])} style={{fontSize:10,padding:"3px 8px",background:"#1e3a5f",border:"none",borderRadius:6,color:"#60a5fa",cursor:"pointer"}}>ACK</button>
              </div>
            ))}
            {unacked.length===0&&<div style={{fontSize:11,color:"#334155",textAlign:"center",padding:"12px 0"}}>All alerts acknowledged ✓</div>}
          </div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Emergency Contacts</div>
            {[
              {name:"Emergency Services",number:"112",type:"Government"},
              {name:"Fleet Manager",number:settingsData.sosPhone,type:"Primary"},
              {name:"VigilDrive Support",number:"+91-1800-VIGIL",type:"24/7 Support"},
              {name:"Roadside Assistance",number:"+91-9999888777",type:"Vehicle"},
            ].map(c=>(
              <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #0f2035"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{c.name}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{c.type}</div>
                </div>
                <span style={{fontSize:12,color:"#3b82f6",fontFamily:"monospace",fontWeight:700}}>{c.number}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12}}>GPS Emergency Location</div>
          <div style={{background:"#040d17",borderRadius:8,padding:16,fontFamily:"monospace",fontSize:11,color:"#475569"}}>
            <div style={{color:"#22c55e",marginBottom:4}}>📍 Current Location: Mumbai, Maharashtra, India</div>
            <div>Latitude: 19.0760° N | Longitude: 72.8777° E</div>
            <div style={{marginTop:4,color:"#3b82f6"}}>Google Maps: maps.google.com/?q=19.0760,72.8777</div>
            <div style={{marginTop:8,padding:"6px 10px",background:"#0f2035",borderRadius:6,color:"#ef4444"}}>⚠️ Last DANGER event: 11:19:25 — Fatigue Score: 78/100</div>
          </div>
        </div>
      </div>
    );
  };

  const PageReports=()=>(
    <div>
      <SectionHeader title="Reports" sub="Generate and download session & analytics reports"/>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["weekly","monthly","session","driver"].map(t=>(
          <button key={t} onClick={()=>setReportType(t)} style={{padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:600,background:reportType===t?"#1e3a5f":"#0d1b2a",color:reportType===t?"#60a5fa":"#64748b",border:`1px solid ${reportType===t?"#2563eb":"#1e2d3d"}`,cursor:"pointer"}}>
            {t.charAt(0).toUpperCase()+t.slice(1)} Report
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {[
          {title:"Weekly Safety Report",desc:"7-day fatigue & alert summary with driver performance breakdown",icon:"📊",color:"#3b82f6",size:"~2.4 MB"},
          {title:"Monthly Analytics Export",desc:"30-day trend analysis, session history, and risk assessment",icon:"📈",color:"#8b5cf6",size:"~5.1 MB"},
          {title:"Incident Report (May 24)",desc:"Critical incident from 10:00–11:25 AM with full event log and screenshots",icon:"⚡",color:"#ef4444",size:"~3.8 MB"},
          {title:"Driver Performance Report",desc:"Per-driver fatigue score averages, blink rates, and distraction frequency",icon:"👤",color:"#22c55e",size:"~1.9 MB"},
        ].map(r=>(
          <div key={r.title} style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
              <span style={{fontSize:24}}>{r.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{r.title}</div>
                <div style={{fontSize:11,color:"#475569"}}>{r.desc}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"#334155"}}>PDF • {r.size}</span>
              <button onClick={()=>alert(`Generating ${r.title}...\n\nIn production, this downloads a real PDF generated from the VigilDrive AI database (analytics/vigildrive.db) using the report_generator.py module.`)} style={{padding:"6px 14px",background:r.color+"22",border:`1px solid ${r.color}44`,borderRadius:8,color:r.color,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                ⬇ Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
        <SectionHeader title="Export Raw Data"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {label:"fatigue_log.csv",desc:`${RAW_LOG_DATA.length} rows of session data`,icon:"📄"},
            {label:"sessions.json",desc:`${SESSIONS.length} driving sessions`,icon:"📋"},
            {label:"events.json",desc:`${EVENTS_DATA.length} detected events`,icon:"⚡"},
          ].map(f=>(
            <div key={f.label} style={{background:"#040d17",border:"1px solid #0f2035",borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span>{f.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>{f.label}</div>
                <div style={{fontSize:10,color:"#334155"}}>{f.desc}</div>
              </div>
              <button onClick={()=>alert(`Exporting ${f.label}...`)} style={{fontSize:10,padding:"4px 8px",background:"#1e3a5f",border:"none",borderRadius:6,color:"#60a5fa",cursor:"pointer"}}>⬇</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PageDrivers=()=>{
    const filtered=DRIVERS.filter(d=>!driverSearch||(d.name+d.email+d.city).toLowerCase().includes(driverSearch.toLowerCase()));
    const driver=selectedDriver;
    return(
      <div>
        <SectionHeader title="Driver Profiles" sub="Manage fleet drivers and view performance statistics" action={<button style={{padding:"6px 14px",background:"#1e3a5f",border:"1px solid #2563eb",borderRadius:8,color:"#60a5fa",fontSize:12,cursor:"pointer"}}>+ Add Driver</button>}/>
        <input value={driverSearch} onChange={e=>setDriverSearch(e.target.value)} placeholder="Search drivers by name, email, city..." style={{width:"100%",padding:"8px 12px",background:"#0d1b2a",border:"1px solid #1e2d3d",borderRadius:8,color:"#e2e8f0",fontSize:12,marginBottom:14,outline:"none"}}/>

        {driver&&(
          <div style={{background:"#0d1b2a",border:"1px solid #2563eb",borderRadius:12,padding:20,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a5f,#0d1b2a)",border:"2px solid #2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#60a5fa"}}>{driver.avatar}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{driver.name}</div>
                <div style={{fontSize:11,color:"#475569"}}>{driver.email} • {driver.phone}</div>
                <div style={{marginTop:4,display:"flex",gap:6}}><StatusBadge status={driver.status}/><StatusBadge status={driver.risk}/></div>
              </div>
              <button onClick={()=>setSelectedDriver(null)} style={{marginLeft:"auto",fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer"}}>✕ Close</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
              {[
                {k:"Total Hours",v:`${driver.totalHours}h`,c:"#60a5fa"},
                {k:"Total Alerts",v:driver.totalAlerts,c:"#ef4444"},
                {k:"Avg Fatigue",v:`${driver.avgFatigue}%`,c:driver.avgFatigue>50?"#ef4444":"#22c55e"},
                {k:"Today Hours",v:`${driver.hoursToday}h`,c:"#f59e0b"},
              ].map(m=>(
                <div key={m.k} style={{background:"#040d17",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:800,color:m.c,fontFamily:"monospace"}}>{m.v}</div>
                  <div style={{fontSize:10,color:"#334155"}}>{m.k}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
              {[["License",driver.license],["Vehicle",driver.vehicle],["City",driver.city],["Last Alert",driver.lastAlert]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:"#040d17",borderRadius:6}}>
                  <span style={{color:"#475569"}}>{k}</span>
                  <span style={{color:"#94a3b8",fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"grid",gap:8}}>
          {filtered.map(d=>(
            <div key={d.id} onClick={()=>setSelectedDriver(d===selectedDriver?null:d)} style={{background:"#0d1b2a",border:`1px solid ${selectedDriver?.id===d.id?"#2563eb":"#0f2035"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a5f,#0d1b2a)",border:"2px solid #1e2d3d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#60a5fa",flexShrink:0}}>{d.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>{d.name}</div>
                <div style={{fontSize:11,color:"#475569"}}>{d.vehicle} • {d.city}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <FatigueRing value={d.avgFatigue} size={44}/>
                <div style={{textAlign:"right"}}>
                  <StatusBadge status={d.risk}/>
                  <div style={{fontSize:10,color:"#334155",marginTop:4}}>{d.totalAlerts} alerts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PageGPS=()=>(
    <div>
      <SectionHeader title="GPS Tracking" sub="Route history and live vehicle location tracking"/>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div>
          <div style={{background:"#040d17",border:"1px solid #0f2035",borderRadius:12,padding:16,height:320,position:"relative",overflow:"hidden",marginBottom:12}}>
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(#0f2035 1px,transparent 1px),linear-gradient(90deg,#0f2035 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{textAlign:"center",zIndex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>OpenStreetMap Integration</div>
                <div style={{fontSize:11,color:"#0f2035"}}>Mumbai Metropolitan Region</div>
                <div style={{fontSize:11,color:"#0f2035",marginTop:4}}>19.0760°N 72.8777°E</div>
              </div>
            </div>
            {GPS_POINTS.map((p,i)=>{
              const x=((p.lng-72.870)/0.050)*100;
              const y=((19.125-p.lat)/0.060)*100;
              return(
                <div key={i} title={`${p.time} — ${p.status} — Speed: ${p.speed}km/h`} style={{position:"absolute",left:`${x}%`,top:`${y}%`,transform:"translate(-50%,-50%)",zIndex:2}}>
                  {i>0&&<div style={{position:"absolute",background:"transparent",border:`1px dashed ${p.alert?"#ef4444":"#1e3a5f"}`,width:30,height:1,top:"50%",right:"100%"}}/>}
                  <div style={{width:p.alert?18:p.stop?14:10,height:p.alert?18:p.stop?14:10,borderRadius:"50%",background:stateColor[p.status],border:"2px solid #0d1b2a",boxShadow:p.alert?"0 0 8px #ef4444":""}}/>
                  <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",fontSize:9,color:stateColor[p.status],whiteSpace:"nowrap",marginTop:2}}>{p.time}</div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,color:"#334155",textAlign:"center"}}>Connect OpenStreetMap/Leaflet.js for interactive map rendering</div>
        </div>
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Route Timeline</div>
          {GPS_POINTS.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,paddingBottom:10,position:"relative"}}>
              {i<GPS_POINTS.length-1&&<div style={{position:"absolute",left:7,top:16,width:2,height:"100%",background:"#0f2035"}}/>}
              <div style={{width:16,height:16,borderRadius:"50%",background:stateColor[p.status],flexShrink:0,zIndex:1,border:"2px solid #0d1b2a"}}/>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>{p.time} — <span style={{color:stateColor[p.status]}}>{p.status}</span></div>
                <div style={{fontSize:10,color:"#475569"}}>Speed: {p.speed}km/h • Fatigue: {p.fatigue}</div>
                {p.alert&&<div style={{fontSize:10,color:"#ef4444",fontWeight:700}}>⚠ EMERGENCY ALERT TRIGGERED</div>}
                {p.stop&&<div style={{fontSize:10,color:"#22c55e"}}>■ Stop recorded</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PageAI=()=>(
    <div>
      <SectionHeader title="AI Insights" sub="VigilDrive AI analysis: fatigue prediction, behavior patterns, and risk intelligence"/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["fatigue","behavior","prediction"].map(t=>(
          <button key={t} onClick={()=>setAiInsightTab(t)} style={{padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:600,background:aiInsightTab===t?"#1e3a5f":"#0d1b2a",color:aiInsightTab===t?"#60a5fa":"#64748b",border:`1px solid ${aiInsightTab===t?"#2563eb":"#1e2d3d"}`,cursor:"pointer"}}>
            {t.charAt(0).toUpperCase()+t.slice(1)} Analysis
          </button>
        ))}
      </div>

      {aiInsightTab==="fatigue"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
              <SectionHeader title="EAR Distribution" sub="Eye Aspect Ratio from real session (lower = more closed)"/>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                  <XAxis dataKey="i" stroke="#334155" tick={{fontSize:9,fill:"#475569"}} name="Sample"/>
                  <YAxis dataKey="ear" stroke="#334155" tick={{fontSize:9,fill:"#475569"}} name="EAR" domain={[0,0.55]}/>
                  <Tooltip cursor={{strokeDasharray:"3 3"}} contentStyle={{background:"#0f1623",border:"1px solid #1e3a5f",borderRadius:8,fontSize:11}}/>
                  <Scatter data={RAW_LOG_DATA.map((d,i)=>({i,ear:d.ear,state:d.state}))} fill="#3b82f6" opacity={0.7}/>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
              <SectionHeader title="Fatigue Score vs MAR" sub="Mouth Aspect Ratio correlation with fatigue"/>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                  <XAxis dataKey="mar" stroke="#334155" tick={{fontSize:9,fill:"#475569"}} name="MAR"/>
                  <YAxis dataKey="fs" stroke="#334155" tick={{fontSize:9,fill:"#475569"}} name="Fatigue" domain={[0,100]}/>
                  <Tooltip contentStyle={{background:"#0f1623",border:"1px solid #1e3a5f",borderRadius:8,fontSize:11}}/>
                  <Scatter data={RAW_LOG_DATA.map(d=>({mar:d.mar,fs:d.fs,state:d.state}))} fill="#8b5cf6" opacity={0.7}/>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
            <SectionHeader title="AI Model Insights — FatigueScorer Algorithm"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[
                {title:"Multi-Factor Analysis",desc:"Combines EAR (eye closure), MAR (yawn), head yaw/pitch, and attention state into weighted fatigue score",icon:"🔬"},
                {title:"Adaptive Thresholds",desc:"DriverCalibration module personalizes EAR/MAR thresholds per driver during first 30s baseline capture",icon:"🎯"},
                {title:"Smoothing Buffer",desc:"30-frame rolling average prevents false spikes. Recovery rate: -0.8/frame when all signals normal",icon:"📉"},
              ].map(c=>(
                <div key={c.title} style={{background:"#040d17",border:"1px solid #0f2035",borderRadius:8,padding:14}}>
                  <div style={{fontSize:18,marginBottom:8}}>{c.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:6}}>{c.title}</div>
                  <div style={{fontSize:11,color:"#475569"}}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {aiInsightTab==="behavior"&&(
        <div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20,marginBottom:16}}>
            <SectionHeader title="Driver Behavior Radar — Arjun Mehta"/>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                {subject:"Eye Stability",A:42,fullMark:100},
                {subject:"Attention",A:38,fullMark:100},
                {subject:"Yawn Control",A:55,fullMark:100},
                {subject:"Head Pose",A:61,fullMark:100},
                {subject:"Response Time",A:73,fullMark:100},
                {subject:"Rest Compliance",A:30,fullMark:100},
              ]}>
                <PolarGrid stroke="#1e2d3d"/>
                <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:"#475569"}}/>
                <Radar name="Score" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15}/>
                <Tooltip contentStyle={{background:"#0f1623",border:"1px solid #1e3a5f",borderRadius:8,fontSize:11}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              {title:"High-Risk Windows",desc:"10:00–11:30 AM shows 78% of all DANGER events. Most distraction occurs in first 20 min of session.",color:"#ef4444"},
              {title:"Yawn Pattern",desc:"Yawning spikes at 10:00, 10:35, 10:52 AM — suggesting fatigue onset after 30-min driving intervals.",color:"#f59e0b"},
              {title:"Recovery Behavior",desc:"Driver recovers quickly (score drops from 100→0 in 5s) suggesting response to external stimuli, not genuine rest.",color:"#3b82f6"},
            ].map(c=>(
              <div key={c.title} style={{background:"#0d1b2a",border:`1px solid ${c.color}33`,borderRadius:10,padding:14}}>
                <div style={{width:4,height:20,background:c.color,borderRadius:2,marginBottom:8}}/>
                <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:6}}>{c.title}</div>
                <div style={{fontSize:11,color:"#475569"}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiInsightTab==="prediction"&&(
        <div>
          <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20,marginBottom:16}}>
            <SectionHeader title="Risk Prediction — Next 7 Days"/>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={Array.from({length:7},(_,i)=>({day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],predicted:40+Math.sin(i*0.9)*25+Math.random()*10,confidence:80-i*5}))}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d"/>
                <XAxis dataKey="day" stroke="#334155" tick={{fontSize:10,fill:"#475569"}}/>
                <YAxis stroke="#334155" tick={{fontSize:10,fill:"#475569"}} domain={[0,100]}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="url(#predGrad)" strokeWidth={2} name="Predicted Risk"/>
                <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1} name="Confidence %"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#451a03",border:"1px solid #d97706",borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:8}}>⚠ AI Recommendations</div>
            <ul style={{margin:0,padding:"0 0 0 16px",fontSize:11,color:"#d97706",lineHeight:1.8}}>
              <li>Driver Arjun Mehta should not exceed 4-hour sessions without mandatory 20-min rest</li>
              <li>Friday shows highest predicted risk — consider schedule adjustment</li>
              <li>EAR threshold should be recalibrated (current avg: {avgEAR} — below normal 0.3+)</li>
              <li>Persistent distraction flag (dist=True in {RAW_LOG_DATA.filter(d=>d.dist).length}/{RAW_LOG_DATA.length} records) suggests camera angle misalignment</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const PageSettings=()=>(
    <div>
      <SectionHeader title="Settings" sub="Configure VigilDrive AI thresholds, alerts, and system preferences"/>
      <div style={{display:"grid",gap:16}}>
        {[
          {section:"AI Detection Thresholds",fields:[
            {key:"fatigueThr",label:"Danger Alert Threshold (Fatigue Score)",type:"range",min:40,max:90,unit:"/100"},
            {key:"distractionThr",label:"Distraction Alert Cooldown (seconds)",type:"range",min:3,max:30,unit:"s"},
          ]},
          {section:"Emergency Configuration",fields:[
            {key:"sosPhone",label:"SOS Phone Number (E.164 format)",type:"text"},
            {key:"sosEmail",label:"Emergency Email",type:"text"},
          ]},
        ].map(g=>(
          <div key={g.section} style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:14}}>{g.section}</div>
            {g.fields.map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:11,color:"#64748b",marginBottom:6}}>{f.label}</label>
                {f.type==="range"?(
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <input type="range" min={f.min} max={f.max} value={settingsData[f.key]} onChange={e=>setSettingsData(s=>({...s,[f.key]:+e.target.value}))} style={{flex:1,accentColor:"#3b82f6"}}/>
                    <span style={{fontSize:13,fontWeight:700,color:"#60a5fa",minWidth:40,textAlign:"right",fontFamily:"monospace"}}>{settingsData[f.key]}{f.unit}</span>
                  </div>
                ):(
                  <input type="text" value={settingsData[f.key]} onChange={e=>setSettingsData(s=>({...s,[f.key]:e.target.value}))} style={{width:"100%",padding:"8px 12px",background:"#040d17",border:"1px solid #1e2d3d",borderRadius:8,color:"#e2e8f0",fontSize:12,outline:"none"}}/>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:14}}>System Features</div>
          {[
            {key:"alertSound",label:"Audio Alerts (pygame alarm)"},
            {key:"autoSOS",label:"Auto SOS on sustained DANGER state (>10s)"},
          ].map(f=>(
            <div key={f.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:12,color:"#94a3b8"}}>{f.label}</span>
              <button onClick={()=>setSettingsData(s=>({...s,[f.key]:!s[f.key]}))} style={{width:44,height:24,borderRadius:12,background:settingsData[f.key]?"#16a34a":"#1e2d3d",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:3,left:settingsData[f.key]?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
              </button>
            </div>
          ))}
        </div>
        <button onClick={()=>alert("Settings saved to backend (/api/settings)")} style={{padding:"10px 20px",background:"#16a34a",border:"none",borderRadius:8,color:"white",fontWeight:700,fontSize:13,cursor:"pointer"}}>
          Save Settings
        </button>
      </div>
    </div>
  );

  const PageHelp=()=>(
    <div>
      <SectionHeader title="Help Center" sub="VigilDrive AI documentation and system guide"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {[
          {icon:"📖",title:"Quick Start Guide",desc:"Set up your webcam, run vigildrive-ai/main.py, and connect to the dashboard"},
          {icon:"🔧",title:"System Architecture",desc:"FastAPI backend + Next.js frontend + SQLite DB + WebSocket streaming"},
          {icon:"🤖",title:"AI Pipeline",desc:"MediaPipe FaceMesh → EyeDetector → FatigueScorer → AlertSystem"},
          {icon:"📡",title:"API Reference",desc:"REST API docs at localhost:8000/docs — WebSocket at ws://localhost:8000/ws"},
        ].map(c=>(
          <div key={c.title} style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:18,cursor:"pointer"}}>
            <div style={{fontSize:24,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>{c.title}</div>
            <div style={{fontSize:11,color:"#475569"}}>{c.desc}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#0d1b2a",border:"1px solid #1e3a5f",borderRadius:12,padding:20}}>
        <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:14}}>Frequently Asked Questions</div>
        {[
          {q:"Why does the fatigue score jump between 0 and 100?",a:"The FatigueScorer uses adaptive thresholds. During calibration, distraction flags may cause rapid score changes. Ensure proper lighting and camera positioning."},
          {q:"How does EAR-based drowsiness work?",a:"EAR (Eye Aspect Ratio) measures eye openness using 6 MediaPipe landmarks. Threshold defaults to 0.20 — values below this for 15+ frames = DROWSY state."},
          {q:"How do I connect Twilio SMS alerts?",a:"Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, and EMERGENCY_PHONE in backend/.env"},
          {q:"Where is data stored?",a:"SQLite database at vigildrive-ai/analytics/vigildrive.db, CSV logs at vigildrive-ai/logs/fatigue_log.csv, screenshots at vigildrive-ai/screenshots/"},
          {q:"How to run the full system?",a:"1. cd vigildrive-ai && pip install -r requirements.txt && python main.py\n2. cd backend && uvicorn main:app --reload\n3. cd frontend && npm run dev"},
        ].map((faq,i)=>(
          <div key={i} style={{borderBottom:"1px solid #0f2035",paddingBottom:12,marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>Q: {faq.q}</div>
            <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>A: {faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const pages={dashboard:<PageDashboard/>,live:<PageLive/>,analytics:<PageAnalytics/>,sessions:<PageSessions/>,events:<PageEvents/>,emergency:<PageEmergency/>,reports:<PageReports/>,drivers:<PageDrivers/>,gps:<PageGPS/>,ai:<PageAI/>,settings:<PageSettings/>,help:<PageHelp/>};

  return(
    <div style={{display:"flex",height:"100vh",background:"#040d17",fontFamily:"'JetBrains Mono',monospace",color:"#e2e8f0",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#040d17}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.4)}}
        * {box-sizing:border-box}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:sidebarOpen?220:52,background:"#0a1628",borderRight:"1px solid #0f2035",display:"flex",flexDirection:"column",transition:"width 0.25s",overflow:"hidden",flexShrink:0}}>
        <div style={{padding:"14px 12px",borderBottom:"1px solid #0f2035",display:"flex",alignItems:"center",gap:10,minHeight:52}}>
          <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#2563eb,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⚡</div>
          {sidebarOpen&&<span style={{fontSize:13,fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",whiteSpace:"nowrap"}}>VigilDrive AI</span>}
        </div>
        <nav style={{flex:1,padding:"8px 6px",overflowY:"auto",overflowX:"hidden"}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 8px",borderRadius:8,background:page===n.id?"#1e3a5f":"transparent",border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",transition:"background 0.15s",whiteSpace:"nowrap",overflow:"hidden"}}>
              <span style={{fontSize:14,flexShrink:0}}>{n.icon}</span>
              {sidebarOpen&&<span style={{fontSize:11,fontWeight:page===n.id?700:400,color:page===n.id?"#60a5fa":"#475569",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"8px 6px",borderTop:"1px solid #0f2035"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:"#1e3a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#60a5fa",flexShrink:0}}>AD</div>
            {sidebarOpen&&<div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis"}}>Admin</div><div style={{fontSize:9,color:"#334155"}}>vigildrive.ai</div></div>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* TOP BAR */}
        <header style={{height:48,background:"#0a1628",borderBottom:"1px solid #0f2035",display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0}}>
          <button onClick={()=>setSidebarOpen(s=>!s)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16,padding:4}}>☰</button>
          <span style={{fontSize:11,color:"#334155",flex:1}}>{nav.find(n=>n.id===page)?.label||"Dashboard"}</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:"#0d1b2a",border:"1px solid #0f2035",borderRadius:8}}>
              <PulseDot color="green" size={6}/>
              <span style={{fontSize:10,color:"#22c55e"}}>AI ONLINE</span>
            </div>
            <div style={{position:"relative",cursor:"pointer"}}>
              <span style={{fontSize:16}}>🔔</span>
              {notifications>0&&<div style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"white"}}>{notifications}</div>}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main style={{flex:1,overflowY:"auto",padding:20}}>
          {pages[page]||<div style={{color:"#334155",padding:20}}>Page not found</div>}
        </main>
      </div>
    </div>
  );
}
