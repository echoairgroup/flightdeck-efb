import {useEffect,useMemo,useState} from "react";
import Icon from "./components/Icon.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Card from "./components/Card.jsx";
import {AIRCRAFT,aircraftByCode} from "./data/aircraft.js";
import {api} from "./lib/api.js";
import {crosswind,tod,nmToKm,kgToLb} from "./lib/flightMath.js";
import {loadState,saveState} from "./lib/storage.js";

const pages = {
  home:"Overview",dispatch:"Flight Center",ofp:"OFP / Dispatch",airport:"Airports",
  weather:"Weather",traffic:"Live Traffic",route:"Route Tools",fuel:"Fuel & Performance",
  checklists:"Checklists",calculator:"Calculator",scratch:"Scratchpad",timer:"Flight Timer",
  logbook:"Flight Log",integrations:"Integrations",settings:"Settings"
};

export default function App(){
  const initial=loadState();
  const [page,setPage]=useState("home");
  const [aircraft,setAircraft]=useState(aircraftByCode(initial.aircraft||"A21N"));
  const [aircraftOpen,setAircraftOpen]=useState(false);
  const [theme,setTheme]=useState(initial.theme||"dark");
  const [toast,setToast]=useState("");
  const [ofp,setOfp]=useState(null);
  const [weather,setWeather]=useState({icao:"LIRF",metar:null,taf:null});
  const [traffic,setTraffic]=useState(null);
  const [loading,setLoading]=useState(false);
  const [simId,setSimId]=useState("");
  const [scratch,setScratch]=useState(initial.scratch||"");
  const [timer,setTimer]=useState(0);
  const [timerRunning,setTimerRunning]=useState(false);
  const [wind,setWind]=useState({dir:270,speed:18,runway:250});
  const [descent,setDescent]=useState({alt:10000,rate:1000,gs:250});
  const [airport,setAirport]=useState("LIRF");

  useEffect(()=>{saveState({aircraft:aircraft.icao,theme,scratch})},[aircraft,theme,scratch]);
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
  useEffect(()=>{if(!timerRunning)return; const t=setInterval(()=>setTimer(x=>x+1),1000); return()=>clearInterval(t)},[timerRunning]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),2800);return()=>clearTimeout(t)}},[toast]);

  const selectAircraft=(a)=>{setAircraft(a);setAircraftOpen(false);setToast(`${a.name} selected`)};
  const loadOFP=async()=>{setLoading(true);try{const r=await api.simbrief(simId);setOfp(r.ofp);setToast("SimBrief OFP loaded")}catch(e){setToast(e.message)}finally{setLoading(false)}};
  const loadWeather=async()=>{setLoading(true);try{const [m,t]=await Promise.all([api.metar(weather.icao),api.taf(weather.icao)]);setWeather(x=>({...x,metar:m.data.raw,taf:t.data}));setToast(`Weather loaded for ${weather.icao}`)}catch(e){setToast(e.message)}finally{setLoading(false)}};
  const loadTraffic=async()=>{setLoading(true);try{setTraffic(await api.vatsim());setToast("VATSIM data refreshed")}catch(e){setToast(e.message)}finally{setLoading(false)}};

  const active=useMemo(()=>ofp || {
    flightNumber:"—",origin:"LIRF",destination:"EDDF",route:"DCT",aircraft:aircraft.icao,distanceNm:0,
    cruiseAltitude:"—",enrouteMinutes:0
  },[ofp,aircraft]);

  const common={aircraft,ofp,weather,traffic,loading,setPage,setToast,api,simId,setSimId,loadOFP,loadWeather,loadTraffic};

  return <div className="app">
    <Sidebar page={page} setPage={setPage} aircraft={aircraft} onAircraft={()=>setAircraftOpen(true)}/>
    <main className="main"><Topbar page={pages[page]} onAircraft={()=>setAircraftOpen(true)} theme={theme} onTheme={()=>setTheme(theme==="dark"?"light":"dark")}/>
      <div className="content">
        {page==="home"&&<Overview {...common} active={active}/>}
        {page==="dispatch"&&<Dispatch {...common} active={active}/>}
        {page==="ofp"&&<OFP {...common}/>}
        {page==="airport"&&<Airport {...common} airport={airport} setAirport={setAirport}/>}
        {page==="weather"&&<Weather {...common}/>}
        {page==="traffic"&&<Traffic {...common}/>}
        {page==="route"&&<RouteTools {...common}/>}
        {page==="fuel"&&<Fuel {...common}/>}
        {page==="checklists"&&<Checklists {...common}/>}
        {page==="calculator"&&<Calculator {...common}/>}
        {page==="scratch"&&<Scratchpad value={scratch} setValue={setScratch}/>}
        {page==="timer"&&<Timer timer={timer} running={timerRunning} setRunning={setTimerRunning} setTimer={setTimer}/>}
        {page==="logbook"&&<Logbook {...common}/>}
        {page==="integrations"&&<Integrations {...common}/>}
        {page==="settings"&&<Settings theme={theme} setTheme={setTheme}/>}
      </div>
    </main>
    {aircraftOpen&&<AircraftPicker value={aircraft} onSelect={selectAircraft} onClose={()=>setAircraftOpen(false)}/>}
    {toast&&<div className="toast"><Icon name="CircleCheck"/>{toast}</div>}
  </div>
}

