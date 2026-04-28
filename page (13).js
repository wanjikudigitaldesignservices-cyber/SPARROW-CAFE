"use client";

import { useState, useEffect } from "react";

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function confirmDelivery(orderId, returnData) {
    setSubmitting({ ...submitting, [orderId]: true });
    try {
      const res = await fetch("/api/bottle-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          cratesDelivered: returnData.cratesDelivered,
          bottlesReturned: returnData.bottlesReturned,
          returnStatus: returnData.returnStatus,
          notes: returnData.notes
        })
      });
      setSubmitting({ ...submitting, [orderId]: false });
      if (res.ok) fetchOrders();
    } catch (err) {
      setSubmitting({ ...submitting, [orderId]: false });
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-600">Loading orders...</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Deliveries</h2>

      {orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          No dispatched orders assigned to you
        </div>
      )}

      {orders.map((order) => (
        <DeliveryCard
          key={order._id}
          order={order}
          onConfirm={(data) => confirmDelivery(order._id, data)}
          submitting={submitting[order._id]}
        />
      ))}
    </div>
  );
}

function DeliveryCard({ order, onConfirm, submitting }) {
  const [returnStatus, setReturnStatus] = useState("full");
  const [bottlesReturned, setBottlesReturned] = useState(0);
  const [notes, setNotes] = useState("");

  const totalCrates = order.crates?.length || 0;
  const totalSlots =
    order.crates?.reduce((sum, c) => sum + (c.slotsTotal || 0), 0) || 0;

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      cratesDelivered: totalCrates,
      bottlesReturned:
        returnStatus === "full"
          ? totalSlots
          : returnStatus === "none"
          ? 0
          : Number(bottlesReturned),
      returnStatus,
      notes
    });
  }

  if (order.status === "delivered") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{order.retailer?.name}</h3>
            <p className="text-sm text-gray-500">{order.retailer?.phone}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Delivered
          </span>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {order.crates?.map((c, i) => (
            <span key={i} className="mr-3">
              {c.crateType}: {c.slotsTotal} units
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="font-bold text-lg">{order.retailer?.name}</h3>
        <p className="text-sm text-gray-500">{order.retailer?.phone}</p>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {order.crates?.map((c, i) => (
          <span key={i} className="mr-3">
            {c.crateType}: {c.slotsTotal} units
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bottle Return
          </label>
          <div className="flex gap-2">
            {["full", "partial", "none"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReturnStatus(status)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  returnStatus === status
                    ? "bg-[#D85A30] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "full"
                  ? "Full Return"
                  : status === "partial"
                  ? "Partial"
                  : "None"}
              </button>
            ))}
          </div>
        </div>

        {returnStatus === "partial" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bottles Returned
            </label>
            <input
              type="number"
              min="0"
              max={totalSlots}
              value={bottlesReturned}
              onChange={(e) => setBottlesReturned(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#D85A30] text-white rounded-xl font-medium hover:bg-[#c44e28] transition disabled:opacity-50"
        >
          {submitting ? "Confirming..." : "Confirm Delivery"}
        </button>
      </form>
    </div>
  );
}
