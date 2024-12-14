import Link from 'next/link'
import UserAvatar from './UserAvatar'

export default function Header() {
  return (
    <div className="navbar bg-slate-800 text-white flex justify-between">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-slate-800 rounded-box w-52">
            <li>
              <Link href="/single-player-rank" className="text-white hover:bg-slate-700">
                Single Player Rank
              </Link>
            </li>
            <li>
              <Link href="/double-player-rank" className="text-white hover:bg-slate-700">
                Double Player Rank
              </Link>
            </li>
            <li>
              <Link href="/match" className="text-white hover:bg-slate-700">
                Match
              </Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl text-white hover:bg-slate-700">Badminton</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 space-x-2">
          <li>
            <Link href="/single-player-rank" className="text-white hover:bg-slate-700 rounded-lg">
              Single Player Rank
            </Link>
          </li>
          <li>
            <Link href="/double-player-rank" className="text-white hover:bg-slate-700 rounded-lg">
              Double Player Rank
            </Link>
          </li>
          <li>
            <Link href="/match" className="text-white hover:bg-slate-700 rounded-lg">
              Match
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <UserAvatar/>
      </div>
    </div>
  );
}
