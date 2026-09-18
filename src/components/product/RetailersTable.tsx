import { type Retailer } from "@/types";
import { formatPKR } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

export function RetailersTable({ retailers, phoneName }: { retailers?: Retailer[], phoneName: string }) {
  if (!retailers || retailers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mt-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
        Latest Price of {phoneName} in Pakistan
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Store / Retailer</th>
              <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Price (PKR)</th>
              <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Condition</th>
              <th className="py-4 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {retailers.map((retailer, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900">{retailer.store}</div>
                  <div className="text-xs text-gray-500 mt-1">{retailer.delivery}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-gray-900 text-lg">{formatPKR(retailer.price)}</div>
                  {retailer.in_stock ? (
                    <div className="text-xs text-green-600 font-medium mt-1 inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 block"></span> In Stock
                    </div>
                  ) : (
                    <div className="text-xs text-red-500 font-medium mt-1 inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 block"></span> Out of Stock
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {retailer.condition}
                </td>
                <td className="py-4 px-4">
                  <a
                    href={retailer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    View Offer <ShoppingCart className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
