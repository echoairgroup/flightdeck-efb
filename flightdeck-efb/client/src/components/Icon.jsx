import * as Icons from "lucide-react";
export default function Icon({ name, size=18, ...props }) {
  const C = Icons[name] || Icons.Circle;
  return <C size={size} strokeWidth={1.8} {...props}/>;
}
