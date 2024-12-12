'use client';

import { auth, signOut } from '~/auth';
import SignInButton from './SignInButton';

export default async function UserAvatar() {
  const session = await auth();

  if (!session?.user) {
    return <SignInButton />;
  }

  const { user } = session;
  const defaultAvatar = 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';
  const avatarUrl = user.avatarUrl ?? user.image ?? defaultAvatar;

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full">
          <img
            alt={`${user.name || 'User'}'s avatar`}
            src={avatarUrl}
            className="object-cover w-full h-full"
          />
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
      >
        <li>
          <a className="justify-between">
            <span className="truncate">{user.name || user.email}</span>
            {user.provider && (
              <span className="badge badge-sm">{user.provider}</span>
            )}
          </a>
        </li>
        <li>
          <a href="/profile">Profile</a>
        </li>
        <li>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button type="submit" className="w-full text-left">Logout</button>
          </form>
        </li>
      </ul>
    </div>
  );
}
