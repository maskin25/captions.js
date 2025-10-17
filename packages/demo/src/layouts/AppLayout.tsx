import { Navbar } from "@/components/NavBar";
import { Outlet } from "react-router";

export default function AppLayout() {
  return (
    <div className="layout-container">
      <Navbar />
      <Outlet />
    </div>
  );
}