function PageTitle({eyebrow,title,description,action}){return <div className="pageTitle"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>}

function Overview({aircraft,active,loadOFP,loadTraffic,loadWeather,loading,setPage}){
 return <><PageTitle eyebrow="FLIGHT OPERATIONS" title="Good evening, Pilot." description="Your flight deck is ready. Select an aircraft, load a dispatch and run the tools you need." action={<button className="primary" onClick={()=>setPage("dispatch")}><Icon name="PlaneTakeoff"/> Start flight</button>}/>
 <div className="heroGrid">
   <Card className="aircraftHero"><div className="aircraftGlow"><Icon name="Plane" size={58}/></div><div className="heroAircraft"><span>ACTIVE AIRCRAFT</span><strong>{aircraft.icao}</strong><b>{aircraft.name}</b><small>{aircraft.manufacturer} · {aircraft.category}</small></div><button className="ghost" onClick={()=>setPage("settings")}>Aircraft profile <Icon name="ArrowUpRight" size={14}/></button></Card>
   <Card title="Current Flight" subtitle="Imported dispatch data"><div className="routeHero"><strong>{active.origin}</strong><div><span>→</span><small>{active.distanceNm||"—"} NM</small></div><strong>{active.destination}</strong></div><div className="metricRow"><Metric label="Flight" value={active.flightNumber||"—"}/><Metric label="Cruise" value={active.cruiseAltitude||"—"}/><Metric label="ETE" value={active.enrouteMinutes?`${Math.round(active.enrouteMinutes/60)}h`: "—"}/></div></Card>
 </div>
 <div className="sectionGrid">
   <Card title="Operational shortcuts" subtitle="Everything you need before pushback"><div className="shortcutGrid">
    {[["ofp","OFP / Dispatch","FileText"],["airport","Airport brief","Building2"],["weather","Weather","CloudSun"],["route","Route tools","Route"],["fuel","Fuel & performance","Fuel"],["checklists","Checklists","ListChecks"]].map(([p,n,i])=><button className="shortcut" onClick={()=>setPage(p)} key={p}><Icon name={i}/><span>{n}</span><Icon name="ArrowUpRight" size={14}/></button>)}
   </div></Card>
   <Card title="System status" subtitle="Cloud services"><Status label="FlightDeck API" ok/><Status label="VATSIM live feed" ok={true}/><Status label="SimBrief adapter" ok={true}/><Status label="Simulator bridge" ok={false} text="Optional"/></Card>
 </div>
 </>;
}
function Metric({label,value}){return <div className="metric"><small>{label}</small><b>{value}</b></div>}
function Status({label,ok,text}){return <div className="status"><i className={ok?"ok":""}/><span>{label}</span><small>{text|| (ok?"ONLINE":"OFFLINE")}</small></div>}

