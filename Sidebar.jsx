import Icon from "./Icon.jsx";

const items = [
  ["home","Overview","LayoutDashboard"],["dispatch","Flight Center","PlaneTakeoff"],
  ["ofp","OFP / Dispatch","FileText"],["airport","Airports","Building2"],
  ["weather","Weather","CloudSun"],["traffic","Live Traffic","Radar"],
  ["route","Route Tools","Route"],["fuel","Fuel & Performance","Fuel"],
  ["checklists","Checklists","ListChecks"],["calculator","Calculator","Calculator"],
  ["scratch","Scratchpad","StickyNote"],["timer","Flight Timer","Timer"],
  ["logbook","Flight Log","BookOpen"],["integrations","Integrations","PlugZap"],
  ["settings","Settings","Settings"]
];

export default function Sidebar({page,setPage,aircraft,onAircraft}) {
  return <aside className="sidebar">
    <div className="brand">
      <div className="brandMark">FD</div>
      <div><strong>FLIGHTDECK</strong><span>EFB SYSTEM</span></div>
    </div>
    <div className="aircraftMini" onClick={onAircraft}>
      <span className="miniLabel">ACTIVE AIRCRAFT</span>
      <b>{aircraft.icao}</b><span>{aircraft.name}</span>
      <Icon name="ChevronRight" size={16}/>
    </div>
    <nav>{items.map(([id,label,icon]) =>
      <button key={id} className={page===id?"navItem active":"navItem"} onClick={()=>setPage(id)}>
        <Icon name={icon}/><span>{label}</span>
      </button>
    )}</nav>
    <div className="sidebarBottom">
      <div className="statusDot"><i/> SYSTEM ONLINE</div>
      <small>FlightDeck EFB v2.0</small>
    </div>
  </aside>
}
