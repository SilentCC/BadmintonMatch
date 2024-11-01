// components/SignInButton.tsx
'use client';
import { useRouter } from 'next/navigation';

const SignInButton = () => {
  const router = useRouter();

  const handleSignInClick = () => {
    router.push('/login');
  };

  return (
    <div className="navbar-end">
      <button className="btn" onClick={handleSignInClick}>
        Sign In
      </button>
    </div>
  );
};

export default SignInButton;