function Dispatch({loadOFP,simId,setSimId,loading,ofp,aircraft,setPage}){
 return <><PageTitle eyebrow="DISPATCH" title="Flight Center" description="Build your cockpit state around a real dispatch. SimBrief remains the source of truth for the OFP."/>
 <div className="twoCol"><Card title="SimBrief import" subtitle="Load your latest OFP"><label>SimBrief user ID / username<input value={simId} onChange={e=>setSimId(e.target.value)} placeholder="Enter your SimBrief ID"/></label><button className="primary wide" onClick={loadOFP} disabled={loading}>{loading?<Spinner/>:<Icon name="Download"/>} Load latest OFP</button><p className="muted">You can also configure a server-wide ID with <code>SIMBRIEF_USER_ID</code>.</p></Card>
 <Card title="Dispatch workflow"><Step n="01" t="Dispatch" d="Load the latest OFP."/><Step n="02" t="Brief" d="Review route, weather, fuel and alternates."/><Step n="03" t="Configure" d={`Set ${aircraft.icao} weights, performance and checklists.`}/><Step n="04" t="Fly" d="Start timer and keep the EFB beside the simulator."/><button className="ghost wide" onClick={()=>setPage("ofp")}>Open OFP workspace <Icon name="ArrowRight"/></button></Card></div>
 {ofp&&<Card title="Loaded dispatch" className="mt"><div className="flightStrip"><strong>{ofp.origin}</strong><Icon name="ArrowRight"/><strong>{ofp.destination}</strong><span>{ofp.flightNumber||"NO FLTNO"}</span><span>{ofp.aircraft||aircraft.icao}</span></div></Card>}</>;
}
function Step({n,t,d}){return <div className="step"><b>{n}</b><div><strong>{t}</strong><p>{d}</p></div></div>}
function Spinner(){return <span className="spinner"/>}

function OFP({ofp,loadOFP,loading}){return <><PageTitle eyebrow="DISPATCH DOCUMENT" title="Operational Flight Plan" description="A cockpit-friendly presentation of your latest SimBrief dispatch." action={<button className="primary" onClick={loadOFP} disabled={loading}><Icon name="RefreshCw"/> Refresh OFP</button>}/>{!ofp?<Empty title="No OFP loaded" text="Load a SimBrief flight from Flight Center to populate this page."/>:<div className="ofpGrid"><Card title="Route"><div className="bigRoute"><b>{ofp.origin}</b><Icon name="ArrowRight"/><b>{ofp.destination}</b></div><code className="routeBox">{ofp.route||"No route returned"}</code></Card><Card title="Flight data"><DataRows rows={[["Flight",ofp.flightNumber],["Aircraft",ofp.aircraft],["Distance",`${ofp.distanceNm||0} NM`],["Cruise",ofp.cruiseAltitude],["ETE",`${Math.round((ofp.enrouteMinutes||0)/60)}h ${(ofp.enrouteMinutes||0)%60}m`]]}/></Card><Card title="Fuel"><DataRows rows={[["Ramp",ofp.fuelPlan],["Taxi",ofp.fuelTaxi],["Trip",ofp.fuelTrip],["Reserve",ofp.fuelReserve]]}/></Card><Card title="Weights"><DataRows rows={[["Takeoff",ofp.takeoffWeight],["Landing",ofp.landingWeight]]}/></Card></div>}</>}
function DataRows({rows}){return <div className="dataRows">{rows.map(([a,b])=><div key={a}><span>{a}</span><b>{b||"—"}</b></div>)}</div>}
function Empty({title,text}){return <div className="empty"><Icon name="Inbox" size={34}/><h3>{title}</h3><p>{text}</p></div>}

function Airport({airport,setAirport,loadWeather,weather}){return <><PageTitle eyebrow="AIRPORTS" title="Airport Briefing" description="Quick-reference airport workspace for planning and cockpit use."/><div className="airportSearch"><input value={airport} onChange={e=>setAirport(e.target.value.toUpperCase())} placeholder="ICAO, e.g. LIRF"/><button className="primary" onClick={loadWeather}><Icon name="Search"/> Brief airport</button></div><div className="sectionGrid"><Card title={airport||"Airport"} subtitle="Briefing modules"><div className="moduleList"><MiniModule icon="CloudSun" t="Weather" d={weather.metar||"Load METAR / TAF from Weather."}/><MiniModule icon="Radio" t="ATC / Frequencies" d="VATSIM controller data can be displayed when online."/><MiniModule icon="Map" t="Charts" d="Reserved for a licensed chart provider such as Navigraph."/><MiniModule icon="TriangleAlert" t="NOTAMs" d="Provider adapter slot — configure a supported source." /></div></Card><Card title="Pilot notes"><textarea className="largeText" placeholder="Runway notes, taxi route, gate, fuel truck, scenery notes…"/></Card></div></>}
function MiniModule({icon,t,d}){return <div className="miniModule"><Icon name={icon}/><div><b>{t}</b><p>{d}</p></div></div>}

