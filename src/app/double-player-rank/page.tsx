'use server'

import { DoublePlayerRankings } from '~/components/DoublePlayerRankings'

export default async function DoublePlayerRankPage() {
  return (
    <div className="container mx-auto p-4">
      <DoublePlayerRankings />
    </div>
  );
}
