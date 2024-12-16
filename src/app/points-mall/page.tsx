const rewards = [
  {
    id: '1',
    name: 'Badminton Racket',
    description: 'Professional-grade badminton racket',
    pointCost: 500,
    category: 'Sports Equipment',
    imageUrl: 'https://via.placeholder.com/250x250?text=Badminton+Racket',
    stock: 10
  },
  {
    id: '2',
    name: 'Match Ticket',
    description: 'Free entry to a local badminton tournament',
    pointCost: 200,
    category: 'Event',
    imageUrl: 'https://via.placeholder.com/250x250?text=Match+Ticket',
    stock: 20
  },
  {
    id: '3',
    name: 'Training Session',
    description: '1-hour coaching session with a pro',
    pointCost: 300,
    category: 'Training',
    imageUrl: 'https://via.placeholder.com/250x250?text=Training+Session',
    stock: 5
  },
  {
    id: '4',
    name: 'Sports Water Bottle',
    description: 'High-quality insulated water bottle',
    pointCost: 100,
    category: 'Accessories',
    imageUrl: 'https://via.placeholder.com/250x250?text=Water+Bottle',
    stock: 30
  }
];

export default function PointsMallPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Points Mall</h1>
        <div className="badge badge-primary badge-lg">
          Your Points: 1000
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <div key={reward.id} className="card bg-base-100 shadow-xl">
            <figure className="px-10 pt-10">
              <img 
                src={reward.imageUrl} 
                alt={reward.name} 
                width={250} 
                height={250} 
                className="rounded-xl" 
              />
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">{reward.name}</h2>
              <p>{reward.description}</p>
              <div className="flex items-center space-x-2">
                <span className="badge badge-secondary">
                  {reward.pointCost} Points
                </span>
                <span className="badge badge-ghost">
                  Stock: {reward.stock}
                </span>
              </div>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary"
                  disabled={1000 < reward.pointCost || reward.stock === 0}
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Purchase History</h2>
        <p className="text-center text-gray-500">No purchase history yet</p>
      </div>
    </div>
  );
}
