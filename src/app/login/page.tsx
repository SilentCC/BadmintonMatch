import { redirect } from 'next/navigation';
import { signIn } from '~/auth';
import AlertDialog from '~/components/AlertDialog';
import { AuthError } from '@auth/core/errors';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { error } from 'console';

export default function SignIn({ searchParams }: { searchParams: any }) {
  const errorMessage = searchParams.error || null;
  return (
    <div>
      <form
        className="flex flex-col items-center gap-4 max-w-md w-full p-4 mx-auto"
        action={async (formData) => {
          'use server';
          let errorMessage = '';
          try {
            const result = await signIn('credentials', {
              name: formData.get('name'),
              password: formData.get('password'),
              redirect: false,
            });

            console.log("ok1");
            console.log(result);
            console.log("ok2");
          } catch (error) {
            console.log(error);
            if (isRedirectError(error)) {
              throw error;
            }
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
            }
          }
          if (errorMessage) {
            redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
          } else {
            redirect(`/`);
          }
        }}
      >
        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Username"
            name="name"
          />
        </label>
        <label className="input input-bordered flex items-center gap-2 w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="password"
            className="grow"
            placeholder="password"
            name="password"
          />
        </label>
        <div className="stats shadow w-full">
          <div className="stat place-items-center">
            <div className="stat-title">Don't have an account?</div>
            <div className="stat-title">
              <a href="/register">Sign Up</a>
            </div>
          </div>
        </div>
      </form>
      {errorMessage && <AlertDialog message={errorMessage} />}
       <form
      action={async () => {
        "use server"
        await signIn("github")
      }}
    >
      <button type="submit">Signin with GitHub</button>
    </form>
    </div>
  );
}
