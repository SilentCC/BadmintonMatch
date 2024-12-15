import { redirect } from 'next/navigation';
import { signIn } from '~/auth';
import AlertDialog from '~/components/AlertDialog';
import { AuthError } from '@auth/core/errors';
import { AiFillGithub } from 'react-icons/ai';
import { AiFillGoogleCircle } from 'react-icons/ai';
import { AiFillTwitterCircle } from 'react-icons/ai';

export default function SignIn({ searchParams }: { searchParams: any }) {
  const errorMessage = searchParams.error || null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold">Login</h2>
          <form 
            className="space-y-4"
            action={async (formData) => {
              'use server';
              let errorMessage = '';
              try {
                 await signIn('credentials', {
                  name: formData.get('name'),
                  password: formData.get('password'),
                  redirect: false,
                });

              } catch (error) {
                console.log(error);
                console.log('1111');
                
                if (error instanceof AuthError) {
                  if (error.cause?.err instanceof Error) {
                    errorMessage = error.cause.err.message;
                  } else {
                    switch (error.type) {
                      case 'CredentialsSignin':
                        errorMessage = 'Invalid credentials';
                        break;
                      default:
                        errorMessage = 'Unknown error';
                        break;
                    }
                  }
                } else if (error instanceof Error) {
                  errorMessage = error.message;
                } else {
                  errorMessage = 'An unknown error occurred';
                }
              } finally {
                if (errorMessage) {
                  redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
                } else {
                  redirect(`/`);
                }
              }
            }}
          >
            {/* Name Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="input input-bordered w-full"
                name="name"
              />
            </div>

            {/* Password Input */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered w-full"
                name="password"
              />
            </div>

            {/* Submit Button */}
            <div className="form-control w-full mt-6">
              <button className="btn btn-primary w-full" type="submit">
                Login
              </button>
            </div>
          </form>

          {/* Social Login Buttons */}
          <div className="divider">OR</div>
          <div className="grid grid-cols-3 gap-2">
            <form
              action={async () => {
                'use server';
                await signIn('github');
              }}
            >
              <button type="submit" className="btn btn-outline w-full gap-2">
                <AiFillGithub className="w-5 h-5" />
                GitHub
              </button>
            </form>
            <form
              action={async () => {
                'use server';
                await signIn('google');
              }}
            >
              <button type="submit" className="btn btn-outline w-full gap-2">
                <AiFillGoogleCircle className="w-5 h-5" />
                Google
              </button>
            </form>
            <form
              action={async () => {
                'use server';
                await signIn('twitter');
              }}
            >
              <button type="submit" className="btn btn-outline w-full gap-2">
                <AiFillTwitterCircle className="w-5 h-5" />
                Twitter
              </button>
            </form>
          </div>

          {/* Register Link */}
          <div className="text-center mt-4">
            <p>
              Don&#39;t have an account?{' '}
              <a href="/register" className="link link-primary">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>

      {errorMessage && <AlertDialog message={errorMessage} />}
    </div>
  );
}
