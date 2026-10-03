export default function Card({title,subtitle,action,children,className=""}) {
 return <section className={`card ${className}`}>
   {(title||action) && <div className="cardHead"><div><h3>{title}</h3>{subtitle&&<small>{subtitle}</small>}</div>{action}</div>}
   {children}
 </section>
}
