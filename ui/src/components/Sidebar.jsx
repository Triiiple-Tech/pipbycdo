import { Home, Folder, FileText, HelpCircle } from 'lucide-react';

const nav = [
  { label: 'Home', icon: Home, key: 'home' },
  { label: 'Files', icon: Folder, key: 'files' },
  { label: 'Projects', icon: FileText, key: 'projects' },
  { label: 'Help', icon: HelpCircle, key: 'help' },
];

export default function Sidebar({ active = 'home', onNav }) {
  return (
    <aside
      className="
        fixed left-0 top-0 z-50
        flex flex-col items-center
        w-20 h-screen
        bg-white/30 backdrop-blur
        shadow-lg border-r border-gray-200
        pt-8 pb-8
      "
      aria-label="Sidebar"
    >
      <nav
        className="flex flex-col items-center gap-10 w-full"
        role="navigation"
      >
        {nav.map(({ label, icon: Icon, key }) => (
          <button
            key={key}
            className={`
              flex flex-col items-center group cursor-pointer outline-none
              transition-all duration-300 ease-out
              focus:ring-2 focus:ring-cdo-red
              hover:scale-105 active:scale-95
            `}
            aria-label={label}
            onClick={() => onNav && onNav(key)}
          >
            <div
              className={`
                w-10 h-10 flex items-center justify-center rounded-full
                ${
                  active === key
                    ? 'bg-cdo-red/90 shadow-lg'
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }
                transition-all duration-300
              `}
            >
              <Icon
                className={`
                  w-7 h-7
                  ${
                    active === key
                      ? 'text-white'
                      : 'text-gray-500 group-hover:text-cdo-red'
                  }
                  transition-all duration-300
                `}
                strokeWidth={2.1}
              />
            </div>
            <span
              className={`
                text-xs font-medium tracking-widest pt-2
                ${active === key ? 'text-cdo-red' : 'text-gray-700 group-hover:text-cdo-red'}
                transition-all duration-300
              `}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
