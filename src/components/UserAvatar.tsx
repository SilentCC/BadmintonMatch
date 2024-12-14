import { auth, signOut } from '~/auth';
import SignInButton from './SignInButton';
import type { User } from '@prisma/client';

type UserAvatarProps = {
  user?: User;
};

export default async function UserAvatar({ user: propUser }: UserAvatarProps = {}) {
  const session = await auth();
  const user = propUser ?? session?.user;

  if (!user) {
    return <SignInButton />;
  }

  const defaultAvatar = 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';
  const avatarUrl = user.image ?? defaultAvatar;

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full">
          <img
            alt={`${user.name ?? 'User'}'s avatar`}
            src={avatarUrl}
            className="object-cover w-full h-full"
          />
        </div>
      </div>
      {session?.user && (
        <ul
          tabIndex={0}
          className="menu dropdown-content z-[1] p-2 shadow bg-slate-800 rounded-box w-52 mt-3 text-white"
        >
          <li className="hover:bg-slate-700 rounded">
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[120px]">{user.name ?? user.email}</span>
            </div>
          </li>
          <li className="hover:bg-slate-700 rounded">
            <a href="/profile" className="text-white">Profile</a>
          </li>
          <li className="hover:bg-slate-700 rounded">
            <form
              action={async () => {
                'use server';
                await signOut();
              }}
            >
              <button type="submit" className="w-full text-left text-white">Logout</button>
            </form>
          </li>
        </ul>
      )}
    </div>
  );
}