"use client"

import { signIn } from "~/auth"

export function SignIn() {
  return (
    <form
      action={async (formData) => {
        await signIn("credentials", formData)
      }}
    >
      <label>
        Email
        <input name="name" type="name" />
      </label>
      <label>
        Password
        <input name="password" type="password" />
      </label>
      <button>Sign In</button>
    </form>
  )
}