function Weather({weather,loadWeather,setToast}){return <><PageTitle eyebrow="METEOROLOGY" title="Weather Center" description="Live aviation weather through public VATSIM weather services."/><div className="weatherSearch"><input value={weather.icao} onChange={e=>weather.icao=e.target.value.toUpperCase()} onKeyDown={e=>e.key==="Enter"&&loadWeather()} /><button className="primary" onClick={loadWeather}><Icon name="RefreshCw"/> Refresh</button></div><div className="twoCol"><Card title={`METAR · ${weather.icao}`}><pre className="weatherRaw">{weather.metar||"No METAR loaded."}</pre></Card><Card title={`TAF · ${weather.icao}`}><pre className="weatherRaw">{weather.taf?JSON.stringify(weather.taf,null,2):"No TAF loaded."}</pre></Card></div></>}
function Traffic({traffic,loadTraffic,loading}){return <><PageTitle eyebrow="ONLINE NETWORK" title="Live Traffic" description="Live VATSIM pilots, controllers and ATIS." action={<button className="primary" onClick={loadTraffic} disabled={loading}><Icon name="RefreshCw"/> Refresh network</button>}/>{!traffic?<Empty title="Network feed not loaded" text="Refresh to fetch the live VATSIM network."/>:<><div className="statGrid"><Metric label="Connected" value={traffic.connected}/><Metric label="Pilots" value={traffic.pilots.length}/><Metric label="Controllers" value={traffic.controllers.length}/><Metric label="ATIS" value={traffic.atis.length}/></div><div className="twoCol"><TrafficList title="Pilots" items={traffic.pilots.slice(0,18).map(x=>({a:x.callsign,b:`${x.flight_plan?.departure||"?"} → ${x.flight_plan?.arrival||"?"}`,c:`${x.altitude} ft · ${x.groundspeed} kt`}))}/><TrafficList title="Controllers" items={traffic.controllers.slice(0,18).map(x=>({a:x.callsign,b:x.frequency,c:x.name}))}/></div></>}</>}
function TrafficList({title,items}){return <Card title={title}><div className="trafficList">{items.map((x,i)=><div className="traffic" key={i}><b>{x.a}</b><span>{x.b}</span><small>{x.c}</small></div>)}</div></Card>}

function RouteTools(){const [dist,setDist]=useState(500);const [speed,setSpeed]=useState(140);const [alt,setAlt]=useState(24000);const [rate,setRate]=useState(1000);const [gs,setGs]=useState(250);const d=tod(0,Number(alt),Number(rate),Number(gs));return <><PageTitle eyebrow="NAVIGATION" title="Route Tools" description="Fast cockpit calculations without leaving your EFB."/><div className="toolGrid"><Card title="ETE calculator"><Field label="Distance (NM)" v={dist} set={setDist}/><Field label="Groundspeed (kt)" v={speed} set={setSpeed}/><Result value={`${Math.floor(dist/speed)}h ${Math.round((dist/speed%1)*60)}m`} label="Estimated time enroute"/></Card><Card title="Top of descent"><Field label="Altitude to lose (ft)" v={alt} set={setAlt}/><Field label="Descent rate (ft/min)" v={rate} set={setRate}/><Field label="Groundspeed (kt)" v={gs} set={setGs}/><Result value={`${d.distanceNm.toFixed(1)} NM`} label={`~${Math.round(d.minutes)} minutes`}/></Card><Card title="Unit quick convert"><Result value={`${nmToKm(Number(dist)).toFixed(1)} km`} label={`${dist} NM`}/><Result value={`${kgToLb(1000).toFixed(0)} lb`} label="1000 kg"/></Card></div></>}
function Field({label,v,set}){return <label>{label}<input type="number" value={v} onChange={e=>set(e.target.value)}/></label>}
function Result({value,label}){return <div className="result"><b>{value}</b><span>{label}</span></div>}

