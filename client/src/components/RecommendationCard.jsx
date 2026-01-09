export default function RecommendationCard({ title, match, price, items }) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h2 className="text-xl font-bold text-blue-700 mb-2 text-center">{title}</h2>
      <div className="flex items-center justify-center mb-2">
        <span className="text-blue-400 font-semibold text-lg">{match}% zgodności</span>
      </div>
      <div className="text-center mb-4 text-gray-700">{price}</div>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex flex-col items-center">
            <img
            src={item.img}
            alt={item.name}
            className="w-32 h-32 object-cover rounded-lg shadow mb-2 border transition hover:scale-160"
            crossOrigin="anonymous"
            />
            <div className="font-semibold">{item.name}</div>
            <div className="text-xs text-gray-400">{item.dose}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}