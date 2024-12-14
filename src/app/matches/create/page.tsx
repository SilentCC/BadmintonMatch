import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { prisma } from "~/server/prisma";
import CreateMatchForm from "~/components/CreateMatchForm";

export default async function CreateMatchPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch users and partnerships for dropdown selections
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      nickname: true
    }
  });

  const partnerships = await prisma.partnership.findMany({
    include: {
      player1: {
        select: { id: true, name: true, nickname: true }
      },
      player2: {
        select: { id: true, name: true, nickname: true }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Match</h1>
      <CreateMatchForm 
        users={users} 
        partnerships={partnerships} 
      />
    </div>
  );
}

export const metadata = {
  title: 'Create Match',
};
