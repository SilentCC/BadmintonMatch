'use server'

import { SinglePlayerRankings } from '~/components/SinglePlayerRankings'

export default async function SinglePlayerRankPage() {
  return (
    <div className="container mx-auto p-4">
      <SinglePlayerRankings />
    </div>
  );
}
