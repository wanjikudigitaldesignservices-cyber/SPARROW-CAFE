"use client";

import { useState, useEffect } from "react";

const SLOT_RULES = {
  "300ml": 24,
  "500ml": 24,
  "1L": 12,
  "maid": 12,
  "dasani": 24,
  "monster": 24
};

const CRATE_LABELS = {
  "300ml": "300ml Crate",
  "500ml": "500ml Crate",
  "1L": "1L Crate",
  "maid": "Minute Maid Bag",
  "dasani": "Dasani Case",
  "monster": "Monster Case"
};

export default function RetailerDashboard() {
  const [products, setProducts] = useState({});
  const [crates, setCrates] = useState([]);
  const [selectedType, setSelectedType] = useState("300ml");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function addCrate() {
    const crate = {
      id: Date.now(),
      crateType: selectedType,
      items: {}
    };
    if (products[selectedType]) {
      products[selectedType].forEach((p) => {
        crate.items[String(p._id)] = 0;
      });
    }
    setCrates([...crates, crate]);
  }

  function updateQty(crateId, productId, delta) {
    setCrates(
      crates.map((crate) => {
        if (crate.id !== crateId) return crate;
        const currentQty = crate.items[productId] || 0;
        const newQty = Math.max(0, currentQty + delta);
        const totalUsed =
          Object.values(crate.items).reduce((sum, q) => sum + q, 0) -
          currentQty +
          newQty;
        if (totalUsed > SLOT_RULES[crate.crateType]) return crate;
        return { ...crate, items: { ...crate.items, [productId]: newQty } };
      })
    );
  }

  function removeCrate(crateId) {
    setCrates(crates.filter((c) => c.id !== crateId));
  }

  function getCrateTotal(crate) {
    return Object.values(crate.items).reduce((sum, q) => sum + q, 0);
  }

  function getCratePrice(crate) {
    let total = 0;
    if (!products[crate.crateType]) return 0;
    products[crate.crateType].forEach((p) => {
      total += (crate.items[String(p._id)] || 0) * p.priceKes;
    });
    return total;
  }

  function getGrandTotal() {
    return crates.reduce((sum, c) => sum + getCratePrice(c), 0);
  }

  function getTotalUnits() {
    return crates.reduce((sum, c) => sum + getCrateTotal(c), 0);
  }

  async function placeOrder() {
    for (const crate of crates) {
      if (getCrateTotal(crate) !== SLOT_RULES[crate.crateType]) {
        alert("All crates must be full before placing order");
        return;
      }
    }
    if (crates.length === 0) {
      alert("Add at least one crate");
      return;
    }

    const payload = crates.map((crate) => ({
      crateType: crate.crateType,
      items: Object.entries(crate.items)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({ productId, quantity }))
    }));

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crates: payload })
      });
      setPlacing(false);
      if (res.ok) {
        setSuccess(true);
        setCrates([]);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      setPlacing(false);
      alert("Network error");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">Loading products...</div>
    );
  }

  return (
    <div className="pb-32">
      <h2 className="text-2xl font-bold mb-6">Crate Builder</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(SLOT_RULES).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedType === type
                ? "bg-[#D85A30] text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {CRATE_LABELS[type]}
          </button>
        ))}
      </div>

      <button
        onClick={addCrate}
        className="mb-6 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
      >
        Add Crate
      </button>

      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl font-medium">
          Order placed successfully!
        </div>
      )}

      <div className="space-y-4">
        {crates.map((crate) => {
          const total = getCrateTotal(crate);
          const max = SLOT_RULES[crate.crateType];
          const isFull = total === max;

          return (
            <div key={crate.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {CRATE_LABELS[crate.crateType]}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-sm font-medium ${
                        isFull ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {total}/{max} slots
                    </span>
                    {!isFull && (
                      <span className="text-xs text-amber-600">Not full</span>
                    )}
                    {isFull && (
                      <span className="text-xs text-green-600">Full</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeCrate(crate.id)}
                  className="text-red-500 text-sm hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="flex gap-1 mb-4 flex-wrap">
                {Array.from({ length: max }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      i < total ? "bg-[#D85A30]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-3">
                {products[crate.crateType]?.map((product) => (
                  <div
                    key={String(product._id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        KES {product.priceKes}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQty(crate.id, String(product._id), -1)
                        }
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30"
                        disabled={crate.items[String(product._id)] === 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">
                        {crate.items[String(product._id)] || 0}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(crate.id, String(product._id), 1)
                        }
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30"
                        disabled={total >= max}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t text-right font-medium text-sm">
                Crate Total: KES {getCratePrice(crate)}
              </div>
            </div>
          );
        })}
      </div>

      {crates.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {crates.length} crate(s) &bull; {getTotalUnits()} units
              </p>
              <p className="text-xl font-bold">KES {getGrandTotal()}</p>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing}
              className="px-8 py-3 bg-[#D85A30] text-white rounded-xl font-medium hover:bg-[#c44e28] transition disabled:opacity-50"
            >
              {placing ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
