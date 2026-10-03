import Icon from "./Icon.jsx";
export default function Topbar({page,onAircraft,theme,onTheme}) {
  return <header className="topbar">
    <div className="crumb"><span>FLIGHTDECK</span><Icon name="ChevronRight" size={14}/><b>{page.replaceAll("-"," ")}</b></div>
    <div className="topActions">
      <button className="iconBtn" title="Aircraft selection" onClick={onAircraft}><Icon name="Plane"/></button>
      <button className="iconBtn" onClick={onTheme}><Icon name={theme==="dark"?"Sun":"Moon"}/></button>
      <div className="pilot"><div className="avatar">P</div><span>Pilot</span><Icon name="ChevronDown" size={14}/></div>
    </div>
  </header>
}
