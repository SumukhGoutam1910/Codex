

import { HeroParallax } from '@/components/ui/hero-parallax';
import { Navbar } from '@/components/navbar';


const heroProducts = [
  {
    title: "AI Fire Detection",
    link: "/features/ai-fire-detection",
    thumbnail: "https://imgs.search.brave.com/81uUGtrVDGJfKAp-4MvWz_u1xJJPVvVIKBKH7Mfh7bE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTY2/NDYzNjk4L3Bob3Rv/L2V4dGluZ3Vpc2hp/bmctd2l0aC1wb3dk/ZXItdHlwZS1maXJl/LWV4dGluZ3Vpc2hl/ci5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9RF92dXdKeTND/aWJpUk9DYmFQcWty/VWdqQnJ1TWhGTnY0/SzBhelJTZWhFbz0", // Firefighter
  },
  {
    title: "Privacy-First Cameras",
    link: "/features/privacy-cameras",
    thumbnail: "https://imgs.search.brave.com/x0fCMrMboG_x8gFzsS8unss2p5Ab018D0u9T1Z4ynHk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMjE0/OTI1OTgxNS9waG90/by9maXJlZmlnaHRl/cnMtZXh0aW5ndWlz/aGluZy1ibGF6ZS1p/bi1pbmR1c3RyaWFs/LWFyZWEuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPXpqNHFy/UDM4bTdHazBCbU51/NFl0YUN2WXNJWWps/ODlQZTVReFhsVnkz/LUE9", // Security camera
  },
  {
    title: "Real-Time Alerts",
    link: "/features/real-time-alerts",
    thumbnail: "https://imgs.search.brave.com/EDQU8W58Czjo66r6bnyX5v8OoFe4sIUO-812WdoLGR8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/d21mcy5uZXQvd3At/Y29udGVudC91cGxv/YWRzLzIwMjMvMDQv/VUstRW1lcmdlbmN5/LUFsZXJ0cy03Njh4/NTk5LmpwZw", // Alarm
  },
  {
    title: "Incident Dashboard",
    link: "/dashboard",
    thumbnail: "https://imgs.search.brave.com/52z7rx_nfMHq0r69eNL6a0CnHmzkTwxFtJAUbu3TiLA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTI4/MDE1NDMyOC92ZWN0/b3IvaW5mb2dyYXBo/aWMtZGFzaGJvYXJk/LXRlbXBsYXRlLXNp/bXBsZS1ncmVlbi1i/bHVlLWRlc2lnbi1v/Zi1pbnRlcmZhY2Ut/YWRtaW4tcGFuZWwt/d2l0aC1ncmFwaHMu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PVBJWXgxRXpkMXN5/eDJ6WnB3OFpoRm5D/LVFwZEdVcU53RGRa/Vjd5dFhXakE9", // Dashboard
  },
  {
    title: "Mobile App Integration",
    link: "/mobile-app",
    thumbnail: "https://imgs.search.brave.com/v1Lf0joahQxK8O2iHPb7uvXAsEDpM_zzndpTS7pF75g/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA0Lzc4LzA4LzMx/LzM2MF9GXzQ3ODA4/MzE4M182Q1FaS2Fp/TUw0bHlUQktPeDQ1/MEtDUmtVMGFFeGtW/SC5qcGc", // Mobile app
  },
  {
    title: "Role-Based Access",
    link: "/features/roles",
    thumbnail: "https://imgs.search.brave.com/wytKWwRavkluFaJ4Pxe2btwIoOJEnEfUkR47dTWRL88/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cy4x/MjNyZi5jb20vNDUw/d20vcGhvdG9ucGhv/dG8vcGhvdG9ucGhv/dG8yMTA0L3Bob3Rv/bnBob3RvMjEwNDAw/NDQ5LzE2NzY0NjE5/My1pbnRlcm5ldC1i/dXNpbmVzcy10ZWNo/bm9sb2d5LWFuZC1u/ZXR3b3JrLWNvbmNl/cHQtY3liZXItc2Vj/dXJpdHktZGF0YS1w/cm90ZWN0aW9uLWJ1/c2luZXNzLXRlY2hu/b2xvZ3kuanBnP3Zl/cj02", // Teamwork
  },
  {
    title: "Cloud Sync",
    link: "/features/cloud-sync",
    thumbnail: "https://imgs.search.brave.com/vf2n0E8_BHt6U16YxVPL4c_-yBsv2wOx7OB7k5tmIC0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzExLzIwLzMyLzUw/LzM2MF9GXzExMjAz/MjUwNzNfNEhkRjZC/TGxmSnV5dXV3VVBU/elRTSnVGYlRwTHBa/RUIuanBn", // Cloud
  },
  {
    title: "Incident History",
    link: "/incidents",
    thumbnail: "https://imgs.search.brave.com/7FnwqkEebigGW0ZV1CRqhGBiTmxYlxmQbFVR8C2zlYE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdDUu/ZGVwb3NpdHBob3Rv/cy5jb20vNjMzODI0/Mi82NjIyOC9pLzQ1/MC9kZXBvc2l0cGhv/dG9zXzY2MjI4ODc1/Mi1zdG9jay1waG90/by1pbmNpZGVudC1t/YW5hZ2VtZW50LXBy/b2Nlc3MtYnVzaW5l/c3MtdGVjaG5vbG9n/eS5qcGc", // Archive
  },
  {
    title: "First Responder Tools",
    link: "/features/responders",
    thumbnail: "https://imgs.search.brave.com/HOjWQM0mNDDgsggPRLbrYVw893N9qJtWeEM4PtZN-Mg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjE1/NDI2Mjk1MS9waG90/by9ub2lkYS1pbmRp/YS1maXJlLWJyaWdh/ZGUtcGVyc29ubmVs/LWV4dGluZ3Vpc2gt/dGhlLWZpcmUtYXQt/YS1leHBvcnRzLWdh/cm1lbnRzLWZhY3Rv/cnktaW4uanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPW5odVVE/ejhDS1kxdENKM0p0/a1FZZVNpMjJySjcy/V1dqV1ZpRDlTb1lM/NDg9", // Fire truck
  },
  {
    title: "Admin Analytics",
    link: "/admin",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKiwqoE0mZt7WvAAMGZY-qpo89FWklHTbGWA&s", // Analytics
  },
  {
    title: "Custom Notifications",
    link: "/features/notifications",
    thumbnail: "https://www.mindinventory.com/blog/wp-content/uploads/2022/10/push-notification.jpg", // Notification
  },
  {
    title: "API Integrations",
    link: "/features/api",
    thumbnail: "https://www.planeks.net/wp-content/uploads/2022/05/api-integration-cost.jpg", // API
  },
  {
    title: "Multi-Location Support",
    link: "/features/locations",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXxKtaA_xqSorSX8SefgDTnApiZB2c4WsFuA&s", // Locations
  },
  {
    title: "24/7 Monitoring",
    link: "/features/monitoring",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1k2do7GZkkw6aao2_M3kmPCprmx_hfTVjjA&s", // Monitoring
  },
  {
    title: "Easy Setup",
    link: "/features/setup",
    thumbnail: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAILyKwUiXBCVLoG3NBwP8HscTDQphbzDjNg&s", // Setup
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <Navbar />
      {/* Hero Parallax Animation */}
      <section className="relative z-10">
        <HeroParallax products={heroProducts} />
        <div className="py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-red-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent animate-gradient-x">
            Fire & Smoke Detection WebApp
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-200 mb-8">
            Next-gen safety platform with real-time alerts, privacy-first camera integration, and blazing fast incident response.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <a href="/login" className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-lg shadow-lg transition-all duration-200">Login</a>
            <a href="/signup" className="px-8 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-lg shadow-lg transition-all duration-200">Sign Up</a>
            <a href="/about" className="px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-lg border border-white/20 shadow-lg transition-all duration-200">Learn More</a>
          </div>
        </div>
      </section>
      {/* More homepage content can go here */}
    </main>
  );
}