function Fuel(){const [fuel,setFuel]=useState(10000);const [burn,setBurn]=useState(2500);const [reserve,setReserve]=useState(1500);const usable=Math.max(0,fuel-reserve);return <><PageTitle eyebrow="PERFORMANCE" title="Fuel & Performance" description="Generic planning tools. Aircraft-specific performance should come from your aircraft documentation or dispatch."/><div className="toolGrid"><Card title="Fuel overview"><Field label="Fuel onboard (kg)" v={fuel} set={setFuel}/><Field label="Trip burn (kg)" v={burn} set={setBurn}/><Field label="Reserve (kg)" v={reserve} set={setReserve}/><Result value={`${usable.toFixed(0)} kg`} label="Available after reserve"/></Card><Card title="Endurance"><Result value={`${(usable/burn).toFixed(2)} × trip`} label="Trip-burn ratio"/><p className="warning"><Icon name="TriangleAlert"/> This is a planning aid, not certified aircraft performance.</p></Card><Card title="Weight planning"><Field label="Payload (kg)" v={3200} set={()=>{}}/><Field label="Zero fuel weight (kg)" v={60000} set={()=>{}}/><Result value="Custom profile" label="Use aircraft-specific limits"/></Card></div></>}
function Checklists(){const [checks,setChecks]=useState(["Cockpit preparation","IRS / ADIRS","Fuel quantity","Hydraulics","Flight controls","Doors / hatches","FMS programmed","Takeoff briefing"]);return <><PageTitle eyebrow="PROCEDURES" title="Checklists" description="Simple interactive checklist workspace. Create aircraft-specific checklists in a future profile editor."/><Card title="Preflight"><div className="checkList">{checks.map((x,i)=><label className="check" key={x}><input type="checkbox"/><span>{String(i+1).padStart(2,"0")}</span>{x}</label>)}</div></Card></>}
function Calculator(){const [dir,setDir]=useState(270),[speed,setSpeed]=useState(18),[rwy,setRwy]=useState(250);const x=crosswind(Number(dir),Number(speed),Number(rwy));return <><PageTitle eyebrow="COCKPIT TOOLS" title="Calculator" description="Wind and crosswind calculator plus common aviation conversions."/><div className="twoCol"><Card title="Crosswind"><Field label="Wind direction" v={dir} set={setDir}/><Field label="Wind speed (kt)" v={speed} set={setSpeed}/><Field label="Runway heading" v={rwy} set={setRwy}/><div className="resultPair"><Result value={`${x.crosswind.toFixed(1)} kt`} label="Crosswind"/><Result value={`${Math.abs(x.headwind).toFixed(1)} kt`} label={x.headwind>=0?"Headwind":"Tailwind"}/></div></Card><Card title="Conversions"><Result value="1 NM = 1.852 km" label="Distance"/><Result value="1 kt = 1.852 km/h" label="Speed"/><Result value="1 kg = 2.205 lb" label="Mass"/></Card></div></>}
function Scratchpad({value,setValue}){return <><PageTitle eyebrow="COCKPIT NOTEBOOK" title="Scratchpad" description="Your quick notes stay on this device for fast cockpit use."/><Card title="Flight notes"><textarea autoFocus className="scratchpad" value={value} onChange={e=>setValue(e.target.value)} placeholder="ATIS… clearance… taxi… squawk… gate…"/></Card></>}
function Timer({timer,running,setRunning,setTimer}){const h=Math.floor(timer/3600),m=Math.floor(timer%3600/60),s=timer%60;return <><PageTitle eyebrow="TIME MANAGEMENT" title="Flight Timer" description="Simple block / flight timer for your EFB session."/><div className="timerCard"><span>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span><div><button className="primary" onClick={()=>setRunning(!running)}><Icon name={running?"Pause":"Play"}/>{running?"Pause":"Start"}</button><button className="ghost" onClick={()=>{setRunning(false);setTimer(0)}}>Reset</button></div></div></>}
function Logbook({setToast}){const [f,setF]=useState({callsign:"",origin:"",destination:"",aircraft:"",blockTimeMin:0,distanceNm:0,rating:"",notes:""});const change=(k,v)=>setF(x=>({...x,[k]:v}));const save=async()=>{try{await api.saveFlight(f);setToast("Flight saved")}catch(e){setToast(e.message)}};return <><PageTitle eyebrow="LOGBOOK" title="Flight Log" description="Record completed simulator flights and build a personal history."/><Card title="Log flight"><div className="formGrid">{Object.entries(f).map(([k,v])=><label key={k}>{k.replaceAll(/([A-Z])/g," $1")}<input value={v} onChange={e=>change(k,e.target.value)}/></label>)}</div><button className="primary" onClick={save}><Icon name="Save"/> Save flight</button></Card></>}
function Integrations(){const [cfg,setCfg]=useState(null);useEffect(()=>{api.config().then(setCfg).catch(()=>{})},[]);const rows=[["SimBrief","OFP / dispatch import",cfg?.integrations.simbrief],["VATSIM","Live traffic + weather",true],["VATSIM OAuth","Account authentication",cfg?.integrations.vatsimOAuth],["Navigraph","Charts / navigation data",false],["NewSky","Virtual airline flight data",false],["MSFS bridge","Live simulator telemetry",false],["X-Plane bridge","Live simulator telemetry",false],["Discord","Community / notifications",false]];return <><PageTitle eyebrow="ECOSYSTEM" title="Integrations" description="Connect external services without exposing secrets to the browser."/><div className="integrationGrid">{rows.map(([n,d,on])=><Card key={n}><div className="integration"><div className="integrationIcon"><Icon name="Plug"/></div><div><b>{n}</b><p>{d}</p></div><span className={on?"pill on":"pill"}>{on?"READY":"NOT CONFIGURED"}</span></div></Card>)}</div><Card title="Simulator telemetry" className="mt"><p className="muted">A hosted website cannot directly read MSFS/X-Plane memory or local simulator APIs. For live aircraft state, the correct architecture is an optional local bridge that sends selected telemetry securely to this hosted EFB.</p></Card></>}
function Settings({theme,setTheme}){return <><PageTitle eyebrow="SYSTEM" title="Settings" description="Configure how FlightDeck behaves on your device."/><div className="twoCol"><Card title="Appearance"><button className="shortcut" onClick={()=>setTheme(theme==="dark"?"light":"dark")}><Icon name={theme==="dark"?"Sun":"Moon"}/><span>Switch to {theme==="dark"?"light":"dark"} theme</span></button></Card><Card title="Architecture"><Status label="Hosted EFB" ok text="Cloud"/><Status label="Local storage" ok text="Enabled"/><Status label="Database" ok={false} text="Optional"/></Card></div></>}
function AircraftPicker({value,onSelect,onClose}){const [q,setQ]=useState("");const [cat,setCat]=useState("All");const filtered=AIRCRAFT.filter(a=>(cat==="All"||a.category===cat)&&`${a.icao} ${a.name} ${a.manufacturer}`.toLowerCase().includes(q.toLowerCase()));return <div className="modalBack"><div className="aircraftModal"><div className="modalHead"><div><span className="eyebrow">AIRCRAFT DATABASE</span><h2>Choose your flight deck</h2></div><button className="iconBtn" onClick={onClose}><Icon name="X"/></button></div><input autoFocus placeholder="Search ICAO, aircraft or manufacturer…" value={q} onChange={e=>setQ(e.target.value)}/><div className="chips">{["All","Airliner","Regional","Turboprop","GA","Business","Cargo","Classic","Military","Trainer","Jet","Utility"].map(x=><button className={cat===x?"chip active":"chip"} onClick={()=>setCat(x)} key={x}>{x}</button>)}</div><div className="aircraftList">{filtered.map(a=><button className={a.icao===value.icao?"aircraftRow selected":"aircraftRow"} onClick={()=>onSelect(a)} key={a.icao}><div className="aircraftIcon"><Icon name="Plane"/></div><div><b>{a.icao}</b><span>{a.name}</span></div><small>{a.manufacturer}</small><Icon name="ChevronRight" size={15}/></button>)}</div></div></div>}
